import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/middleware/auth";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError, ApiError } from "@/lib/utils/response";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "leonardolopesdf@gmail.com").toLowerCase();

export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);

    // 1. Already linked by uid (returning user)
    let user = await UserService.findByUid(authUser.uid);
    if (user) return apiResponse(user);

    // 2. Find by email - handles first Google login after admin registered the email
    user = await UserService.findByEmail(authUser.email);
    if (user) {
      // Check if user is active
      if (!user.active) {
        throw new ApiError(403, "Sua conta foi desativada. Entre em contato com o administrador.");
      }
      // Migrate Firestore doc from temp ID to real Firebase uid
      user = await UserService.migrateUid(user.uid, authUser.uid);
      return apiResponse(user);
    }

    // 3. Auto-create admin for configured email
    if (authUser.email.toLowerCase() === ADMIN_EMAIL) {
      user = await UserService.createAdmin(
        authUser.uid,
        authUser.email,
        authUser.email.split("@")[0]
      );
      return apiResponse(user);
    }

    // 4. Email not registered - block access
    throw new ApiError(403, "Seu email não está cadastrado no sistema. Solicite acesso ao administrador.");
  } catch (error) {
    console.error("[verify] Error:", error);
    return apiError(error);
  }
}
