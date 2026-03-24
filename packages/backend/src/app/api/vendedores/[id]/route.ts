import { NextRequest } from "next/server";
import { UserRole, updateVendedorSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { VendedorService } from "@/lib/services/vendedor.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const { id } = await params;
    const vendedor = await VendedorService.getById(id);

    // Comprador can only see their own vendedores
    if (user.role === UserRole.COMPRADOR && vendedor.compradorId !== user.uid) {
      return apiResponse(null, 403);
    }

    return apiResponse(vendedor);
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

    // Comprador can only edit their own vendedores
    if (user.role === UserRole.COMPRADOR) {
      const vendedor = await VendedorService.getById(id);
      if (vendedor.compradorId !== user.uid) {
        return apiResponse(null, 403);
      }
    }

    const body = await req.json();
    const validated = validateBody(updateVendedorSchema, body);

    const updated = await VendedorService.update(id, validated);
    return apiResponse(updated);
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

    // Comprador can only delete their own vendedores
    if (user.role === UserRole.COMPRADOR) {
      const vendedor = await VendedorService.getById(id);
      if (vendedor.compradorId !== user.uid) {
        return apiResponse(null, 403);
      }
    }

    await VendedorService.delete(id);
    return apiResponse({ message: "Vendedor removido com sucesso" });
  } catch (error) {
    return apiError(error);
  }
}
