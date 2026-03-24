import { z } from "zod";
import { UserRole } from "../enums/roles";

const addressSchema = z.object({
  rua: z.string().min(1, "Rua é obrigatória"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório").max(2, "Use a sigla (ex: SP)"),
  cep: z.string().min(8, "CEP inválido").max(9),
}).optional();

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  displayName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
  cpf: z.string().optional(),
  address: addressSchema,
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
  cpf: z.string().optional(),
  address: addressSchema,
  active: z.boolean().optional(),
});
