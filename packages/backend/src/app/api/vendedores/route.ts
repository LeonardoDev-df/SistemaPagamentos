import { NextRequest } from "next/server";
import { UserRole, createVendedorSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { VendedorService } from "@/lib/services/vendedor.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const active = req.nextUrl.searchParams.get("active");
    const activeOnly = active !== null ? active === "true" : undefined;

    let vendedores;
    if (user.role === UserRole.ADMIN) {
      vendedores = await VendedorService.listAll(activeOnly);
    } else {
      vendedores = await VendedorService.listByComprador(user.uid, activeOnly);
    }

    return apiResponse(vendedores);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.COMPRADOR)(user);

    const body = await req.json();
    const validated = validateBody(createVendedorSchema, body);

    const vendedor = await VendedorService.create(validated, user.uid);
    return apiResponse(vendedor, 201);
  } catch (error) {
    console.error("[vendedores POST] Error:", error);
    return apiError(error);
  }
}
