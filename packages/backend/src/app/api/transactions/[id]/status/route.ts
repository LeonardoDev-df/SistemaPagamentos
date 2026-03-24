import { NextRequest } from "next/server";
import { UserRole, TransactionStatus } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { TransactionService } from "@/lib/services/transaction.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const { id } = await params;
    const { status, note } = await req.json();

    if (!status || !Object.values(TransactionStatus).includes(status)) {
      return apiError(new Error("Status inválido"), 400);
    }

    const updated = await TransactionService.updateStatus(id, status, note, user);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
