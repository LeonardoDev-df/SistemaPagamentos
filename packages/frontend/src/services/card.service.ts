import api from "@/config/api";
import {
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  ApiResponse,
} from "@sistema-pagamentos/shared";

export const cardService = {
  async listByVendedor(vendedorId: string) {
    const res = await api.get<ApiResponse<Card[]>>(`/api/cards?vendedorId=${vendedorId}`);
    return res.data.data!;
  },

  async listAll() {
    const res = await api.get<ApiResponse<Card[]>>("/api/cards");
    return res.data.data!;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Card>>(`/api/cards/${id}`);
    return res.data.data!;
  },

  async create(data: CreateCardRequest) {
    const res = await api.post<ApiResponse<Card>>("/api/cards", data);
    return res.data.data!;
  },

  async update(id: string, data: UpdateCardRequest) {
    const res = await api.put<ApiResponse<Card>>(`/api/cards/${id}`, data);
    return res.data.data!;
  },

  async delete(id: string) {
    await api.delete(`/api/cards/${id}`);
  },
};
