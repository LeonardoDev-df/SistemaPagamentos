import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Search } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => transactionService.exportCsv(filters)}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          {canCreate && (
            <Button size="sm" onClick={() => navigate(ROUTES.TRANSACTION_NEW)}>
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <select
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          value={filters.status || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: (e.target.value as TransactionStatus) || undefined,
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
          className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          value={filters.cardType || ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              cardType: (e.target.value as "VR" | "VA") || undefined,
            }))
          }
        >
          <option value="">Todos os tipos</option>
          <option value="VR">VR</option>
          <option value="VA">VA</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Comprador</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Saldo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Taxa</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Líquido</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/transacoes/${t.id}`)}
                  >
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.saleDate)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {t.compradorName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.cardType}</td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrency(t.cardBalance)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {t.feePercentage}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(t.netAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={t.status} />
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
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
        </div>
      )}
    </div>
  );
}
