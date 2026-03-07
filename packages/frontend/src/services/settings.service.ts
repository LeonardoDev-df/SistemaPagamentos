import api from "@/config/api";
import { SystemSettings, ApiResponse } from "@sistema-pagamentos/shared";

export const settingsService = {
  async get() {
    const res = await api.get<ApiResponse<SystemSettings>>("/api/settings");
    return res.data.data!;
  },

  async update(data: Partial<SystemSettings>) {
    const res = await api.put<ApiResponse<SystemSettings>>("/api/settings", data);
    return res.data.data!;
  },
};
