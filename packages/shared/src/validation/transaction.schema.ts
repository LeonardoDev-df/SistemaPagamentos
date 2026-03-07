import { z } from "zod";
import { TransactionStatus } from "../enums/transaction-status";

export const createTransactionSchema = z.object({
  cardValue: z.number().positive("Valor do cartão deve ser positivo"),
  cardBalance: z.number().min(0, "Saldo não pode ser negativo"),
  cardPassword: z.string().min(1, "Senha do cartão é obrigatória"),
  cardType: z.enum(["VR", "VA"]),
  cardBrand: z.string().optional(),
  compradorId: z.string().min(1, "Comprador é obrigatório"),
  saleDate: z.string().min(1, "Data da venda é obrigatória"),
  feePercentage: z.number().min(0).max(100).optional(),
});

export const updateTransactionSchema = z.object({
  cardBalance: z.number().min(0).optional(),
  cardPassword: z.string().min(1).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  statusNote: z.string().optional(),
});
