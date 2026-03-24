import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileSpreadsheet, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useTransactions } from "@/hooks/useTransactions";
import { useVendedores } from "@/hooks/useVendedores";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate } from "@/utils/format";
import { transactionService } from "@/services/transaction.service";
import {
  TransactionStatus,
  TransactionFilters,
  UserRole,
} from "@sistema-pagamentos/shared";
import { ROUTES } from "@/config/routes";

export function TransactionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: vendedores } = useVendedores();
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading } = useTransactions(filters);

  let transactions = data?.data ?? [];
  const pagination = data?.pagination;
  const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.COMPRADOR;

  // Client-side search by vendedor name
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    transactions = transactions.filter(t =>
      t.vendedorName.toLowerCase().includes(q) ||
      (t.cardBrand ?? "").toLowerCase().includes(q)
    );
  }

  // Count by status for quick filters
  const allTx = data?.data ?? [];
  const countNaoPago = allTx.filter(t => t.status === TransactionStatus.NAO_PAGO).length;
  const countPago = allTx.filter(t => t.status === TransactionStatus.PAGO).length;
  const countComprado = allTx.filter(t => t.status === TransactionStatus.COMPRADO).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination ? `${pagination.total} registros` : "Carregando..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => transactionService.exportCsv(filters)}>
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => navigate(ROUTES.TRANSACTION_NEW)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Compra</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { label: "Todos", value: "", count: allTx.length },
          { label: "Não Pagos", value: "NAO_PAGO", count: countNaoPago, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
          { label: "Comprados", value: "COMPRADO", count: countComprado, color: "text-blue-700 bg-blue-50 border-blue-200" },
          { label: "Pagos", value: "PAGO", count: countPago, color: "text-green-700 bg-green-50 border-green-200" },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilters(f => ({ ...f, status: (tab.value as TransactionStatus) || undefined, page: 1 }))}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              (filters.status ?? "") === tab.value
                ? tab.color ?? "text-primary-700 bg-primary-50 border-primary-200"
                : "text-gray-500 bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none"
          />
        </div>
        <select
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none"
          value={filters.cardType || ""}
          onChange={(e) => setFilters(f => ({ ...f, cardType: (e.target.value as "VR" | "VA") || undefined, page: 1 }))}
        >
          <option value="">Todos tipos</option>
          <option value="VR">VR</option>
          <option value="VA">VA</option>
        </select>
        {vendedores && vendedores.length > 0 && (
          <select
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:outline-none"
            value={filters.vendedorId || ""}
            onChange={(e) => setFilters(f => ({ ...f, vendedorId: e.target.value || undefined, page: 1 }))}
          >
            <option value="">Todos vendedores</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Vendedor</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Cartão</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Saldo</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">A Pagar</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(t.saleDate)}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{t.vendedorName}</p>
                        {t.vendedorPixKey && <p className="text-xs text-gray-400">PIX: {t.vendedorPixKey}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-gray-600">{t.cardBrand} {t.cardType}</span>
                        {t.cardNumber && <p className="text-xs text-gray-400 font-mono">{t.cardNumber}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700 font-medium tabular-nums">{formatCurrency(t.cardBalance)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(t.netAmount)}</td>
                      <td className="px-5 py-3.5 text-center"><Badge status={t.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/transacoes/${t.id}`)}>
                          {t.status === TransactionStatus.NAO_PAGO || t.status === TransactionStatus.COMPRADO ? "Pagar" : "Ver"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Nenhuma transação encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-4 active:bg-primary-50/30 transition-colors"
                onClick={() => navigate(`/transacoes/${t.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{t.vendedorName}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.saleDate)} &middot; {t.cardBrand} {t.cardType}</p>
                    {t.vendedorPixKey && <p className="text-xs text-gray-400 mt-0.5">PIX: {t.vendedorPixKey}</p>}
                  </div>
                  <Badge status={t.status} />
                </div>
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Saldo</p>
                    <p className="text-sm font-medium text-gray-700">{formatCurrency(t.cardBalance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">A pagar</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(t.netAmount)}</p>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 text-gray-400">Nenhuma transação encontrada.</div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Pág. {pagination.page}/{pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={pagination.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>Anterior</Button>
                <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>Próxima</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
