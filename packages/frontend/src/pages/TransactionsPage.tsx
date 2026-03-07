import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { useTransactions } from "@/hooks/useTransactions";
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
  const [filters, setFilters] = useState<TransactionFilters>({});
  const { data, isLoading } = useTransactions(filters);

  const transactions = data?.data ?? [];
  const pagination = data?.pagination;
  const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.VENDEDOR;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination ? `${pagination.total} registros` : "Carregando..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => transactionService.exportCsv(filters)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => navigate(ROUTES.TRANSACTION_NEW)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <select
          className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white hover:border-gray-400 transition-colors focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
          value={filters.status || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: (e.target.value as TransactionStatus) || undefined,
              page: 1,
            }))
          }
        >
          <option value="">Todos os status</option>
          <option value="COMPRADO">Comprado</option>
          <option value="NAO_PAGO">Não Pago</option>
          <option value="PAGO">Pago</option>
          <option value="CARTAO_OK">Cartão OK</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <select
          className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white hover:border-gray-400 transition-colors focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
          value={filters.cardType || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              cardType: (e.target.value as "VR" | "VA") || undefined,
              page: 1,
            }))
          }
        >
          <option value="">Todos os tipos</option>
          <option value="VR">VR</option>
          <option value="VA">VA</option>
        </select>
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comprador</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Líquido</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/transacoes/${t.id}`)}
                    >
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(t.saleDate)}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{t.compradorName}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {t.cardType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-900 font-medium tabular-nums">{formatCurrency(t.cardBalance)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-400 tabular-nums">{t.feePercentage}%</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900 tabular-nums">{formatCurrency(t.netAmount)}</td>
                      <td className="px-5 py-3.5"><Badge status={t.status} /></td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        Nenhuma transação encontrada.
                      </td>
                    </tr>
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:bg-gray-50 transition-colors"
                onClick={() => navigate(`/transacoes/${t.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{t.compradorName}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.saleDate)} &middot; {t.cardType}</p>
                  </div>
                  <Badge status={t.status} />
                </div>
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400">Saldo</p>
                    <p className="text-sm font-medium text-gray-700">{formatCurrency(t.cardBalance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Líquido</p>
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
              <p className="text-xs sm:text-sm text-gray-500">
                Pág. {pagination.page}/{pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
