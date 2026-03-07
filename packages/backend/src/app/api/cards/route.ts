import { NextRequest } from "next/server";
import { UserRole, createCardSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { CardService } from "@/lib/services/card.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const vendedorId = req.nextUrl.searchParams.get("vendedorId");

    const cards = vendedorId
      ? await CardService.listByVendedor(vendedorId)
      : await CardService.listAll();

    return apiResponse(cards);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const body = await req.json();
    const validated = validateBody(createCardSchema, body);

    const card = await CardService.create(validated, user.email);
    return apiResponse(card, 201);
  } catch (error) {
    return apiError(error);
  }
}
