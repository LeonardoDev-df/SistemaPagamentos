import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cardService } from "@/services/card.service";
import { CreateCardRequest, UpdateCardRequest } from "@sistema-pagamentos/shared";
import toast from "react-hot-toast";

export function useCards(vendedorId?: string) {
  return useQuery({
    queryKey: ["cards", vendedorId],
    queryFn: () =>
      vendedorId ? cardService.listByVendedor(vendedorId) : cardService.listAll(),
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardRequest) => cardService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Cartão cadastrado!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao cadastrar cartão");
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardRequest }) =>
      cardService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Cartão atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar cartão");
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Cartão removido!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao remover cartão");
    },
  });
}
