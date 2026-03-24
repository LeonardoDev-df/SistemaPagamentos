import { z } from "zod";

export const createCardSchema = z.object({
  vendedorId: z.string().min(1, "Vendedor é obrigatório"),
  cardType: z.enum(["VR", "VA"]),
  cardBrand: z.string().min(1, "Bandeira é obrigatória"),
  cardNumber: z.string().optional(),
  cardPassword: z.string().min(1, "Senha do cartão é obrigatória"),
  valorMensal: z.number().min(0).optional(),
  diaVencimento: z.number().min(1).max(31).optional(),
});

export const updateCardSchema = z.object({
  cardBrand: z.string().min(1).optional(),
  cardNumber: z.string().optional(),
  cardPassword: z.string().min(1).optional(),
  valorMensal: z.number().min(0).optional(),
  diaVencimento: z.number().min(1).max(31).optional(),
  active: z.boolean().optional(),
});
