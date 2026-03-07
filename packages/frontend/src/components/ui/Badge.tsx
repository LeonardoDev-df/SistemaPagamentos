import { TransactionStatus } from "@sistema-pagamentos/shared";
import { getStatusLabel, getStatusColor } from "@/utils/status";

interface BadgeProps {
  status: TransactionStatus;
}

export function Badge({ status }: BadgeProps) {
  const { bg, text } = getStatusColor(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
