import {
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency, formatDate } from "@/utils/format";
import { TransactionStatus } from "@sistema-pagamentos/shared";

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) return <Loading />;
  if (!stats) return <p className="text-gray-500">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Total Transações"
          value={String(stats.totalTransactions)}
          icon={<ArrowLeftRight className="h-6 w-6" />}
        />
        <Card
          title="Valor Total Cartões"
          value={formatCurrency(stats.totalCardValue)}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <Card
          title="Total Taxas"
          value={formatCurrency(stats.totalFeeAmount)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <Card
          title="Total Líquido"
          value={formatCurrency(stats.totalNetAmount)}
          icon={<Wallet className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Por Status</h2>
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge status={status as TransactionStatus} />
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Transações Recentes
            </h2>
            <div className="space-y-3">
              {stats.recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.compradorName}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(t.cardBalance)}
                    </p>
                    <Badge status={t.status} />
                  </div>
                </div>
              ))}
              {stats.recentTransactions.length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma transação ainda.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
