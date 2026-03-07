import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/middleware/auth";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError, ApiError } from "@/lib/utils/response";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "leonardolopesdf@gmail.com").toLowerCase();

export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);

    // 1. Try to find by uid
    let user = await UserService.findByUid(authUser.uid);
    if (user) return apiResponse(user);

    // 2. Try to find by email (handles Google login for email/password-created users)
    user = await UserService.findByEmail(authUser.email);
    if (user) {
      // Migrate Firestore doc to new uid
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

    // 4. Not registered
    throw new ApiError(403, "Usuário não cadastrado no sistema. Solicite acesso ao administrador.");
  } catch (error) {
    console.error("[verify] Error:", error);
    return apiError(error);
  }
}
