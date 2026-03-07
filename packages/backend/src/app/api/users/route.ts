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
    const validated = validateBody(createUserSchema, body);

    // Enforce hierarchy: Admin creates Compradores, Comprador creates Vendedores
    if (user.role === UserRole.ADMIN && validated.role !== UserRole.COMPRADOR) {
      throw new ApiError(400, "Administrador só pode cadastrar Compradores.");
    }
    if (user.role === UserRole.COMPRADOR && validated.role !== UserRole.VENDEDOR) {
      throw new ApiError(400, "Comprador só pode cadastrar Vendedores.");
    }

    const newUser = await UserService.create(validated);
    return apiResponse(newUser, 201);
  } catch (error) {
    return apiError(error);
  }
}
