import { z } from "zod";
import { UserRole } from "../enums/roles";

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  displayName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
  phone: z.string().optional(),
  pixKey: z.string().optional(),
  active: z.boolean().optional(),
});
