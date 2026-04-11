import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useTransaction } from "@/hooks/useTransactions";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { STATUS_LABELS } from "@sistema-pagamentos/shared";
import {
  CreditCard,
  User,
  Key,
  Phone,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TransactionModalProps {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionModal({ transactionId, open, onClose }: TransactionModalProps) {
  const { data: transaction, isLoading } = useTransaction(transactionId ?? "");

  if (!open) return null;

  const handleDownloadReceipt = () => {
    if (!transaction?.receiptUrl) return;

    if (transaction.receiptUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = transaction.receiptUrl;
      const ext = transaction.receiptUrl.startsWith("data:application/pdf") ? "pdf" : "jpg";
      link.download = `comprovante_${transactionId}.${ext}`;
      link.click();
    } else {
      window.open(transaction.receiptUrl, "_blank");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Detalhes da Transação">
      {isLoading ? (
        <Loading />
      ) : !transaction ? (
        <p className="text-gray-500 text-center py-4">Transação não encontrada.</p>
      ) : (
        <div className="space-y-5">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Status</p>
              <div className="mt-1"><Badge status={transaction.status} /></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Valor Recebido</p>
              <p className="text-2xl font-extrabold text-green-600 mt-0.5">{formatCurrency(transaction.netAmount)}</p>
            </div>
          </div>

          {/* Vendedor Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</h3>
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-900">{transaction.vendedorName}</span>
            </div>
            {transaction.vendedorPixKey && (
              <div className="flex items-center gap-2.5">
                <Key className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">PIX: <span className="font-mono font-semibold">{transaction.vendedorPixKey}</span></span>
              </div>
            )}
            {transaction.vendedorPhone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{transaction.vendedorPhone}</span>
              </div>
            )}
          </div>

          {/* Card Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cartão</h3>
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-900">{transaction.cardBrand} {transaction.cardType}</span>
            </div>
            {transaction.cardNumber && (
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 font-mono">{transaction.cardNumber}</span>
              </div>
            )}
          </div>

          {/* Financial Details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Valores</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Valor do Cartão</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.cardValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Saldo Comprado</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(transaction.cardBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Desconto ({transaction.feePercentage}%)</span>
                </div>
                <span className="text-sm font-semibold text-red-500">-{formatCurrency(transaction.feeAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-900">Valor Pago</span>
                </div>
                <span className="text-lg font-extrabold text-green-600">{formatCurrency(transaction.netAmount)}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datas</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Data da Compra</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatDateTime(transaction.saleDate)}</span>
              </div>
              {transaction.paymentDate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Data do Pagamento</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{formatDateTime(transaction.paymentDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Receipt */}
          {transaction.receiptUrl && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comprovante</h3>
                <Button variant="secondary" size="sm" onClick={handleDownloadReceipt}>
                  <Download className="h-3.5 w-3.5" /> Baixar
                </Button>
              </div>
              {transaction.receiptUrl.startsWith("data:image/") ? (
                <img src={transaction.receiptUrl} alt="Comprovante" className="max-w-full max-h-64 rounded-lg border border-gray-200 mx-auto" />
              ) : transaction.receiptUrl.startsWith("data:application/pdf") ? (
                <p className="text-sm text-gray-600 text-center">Comprovante em PDF — clique em "Baixar" para visualizar.</p>
              ) : (
                <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-primary-600 font-medium hover:underline">
                  Ver comprovante
                </a>
              )}
            </div>
          )}

          {/* Status History */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Histórico</h3>
            <div className="space-y-2.5">
              {transaction.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
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
      )}
    </Modal>
  );
}
