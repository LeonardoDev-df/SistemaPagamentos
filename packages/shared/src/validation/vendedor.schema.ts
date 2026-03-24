import { z } from "zod";

const addressSchema = z.object({
  rua: z.string().min(1, "Rua é obrigatória"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório").max(2, "Use a sigla (ex: SP)"),
  cep: z.string().min(8, "CEP inválido").max(9),
}).optional();

export const createVendedorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  funcao: z.string().optional(),
  empresa: z.string().optional(),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
  cpf: z.string().optional(),
  address: addressSchema,
});

export const updateVendedorSchema = z.object({
  nome: z.string().min(2).optional(),
  funcao: z.string().optional(),
  empresa: z.string().optional(),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
  cpf: z.string().optional(),
  address: addressSchema,
  active: z.boolean().optional(),
});
