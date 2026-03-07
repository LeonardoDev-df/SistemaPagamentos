import { NextRequest } from "next/server";
import { UserRole } from "@sistema-pagamentos/shared";
import { adminAuth } from "../firebase/admin";
import { ApiError } from "../utils/response";

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
}

export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Token de autenticação ausente");
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role: (decoded.role as UserRole) ?? UserRole.COMPRADOR,
    };
  } catch {
    throw new ApiError(401, "Token inválido ou expirado");
  }
}

export function requireRole(...roles: UserRole[]) {
  return (user: AuthenticatedUser) => {
    if (!roles.includes(user.role)) {
      throw new ApiError(403, "Acesso negado. Permissão insuficiente.");
    }
  };
}
