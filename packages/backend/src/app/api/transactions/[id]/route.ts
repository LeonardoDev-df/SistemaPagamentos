import { NextRequest } from "next/server";
import { UserRole, updateTransactionSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { TransactionService } from "@/lib/services/transaction.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const transaction = await TransactionService.getById(id);

    if (
      user.role === UserRole.COMPRADOR &&
      transaction.compradorId !== user.uid
    ) {
      return apiError(new Error("Acesso negado"), 403);
    }

    return apiResponse(transaction);
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
    const validated = validateBody(updateTransactionSchema, body);

    const updated = await TransactionService.update(id, validated, user);
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
    await TransactionService.delete(id, user);
    return apiResponse({ message: "Transação removida com sucesso" });
  } catch (error) {
    return apiError(error);
  }
}
