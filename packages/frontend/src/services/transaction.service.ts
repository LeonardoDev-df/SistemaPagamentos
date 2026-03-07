import api from "@/config/api";
import {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionStatus,
  ApiResponse,
  PaginatedResponse,
} from "@sistema-pagamentos/shared";

export const transactionService = {
  async list(filters?: TransactionFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.vendedorId) params.set("vendedorId", filters.vendedorId);
    if (filters?.compradorId) params.set("compradorId", filters.compradorId);
    if (filters?.cardType) params.set("cardType", filters.cardType);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const res = await api.get<ApiResponse<PaginatedResponse<Transaction>>>(
      `/api/transactions?${params}`
    );
    return res.data.data!;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Transaction>>(`/api/transactions/${id}`);
    return res.data.data!;
  },

  async create(data: CreateTransactionRequest) {
    const res = await api.post<ApiResponse<Transaction>>("/api/transactions", data);
    return res.data.data!;
  },

  async update(id: string, data: UpdateTransactionRequest) {
    const res = await api.put<ApiResponse<Transaction>>(`/api/transactions/${id}`, data);
    return res.data.data!;
  },

  async updateStatus(id: string, status: TransactionStatus, note?: string) {
    const res = await api.put<ApiResponse<Transaction>>(
      `/api/transactions/${id}/status`,
      { status, note }
    );
    return res.data.data!;
  },

  async uploadReceipt(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse<{ receiptUrl: string }>>(
      `/api/transactions/${id}/receipt`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data!.receiptUrl;
  },

  async delete(id: string) {
    await api.delete(`/api/transactions/${id}`);
  },

  async exportCsv(filters?: TransactionFilters) {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.cardType) params.set("cardType", filters.cardType);

    const res = await api.get(`/api/transactions/export?${params}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `transacoes_${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
