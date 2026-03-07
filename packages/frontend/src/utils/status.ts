import { TransactionStatus, STATUS_LABELS } from "@sistema-pagamentos/shared";

export const STATUS_COLORS: Record<TransactionStatus, { bg: string; text: string }> = {
  [TransactionStatus.COMPRADO]: { bg: "bg-blue-100", text: "text-blue-800" },
  [TransactionStatus.NAO_PAGO]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [TransactionStatus.PAGO]: { bg: "bg-green-100", text: "text-green-800" },
  [TransactionStatus.CARTAO_OK]: { bg: "bg-purple-100", text: "text-purple-800" },
  [TransactionStatus.CANCELADO]: { bg: "bg-red-100", text: "text-red-800" },
};

export function getStatusLabel(status: TransactionStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: TransactionStatus) {
  return STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800" };
}
