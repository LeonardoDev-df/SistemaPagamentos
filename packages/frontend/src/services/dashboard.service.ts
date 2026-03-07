import api from "@/config/api";
import { DashboardStats, ApiResponse } from "@sistema-pagamentos/shared";

export const dashboardService = {
  async getStats() {
    const res = await api.get<ApiResponse<DashboardStats>>("/api/dashboard");
    return res.data.data!;
  },
};
