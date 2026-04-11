import { useMemo, useState } from "react";
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
  PackageCheck,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { TransactionModal } from "@/components/TransactionModal";
import { useDashboard } from "@/hooks/useDashboard";
import { useCards } from "@/hooks/useCards";
import { useVendedores } from "@/hooks/useVendedores";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/format";
import { TransactionStatus, STATUS_LABELS } from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboard();
  const { data: allCards } = useCards();
  const { data: vendedores } = useVendedores();
  const navigate = useNavigate();
  const { data: txData } = useTransactions({ limit: 1000 });
  const allTransactionsRaw = txData?.data ?? [];
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [detailModal, setDetailModal] = useState<string | null>(null);

  // Month filter - default to current month
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const allTransactions = useMemo(() => {
    if (!selectedMonth) return allTransactionsRaw;
    const [year, month] = selectedMonth.split("-").map(Number);
    return allTransactionsRaw.filter(t => {
      const d = new Date(t.saleDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [allTransactionsRaw, selectedMonth]);

  // Compute filtered stats
  const filteredStats = useMemo(() => {
    const pagos = allTransactions.filter(t => t.status === TransactionStatus.PAGO).length;
    const naoPagos = allTransactions.filter(t => t.status === TransactionStatus.NAO_PAGO || t.status === TransactionStatus.COMPRADO).length;
    const usados = allTransactions.filter(t => t.status === TransactionStatus.USADO).length;
    const totalCardValue = allTransactions.reduce((s, t) => s + t.cardValue, 0);
    const totalFeeAmount = allTransactions.reduce((s, t) => s + t.feeAmount, 0);
    const totalNetAmount = allTransactions.reduce((s, t) => s + t.netAmount, 0);
    return { pagos, naoPagos, usados, total: allTransactions.length, totalCardValue, totalFeeAmount, totalNetAmount };
  }, [allTransactions]);

  // Available months from all transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const t of allTransactionsRaw) {
      const d = new Date(t.saleDate);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    // Always include current month
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    return Array.from(months).sort().reverse();
  }, [allTransactionsRaw]);

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

  // Alert for cards approaching 30-day usage deadline
  const prazosUso = useMemo(() => {
    const pagos = allTransactions.filter(t => t.status === TransactionStatus.PAGO);
    const today = new Date();
    return pagos
      .map(t => {
        const saleDate = new Date(t.saleDate);
        const deadline = new Date(saleDate);
        deadline.setDate(deadline.getDate() + 30);
        const diasRestantes = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...t, diasRestantes };
      })
      .filter(t => t.diasRestantes <= 10)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [allTransactions]);

  if (isLoading) return <Loading />;
  if (!stats) return <p className="text-gray-500">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Due date alerts */}
      {vencimentos.length > 0 && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 cursor-pointer hover:bg-amber-100/50 transition-colors"
          onClick={() => setDetailModal("vencimento")}
        >
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

      {/* 30-day usage deadline alerts */}
      {prazosUso.length > 0 && (
        <div className={`border rounded-xl p-4 space-y-2 ${
          prazosUso.some(t => t.diasRestantes <= 0) ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
        }`}>
          <div className={`flex items-center gap-2 font-semibold text-sm ${
            prazosUso.some(t => t.diasRestantes <= 0) ? "text-red-800" : "text-blue-800"
          }`}>
            <CreditCard className="h-4 w-4" />
            Prazo de Uso ({prazosUso.length}) — 30 dias para usar
          </div>
          <div className="space-y-1.5">
            {prazosUso.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-white/50 -mx-1 px-1 rounded-lg transition-colors"
                onClick={() => setSelectedTxId(t.id)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${t.diasRestantes <= 0 ? "text-red-500" : t.diasRestantes <= 5 ? "text-orange-500" : "text-blue-500"}`} />
                  <span className="text-gray-700">
                    <span className="font-medium">{t.vendedorName}</span>
                    {" — "}{t.cardBrand} {t.cardType} ({formatCurrency(t.cardBalance)})
                  </span>
                </div>
                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  t.diasRestantes <= 0 ? "bg-red-100 text-red-700" : t.diasRestantes <= 5 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {t.diasRestantes <= 0 ? "Vencido!" : `${t.diasRestantes}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header + Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumo das operações</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none font-medium"
          >
            {availableMonths.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
              return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="cursor-pointer" onClick={() => setDetailModal("cartoes")}>
          <Card
            title="Total Cartões"
            value={String(stats.totalCartoes)}
            icon={<CreditCard className="h-5 w-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDetailModal("pagos")}>
          <Card
            title="Pagos"
            value={String(filteredStats.pagos)}
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDetailModal("naoPagos")}>
          <Card
            title="Não Pagos"
            value={String(filteredStats.naoPagos)}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDetailModal("usados")}>
          <Card
            title="Usados"
            value={String(filteredStats.usados)}
            icon={<PackageCheck className="h-5 w-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDetailModal("transacoes")}>
          <Card
            title="Transações"
            value={String(filteredStats.total)}
            icon={<ArrowLeftRight className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="cursor-pointer" onClick={() => setDetailModal("totalComprado")}>
          <Card
            title="Total Comprado"
            value={formatCurrency(filteredStats.totalCardValue)}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDetailModal("descontos")}>
          <Card
            title="Descontos"
            value={formatCurrency(filteredStats.totalFeeAmount)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDetailModal("totalPago")}>
          <Card
            title="Total Pago a Vendedores"
            value={formatCurrency(filteredStats.totalNetAmount)}
            icon={<Wallet className="h-5 w-5" />}
          />
        </div>
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
                    <div
                      key={status}
                      className="space-y-1.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                      onClick={() => navigate(`${ROUTES.TRANSACTIONS}?status=${status}`)}
                    >
                      <div className="flex items-center justify-between">
                        <Badge status={status as TransactionStatus} />
                        <span className="text-sm font-bold text-gray-700">{count as number}</span>
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
                    onClick={() => setSelectedTxId(t.id)}
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

      <TransactionModal
        transactionId={selectedTxId}
        open={!!selectedTxId}
        onClose={() => setSelectedTxId(null)}
      />

      {/* Detail Modals */}
      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={
          detailModal === "cartoes" ? "Total de Cartões" :
          detailModal === "pagos" ? "Transações Pagas" :
          detailModal === "naoPagos" ? "Transações Não Pagas" :
          detailModal === "usados" ? "Cartões Usados" :
          detailModal === "transacoes" ? "Todas as Transações" :
          detailModal === "totalComprado" ? "Total Comprado" :
          detailModal === "descontos" ? "Descontos Aplicados" :
          detailModal === "totalPago" ? "Total Pago a Vendedores" :
          detailModal === "vencimento" ? "Vencimentos Próximos" :
          "Detalhes"
        }
      >
        {detailModal && (
          <DashboardDetailContent
            type={detailModal}
            stats={stats}
            transactions={allTransactions}
            cards={allCards ?? []}
            vendedores={vendedores ?? []}
            vencimentos={vencimentos}
            onSelectTx={(id) => { setDetailModal(null); setSelectedTxId(id); }}
          />
        )}
      </Modal>
    </div>
  );
}

function DashboardDetailContent({ type, stats, transactions, cards, vendedores, vencimentos, onSelectTx }: {
  type: string;
  stats: any;
  transactions: any[];
  cards: any[];
  vendedores: any[];
  vencimentos: any[];
  onSelectTx: (id: string) => void;
}) {
  const filteredTx = useMemo(() => {
    switch (type) {
      case "pagos": return transactions.filter(t => t.status === TransactionStatus.PAGO);
      case "naoPagos": return transactions.filter(t => t.status === TransactionStatus.NAO_PAGO || t.status === TransactionStatus.COMPRADO);
      case "usados": return transactions.filter(t => t.status === TransactionStatus.USADO);
      case "transacoes": return transactions;
      case "totalComprado":
      case "descontos":
      case "totalPago": return transactions;
      default: return [];
    }
  }, [type, transactions]);

  if (type === "cartoes") {
    return (
      <div className="space-y-4">
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-primary-800">{stats.totalCartoes}</p>
          <p className="text-sm text-primary-600 font-medium">cartões cadastrados</p>
        </div>
        {cards.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {cards.map((c: any) => {
              const vendedor = vendedores.find((v: any) => v.id === c.vendedorId);
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{vendedor?.nome ?? c.vendedorName}</p>
                    <p className="text-xs text-gray-500">{c.cardBrand} {c.cardType}{c.cardNumber ? ` - ${c.cardNumber}` : ""}</p>
                  </div>
                  <div className="text-right">
                    {c.valorMensal != null && <p className="text-sm font-bold text-gray-900">{formatCurrency(c.valorMensal)}</p>}
                    <span className={`text-xs font-semibold ${c.active ? "text-green-600" : "text-red-500"}`}>
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum cartão cadastrado.</p>
        )}
      </div>
    );
  }

  if (type === "vencimento") {
    return (
      <div className="space-y-3">
        {vencimentos.map((v: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">{v.vendedorName}</p>
              <p className="text-xs text-gray-500">{v.cardBrand} {v.cardType}</p>
            </div>
            <div className="text-right">
              {v.valorMensal && <p className="text-sm font-bold text-gray-900">{formatCurrency(v.valorMensal)}</p>}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                v.diasRestantes === 0 ? "bg-red-100 text-red-700" : v.diasRestantes <= 2 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"
              }`}>
                {v.diasRestantes === 0 ? "Hoje!" : `em ${v.diasRestantes} dia(s)`}
              </span>
            </div>
          </div>
        ))}
        {vencimentos.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum vencimento próximo.</p>}
      </div>
    );
  }

  // Financial + transaction list modals
  const showFinancialSummary = ["totalComprado", "descontos", "totalPago"].includes(type);

  return (
    <div className="space-y-4">
      {showFinancialSummary && (
        <div className="bg-primary-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-primary-800">
            {type === "totalComprado" ? formatCurrency(stats.totalCardValue) :
             type === "descontos" ? formatCurrency(stats.totalFeeAmount) :
             formatCurrency(stats.totalNetAmount)}
          </p>
          <p className="text-sm text-primary-600 font-medium">
            {type === "totalComprado" ? "valor total comprado" :
             type === "descontos" ? "total em descontos" :
             "total pago a vendedores"}
          </p>
        </div>
      )}

      {filteredTx.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredTx.map((t: any) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onSelectTx(t.id)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.vendedorName}</p>
                <p className="text-xs text-gray-500">{t.cardBrand} {t.cardType} - {formatDate(t.saleDate)}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-bold text-gray-900">
                  {type === "descontos" ? formatCurrency(t.feeAmount) :
                   type === "totalPago" ? formatCurrency(t.netAmount) :
                   formatCurrency(t.cardBalance)}
                </p>
                <Badge status={t.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">Nenhuma transação encontrada.</p>
      )}
    </div>
  );
}
