import { NextRequest } from "next/server";
import { UserRole } from "@sistema-pagamentos/shared";
import { adminAuth, adminDb } from "../firebase/admin";
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
    let role = decoded.role as UserRole | undefined;

    // If token doesn't have role claims, look up in Firestore
    if (!role) {
      const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) {
        role = userDoc.data()!.role as UserRole;
        // Set claims for next time so token will have role
        try {
          await adminAuth.setCustomUserClaims(decoded.uid, { role });
        } catch {
          // non-critical
        }
      }
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role: role || UserRole.COMPRADOR,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
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
