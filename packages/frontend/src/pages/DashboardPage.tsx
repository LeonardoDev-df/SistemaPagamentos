import { useMemo } from "react";
import {
  DollarSign,
  ArrowLeftRight,
  TrendingUp,
  Wallet,
  ArrowRight,
  CreditCard,
  CheckCircle,
  XCircle,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useDashboard } from "@/hooks/useDashboard";
import { useCards } from "@/hooks/useCards";
import { useVendedores } from "@/hooks/useVendedores";
import { formatCurrency, formatDate } from "@/utils/format";
import { TransactionStatus } from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboard();
  const { data: allCards } = useCards();
  const { data: vendedores } = useVendedores();
  const navigate = useNavigate();

  // Due date notifications
  const vencimentos = useMemo(() => {
    if (!allCards) return [];
    const today = new Date();
    const dia = today.getDate();
    const alerts: { vendedorName: string; cardBrand: string; cardType: string; valorMensal?: number; diasRestantes: number }[] = [];

    for (const card of allCards) {
      if (!card.active || !card.diaVencimento) continue;
      const vendedor = (vendedores ?? []).find(v => v.id === card.vendedorId);
      const vendedorName = vendedor?.nome ?? card.vendedorName;

      let diasRestantes: number;
      if (card.diaVencimento >= dia) {
        diasRestantes = card.diaVencimento - dia;
      } else {
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        diasRestantes = (daysInMonth - dia) + card.diaVencimento;
      }

      if (diasRestantes <= 7) {
        alerts.push({ vendedorName, cardBrand: card.cardBrand, cardType: card.cardType, valorMensal: card.valorMensal, diasRestantes });
      }
    }
    return alerts.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [allCards, vendedores]);

  if (isLoading) return <Loading />;
  if (!stats) return <p className="text-gray-500">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Due date alerts */}
      {vencimentos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <Bell className="h-4 w-4" />
            Vencimentos Próximos ({vencimentos.length})
          </div>
          <div className="space-y-1.5">
            {vencimentos.slice(0, 5).map((v, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${v.diasRestantes === 0 ? "text-red-500" : "text-amber-500"}`} />
                  <span className="text-gray-700">
                    <span className="font-medium">{v.vendedorName}</span>
                    {" — "}{v.cardBrand} {v.cardType}
                    {v.valorMensal ? ` (R$ ${v.valorMensal.toFixed(2)})` : ""}
                  </span>
                </div>
                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  v.diasRestantes === 0 ? "bg-red-100 text-red-700" : v.diasRestantes <= 2 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {v.diasRestantes === 0 ? "Hoje!" : `${v.diasRestantes}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumo das operações</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          title="Total Cartões"
          value={String(stats.totalCartoes)}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <Card
          title="Pagos"
          value={String(stats.cartoesPagos)}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <Card
          title="Não Pagos"
          value={String(stats.cartoesNaoPagos)}
          icon={<XCircle className="h-5 w-5" />}
        />
        <Card
          title="Transações"
          value={String(stats.totalTransactions)}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card
          title="Total Comprado"
          value={formatCurrency(stats.totalCardValue)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <Card
          title="Descontos (15%)"
          value={formatCurrency(stats.totalFeeAmount)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <Card
          title="Total Pago a Vendedores"
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
                        {t.vendedorName}
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
