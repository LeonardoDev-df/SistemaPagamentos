import {
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency, formatDate } from "@/utils/format";
import { TransactionStatus } from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboard();
  const navigate = useNavigate();

  if (isLoading) return <Loading />;
  if (!stats) return <p className="text-gray-500">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumo das operações</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          title="Transações"
          value={String(stats.totalTransactions)}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
        <Card
          title="Valor Cartões"
          value={formatCurrency(stats.totalCardValue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <Card
          title="Total Taxas"
          value={formatCurrency(stats.totalFeeAmount)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <Card
          title="Valor Líquido"
          value={formatCurrency(stats.totalNetAmount)}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* By Status */}
        <Card>
          <div className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Por Status</h2>
            {Object.keys(stats.byStatus).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhuma transação ainda.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  const total = stats.totalTransactions || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge status={status as TransactionStatus} />
                        <span className="text-sm font-bold text-gray-700">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Transações Recentes</h2>
              <button
                onClick={() => navigate(ROUTES.TRANSACTIONS)}
                className="text-xs font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-0">
              {stats.recentTransactions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Nenhuma transação ainda.</p>
              ) : (
                stats.recentTransactions.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors ${
                      i < stats.recentTransactions.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                    onClick={() => navigate(`/transacoes/${t.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {t.compradorName}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(t.cardBalance)}
                      </p>
                      <Badge status={t.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
