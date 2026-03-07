import { NextRequest } from "next/server";
import { UserRole, updateCardSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { CardService } from "@/lib/services/card.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const { id } = await params;
    const card = await CardService.getById(id);
    return apiResponse(card);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const { id } = await params;
    const body = await req.json();
    const validated = validateBody(updateCardSchema, body);

    const card = await CardService.update(id, validated);
    return apiResponse(card);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const { id } = await params;
    await CardService.delete(id);
    return apiResponse({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
