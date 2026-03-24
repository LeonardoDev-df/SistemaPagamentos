import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendedorService } from "@/services/vendedor.service";
import { CreateVendedorRequest, UpdateVendedorRequest } from "@sistema-pagamentos/shared";
import toast from "react-hot-toast";

export function useVendedores() {
  return useQuery({
    queryKey: ["vendedores"],
    queryFn: () => vendedorService.list(),
  });
}

export function useVendedor(id: string) {
  return useQuery({
    queryKey: ["vendedor", id],
    queryFn: () => vendedorService.getById(id),
    enabled: !!id,
  });
}

export function useCreateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVendedorRequest) => vendedorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast.success("Vendedor cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao cadastrar vendedor");
    },
  });
}

export function useUpdateVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendedorRequest }) =>
      vendedorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast.success("Vendedor atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar vendedor");
    },
  });
}

export function useDeleteVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendedorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast.success("Vendedor removido!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao remover vendedor");
    },
  });
}
