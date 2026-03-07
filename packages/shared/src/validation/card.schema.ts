import { z } from "zod";

export const createCardSchema = z.object({
  vendedorId: z.string().min(1, "Vendedor é obrigatório"),
  cardType: z.enum(["VR", "VA"]),
  cardBrand: z.string().min(1, "Bandeira é obrigatória"),
  cardPassword: z.string().min(1, "Senha do cartão é obrigatória"),
});

export const updateCardSchema = z.object({
  cardBrand: z.string().min(1).optional(),
  cardPassword: z.string().min(1).optional(),
  active: z.boolean().optional(),
});
