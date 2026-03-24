import {
  BarChart3,
  CreditCard,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/format";

export function ReportsPage() {
  const { data: stats, isLoading } = useDashboard();

  if (isLoading) return <Loading />;
  if (!stats) return <p className="text-gray-500">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral das suas operações</p>
        </div>
      </div>

      {/* Summary Cards */}
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
          title="Em Aberto"
          value={String(stats.cartoesAbertos)}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent-600" />
          Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Total Comprado</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{formatCurrency(stats.totalCardValue)}</p>
            <p className="text-xs text-blue-500 mt-1">{stats.totalTransactions} transações</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-sm text-orange-600 font-medium">Total Descontos</p>
            <p className="text-2xl font-bold text-orange-800 mt-1">{formatCurrency(stats.totalFeeAmount)}</p>
            <p className="text-xs text-orange-500 mt-1">Lucro nos descontos</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-sm text-green-600 font-medium">Total Pago a Vendedores</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(stats.totalNetAmount)}</p>
            <p className="text-xs text-green-500 mt-1">Valor líquido</p>
          </div>
        </div>
      </div>

      {/* Per Vendedor Report */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent-600" />
            Relatório por Vendedor
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Detalhamento de cada vendedor</p>
        </div>

        {stats.byVendedor.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Nenhuma transação registrada ainda.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Vendedor</th>
                    <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Cartões</th>
                    <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Transações</th>
                    <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Pagos</th>
                    <th className="px-5 py-3.5 text-center font-semibold text-gray-600">Não Pagos</th>
                    <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Faturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.byVendedor.map((v) => (
                    <tr key={v.vendedorId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {v.vendedorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{v.vendedorName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">{v.totalCartoes}</td>
                      <td className="px-5 py-3.5 text-center text-gray-600">{v.totalTransacoes}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {v.totalPago}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {v.totalNaoPago}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                        {formatCurrency(v.totalFaturado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-5 py-3.5 font-bold text-gray-900">Total</td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-900">
                      {stats.byVendedor.reduce((a, v) => a + v.totalCartoes, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-900">
                      {stats.byVendedor.reduce((a, v) => a + v.totalTransacoes, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-green-700">
                      {stats.byVendedor.reduce((a, v) => a + v.totalPago, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-red-700">
                      {stats.byVendedor.reduce((a, v) => a + v.totalNaoPago, 0)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                      {formatCurrency(stats.byVendedor.reduce((a, v) => a + v.totalFaturado, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden p-4 space-y-3">
              {stats.byVendedor.map((v) => (
                <div key={v.vendedorId} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold">
                      {v.vendedorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{v.vendedorName}</p>
                      <p className="text-xs text-gray-500">{v.totalCartoes} cartões &middot; {v.totalTransacoes} transações</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2 border border-gray-100">
                      <p className="text-lg font-bold text-green-600">{v.totalPago}</p>
                      <p className="text-[10px] text-gray-500">Pagos</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-100">
                      <p className="text-lg font-bold text-red-600">{v.totalNaoPago}</p>
                      <p className="text-[10px] text-gray-500">Não Pagos</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-100">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(v.totalFaturado)}</p>
                      <p className="text-[10px] text-gray-500">Faturado</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* By Card Type */}
      {Object.keys(stats.byCardType).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Por Tipo de Cartão</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.byCardType).map(([type, count]) => (
              <div key={type} className={`rounded-xl p-4 border ${
                type === "VR" ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"
              }`}>
                <p className={`text-sm font-medium ${type === "VR" ? "text-orange-600" : "text-emerald-600"}`}>
                  {type === "VR" ? "Vale Refeição" : "Vale Alimentação"}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                <p className="text-xs text-gray-500">transações</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
