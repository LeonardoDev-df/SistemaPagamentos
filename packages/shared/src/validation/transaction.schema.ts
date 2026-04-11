import { z } from "zod";
import { TransactionStatus } from "../enums/transaction-status";

export const createTransactionSchema = z.object({
  cardId: z.string().min(1, "Cartão é obrigatório"),
  cardValue: z.number().positive("Valor do cartão deve ser positivo"),
  cardBalance: z.number().min(0, "Saldo não pode ser negativo"),
  saleDate: z.string().min(1, "Data da venda é obrigatória"),
  feePercentage: z.number().min(0).max(100).optional(),
  markAsPaid: z.boolean().optional(),
});

export const updateTransactionSchema = z.object({
  cardBalance: z.number().min(0).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  statusNote: z.string().optional(),
});
