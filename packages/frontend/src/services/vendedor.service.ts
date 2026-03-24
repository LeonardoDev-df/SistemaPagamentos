import api from "@/config/api";
import {
  Vendedor,
  CreateVendedorRequest,
  UpdateVendedorRequest,
  ApiResponse,
} from "@sistema-pagamentos/shared";

export const vendedorService = {
  async list() {
    const res = await api.get<ApiResponse<Vendedor[]>>("/api/vendedores");
    return res.data.data!;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<Vendedor>>(`/api/vendedores/${id}`);
    return res.data.data!;
  },

  async create(data: CreateVendedorRequest) {
    const res = await api.post<ApiResponse<Vendedor>>("/api/vendedores", data);
    return res.data.data!;
  },

  async update(id: string, data: UpdateVendedorRequest) {
    const res = await api.put<ApiResponse<Vendedor>>(`/api/vendedores/${id}`, data);
    return res.data.data!;
  },

  async delete(id: string) {
    await api.delete(`/api/vendedores/${id}`);
  },
};
