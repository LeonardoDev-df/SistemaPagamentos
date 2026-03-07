import { TransactionStatus } from "@sistema-pagamentos/shared";
import { getStatusLabel, getStatusColor } from "@/utils/status";

interface BadgeProps {
  status: TransactionStatus;
}

export function Badge({ status }: BadgeProps) {
  const { bg, text } = getStatusColor(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${bg} ${text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${text.replace("text-", "bg-")}`} />
      {getStatusLabel(status)}
    </span>
  );
}
