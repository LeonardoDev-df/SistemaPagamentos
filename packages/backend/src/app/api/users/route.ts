import { NextRequest } from "next/server";
import { UserRole, createUserSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError, ApiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    let role = req.nextUrl.searchParams.get("role") as UserRole | null;
    const active = req.nextUrl.searchParams.get("active");

    // Force role filter based on current user's role
    if (user.role === UserRole.COMPRADOR) {
      role = UserRole.VENDEDOR; // Comprador only sees vendedores
    }

    const users = await UserService.list({
      role: role ?? undefined,
      active: active !== null ? active === "true" : undefined,
    });

    return apiResponse(users);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const body = await req.json();

    // Auto-set role based on who is creating
    if (user.role === UserRole.ADMIN) {
      body.role = UserRole.COMPRADOR;
    } else if (user.role === UserRole.COMPRADOR) {
      body.role = UserRole.VENDEDOR;
    }

    const validated = validateBody(createUserSchema, body);

    const newUser = await UserService.create(validated);
    return apiResponse(newUser, 201);
  } catch (error) {
    console.error("[users POST] Error:", error);
    return apiError(error);
  }
}
