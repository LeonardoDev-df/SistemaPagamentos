import api from "@/config/api";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  ApiResponse,
} from "@sistema-pagamentos/shared";

export const userService = {
  async list(role?: UserRole) {
    const params = role ? `?role=${role}` : "";
    const res = await api.get<ApiResponse<User[]>>(`/api/users${params}`);
    return res.data.data!;
  },

  async getById(uid: string) {
    const res = await api.get<ApiResponse<User>>(`/api/users/${uid}`);
    return res.data.data!;
  },

  async create(data: CreateUserRequest) {
    const res = await api.post<ApiResponse<User>>("/api/users", data);
    return res.data.data!;
  },

  async update(uid: string, data: UpdateUserRequest) {
    const res = await api.put<ApiResponse<User>>(`/api/users/${uid}`, data);
    return res.data.data!;
  },

  async delete(uid: string) {
    await api.delete(`/api/users/${uid}`);
  },
};
