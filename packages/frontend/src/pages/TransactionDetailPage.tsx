import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useTransaction, useUpdateStatus, useUploadReceipt } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateTime } from "@/utils/format";
import {
  TransactionStatus,
  ALLOWED_TRANSITIONS,
  STATUS_LABELS,
  UserRole,
} from "@sistema-pagamentos/shared";

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: transaction, isLoading } = useTransaction(id!);
  const updateStatus = useUpdateStatus();
  const uploadReceipt = useUploadReceipt();

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <Loading />;
  if (!transaction) return <p className="text-gray-500">Transação não encontrada.</p>;

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COMPRADOR;
  const allowedTransitions = ALLOWED_TRANSITIONS[transaction.status];

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    await updateStatus.mutateAsync({
      id: id!,
      status: selectedStatus,
      note: statusNote || undefined,
    });

    // Upload receipt when marking as PAGO
    if (selectedStatus === TransactionStatus.PAGO && paymentReceipt) {
      await uploadReceipt.mutateAsync({ id: id!, file: paymentReceipt });
    }

    setStatusModal(false);
    setSelectedStatus(null);
    setStatusNote("");
    setPaymentReceipt(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReceipt.mutateAsync({ id: id!, file });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Detalhes da Transação</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Status + Actions */}
        <div className="flex items-center justify-between">
          <Badge status={transaction.status} />
          {canEdit && allowedTransitions.length > 0 && (
            <Button size="sm" onClick={() => setStatusModal(true)}>
              Alterar Status
            </Button>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Vendedor" value={transaction.vendedorName} />
          <InfoItem label="Comprador" value={transaction.compradorName} />
          <InfoItem label="Tipo" value={transaction.cardType} />
          <InfoItem label="Bandeira" value={transaction.cardBrand ?? "-"} />
          <InfoItem label="Valor Cartão" value={formatCurrency(transaction.cardValue)} />
          <InfoItem label="Saldo" value={formatCurrency(transaction.cardBalance)} />
          <InfoItem label="Desconto" value={`${transaction.feePercentage}% (${formatCurrency(transaction.feeAmount)})`} />
          <InfoItem label="Valor Pago ao Vendedor" value={formatCurrency(transaction.netAmount)} highlight />
          <InfoItem label="Data da Compra" value={formatDateTime(transaction.saleDate)} />
          {transaction.paymentDate && (
            <InfoItem label="Data Pagamento" value={formatDateTime(transaction.paymentDate)} />
          )}
        </div>

        {/* Receipt */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Comprovante de Pagamento</h3>
          {transaction.receiptUrl ? (
            <a
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 text-sm hover:underline"
            >
              Ver comprovante
            </a>
          ) : canEdit ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                loading={uploadReceipt.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Enviar Comprovante
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Sem comprovante.</p>
          )}
        </div>

        {/* Status History */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Histórico de Status</h3>
          <div className="space-y-3">
            {transaction.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-900">
                    {STATUS_LABELS[h.from]} → {STATUS_LABELS[h.to]}
                  </p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400">{formatDateTime(h.changedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Change Modal - with receipt upload for PAGO */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Alterar Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Novo Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={selectedStatus ?? ""}
              onChange={(e) => setSelectedStatus(e.target.value as TransactionStatus)}
            >
              <option value="">Selecione...</option>
              {allowedTransitions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Show receipt upload when selecting PAGO */}
          {selectedStatus === TransactionStatus.PAGO && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comprovante de Pagamento
              </label>
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-gray-300 hover:border-accent-400 px-4 py-5 cursor-pointer transition-colors bg-gray-50 hover:bg-accent-50/50">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {paymentReceipt ? paymentReceipt.name : "Clique para anexar comprovante"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setPaymentReceipt(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observação (opcional)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              loading={updateStatus.isPending || uploadReceipt.isPending}
              disabled={!selectedStatus}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-green-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
