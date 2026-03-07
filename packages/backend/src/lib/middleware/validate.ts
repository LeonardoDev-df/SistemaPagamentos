import { ZodSchema, ZodError } from "zod";
import { ApiError } from "../utils/response";

export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => e.message).join(", ");
      throw new ApiError(400, `Dados inválidos: ${messages}`);
    }
    throw error;
  }
}
