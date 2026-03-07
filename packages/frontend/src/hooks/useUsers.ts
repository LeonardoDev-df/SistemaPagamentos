import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { CreateUserRequest, UpdateUserRequest, UserRole } from "@sistema-pagamentos/shared";
import toast from "react-hot-toast";

export function useUsers(role?: UserRole) {
  return useQuery({
    queryKey: ["users", role],
    queryFn: () => userService.list(role),
  });
}

export function useUser(uid: string) {
  return useQuery({
    queryKey: ["user", uid],
    queryFn: () => userService.getById(uid),
    enabled: !!uid,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao criar usuário");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: UpdateUserRequest }) =>
      userService.update(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar usuário");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => userService.delete(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário removido!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao remover usuário");
    },
  });
}
