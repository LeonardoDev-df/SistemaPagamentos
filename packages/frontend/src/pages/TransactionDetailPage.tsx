import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Clock, Copy, Check, Key, Phone, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useTransaction, useUpdateStatus, useUploadReceipt } from "@/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDateTime } from "@/utils/format";
import toast from "react-hot-toast";
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
  const [payModal, setPayModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <Loading />;
  if (!transaction) return <p className="text-gray-500">Transação não encontrada.</p>;

  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.COMPRADOR;
  const allowedTransitions = ALLOWED_TRANSITIONS[transaction.status];
  const isPendingPayment = transaction.status === TransactionStatus.NAO_PAGO || transaction.status === TransactionStatus.COMPRADO || transaction.status === TransactionStatus.CARTAO_OK;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePayment = async () => {
    // Mark as PAGO
    await updateStatus.mutateAsync({
      id: id!,
      status: TransactionStatus.PAGO,
      note: statusNote || "Pagamento realizado",
    });

    // Upload receipt
    if (paymentReceipt) {
      await uploadReceipt.mutateAsync({ id: id!, file: paymentReceipt });
    }

    setPayModal(false);
    setStatusNote("");
    setPaymentReceipt(null);
    toast.success("Pagamento registrado!");
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    await updateStatus.mutateAsync({
      id: id!,
      status: selectedStatus,
      note: statusNote || undefined,
    });

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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes da Transação</h1>
          <p className="text-sm text-gray-500">{transaction.vendedorName} - {transaction.cardBrand} {transaction.cardType}</p>
        </div>
      </div>

      {/* Payment action card for pending transactions */}
      {canEdit && isPendingPayment && (
        <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-sm font-medium">Valor a pagar</p>
              <p className="text-3xl font-extrabold">{formatCurrency(transaction.netAmount)}</p>
            </div>
            <Badge status={transaction.status} />
          </div>

          {/* Vendedor PIX info */}
          {transaction.vendedorPixKey && (
            <div className="bg-white/10 rounded-xl p-3 mb-3 space-y-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Chave PIX do Vendedor</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-accent-400" />
                  <span className="font-mono text-sm font-semibold">{transaction.vendedorPixKey}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(transaction.vendedorPixKey!, "Chave PIX")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                >
                  {copied === "Chave PIX" ? <Check className="h-3.5 w-3.5 text-accent-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "Chave PIX" ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          {transaction.vendedorPhone && (
            <div className="bg-white/10 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent-400" />
                  <span className="text-sm">{transaction.vendedorPhone}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(transaction.vendedorPhone!, "Telefone")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                >
                  {copied === "Telefone" ? <Check className="h-3.5 w-3.5 text-accent-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "Telefone" ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          <Button variant="accent" className="w-full !py-3" onClick={() => setPayModal(true)}>
            <DollarSign className="h-5 w-5" />
            Registrar Pagamento
          </Button>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-5 sm:p-6 space-y-5">
        {/* Status + Actions */}
        <div className="flex items-center justify-between">
          <Badge status={transaction.status} />
          {canEdit && allowedTransitions.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setStatusModal(true)}>
              Alterar Status
            </Button>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Vendedor" value={transaction.vendedorName} />
          <InfoItem label="Bandeira / Tipo" value={`${transaction.cardBrand ?? "-"} ${transaction.cardType}`} />
          {transaction.cardNumber && <InfoItem label="Número do Cartão" value={transaction.cardNumber} mono />}
          <InfoItem label="Valor Cartão" value={formatCurrency(transaction.cardValue)} />
          <InfoItem label="Saldo Comprado" value={formatCurrency(transaction.cardBalance)} />
          <InfoItem label="Desconto" value={`${transaction.feePercentage}% (${formatCurrency(transaction.feeAmount)})`} />
          <InfoItem label="Valor Pago ao Vendedor" value={formatCurrency(transaction.netAmount)} highlight />
          <InfoItem label="Data da Compra" value={formatDateTime(transaction.saleDate)} />
          {transaction.paymentDate && <InfoItem label="Data Pagamento" value={formatDateTime(transaction.paymentDate)} />}
          {transaction.vendedorPixKey && <InfoItem label="PIX Vendedor" value={transaction.vendedorPixKey} />}
        </div>

        {/* Receipt */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Comprovante de Pagamento</h3>
          {transaction.receiptUrl ? (
            <div className="space-y-2">
              {transaction.receiptUrl.startsWith("data:application/pdf") ? (
                <Button variant="secondary" size="sm" onClick={() => {
                  const byteString = atob(transaction.receiptUrl!.split(",")[1]);
                  const ab = new ArrayBuffer(byteString.length);
                  const ia = new Uint8Array(ab);
                  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                  const blob = new Blob([ab], { type: "application/pdf" });
                  window.open(URL.createObjectURL(blob), "_blank");
                }}>
                  <Upload className="h-4 w-4" /> Ver comprovante (PDF)
                </Button>
              ) : (
                <img src={transaction.receiptUrl} alt="Comprovante" className="max-w-full max-h-96 rounded-xl border border-gray-200" />
              )}
            </div>
          ) : canEdit ? (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
              <Button variant="secondary" size="sm" loading={uploadReceipt.isPending} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Enviar Comprovante
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sem comprovante.</p>
          )}
        </div>

        {/* Status History */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Histórico</h3>
          <div className="space-y-3">
            {transaction.statusHistory.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 font-medium">
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

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Registrar Pagamento">
        <div className="space-y-4">
          <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 text-center">
            <p className="text-sm text-accent-700 font-medium">Valor a pagar para {transaction.vendedorName}</p>
            <p className="text-3xl font-extrabold text-accent-800 mt-1">{formatCurrency(transaction.netAmount)}</p>
          </div>

          {transaction.vendedorPixKey && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 font-semibold mb-1">Chave PIX</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-gray-900">{transaction.vendedorPixKey}</span>
                <button
                  onClick={() => copyToClipboard(transaction.vendedorPixKey!, "PIX")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-100 text-primary-700 text-xs font-semibold hover:bg-primary-200 transition-colors"
                >
                  {copied === "PIX" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "PIX" ? "Copiado!" : "Copiar PIX"}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comprovante de Pagamento</label>
            <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 px-4 py-5 cursor-pointer transition-colors bg-gray-50 hover:bg-primary-50/50">
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {paymentReceipt ? paymentReceipt.name : "Clique para anexar comprovante"}
              </span>
              <input type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => setPaymentReceipt(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observação (opcional)</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none"
              rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Ex: Pago via PIX" />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPayModal(false)}>Cancelar</Button>
            <Button variant="accent" onClick={handlePayment} loading={updateStatus.isPending || uploadReceipt.isPending}>
              <Check className="h-4 w-4" /> Confirmar Pagamento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generic Status Change Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Alterar Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Novo Status</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none"
              value={selectedStatus ?? ""} onChange={(e) => setSelectedStatus(e.target.value as TransactionStatus)}>
              <option value="">Selecione...</option>
              {allowedTransitions.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {selectedStatus === TransactionStatus.PAGO && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comprovante</label>
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 px-4 py-5 cursor-pointer transition-colors bg-gray-50 hover:bg-primary-50/50">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {paymentReceipt ? paymentReceipt.name : "Anexar comprovante"}
                </span>
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => setPaymentReceipt(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observação (opcional)</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none"
              rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancelar</Button>
            <Button onClick={handleStatusChange} loading={updateStatus.isPending} disabled={!selectedStatus}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-accent-600" : "text-gray-900"} ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
