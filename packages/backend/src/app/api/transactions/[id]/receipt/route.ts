import { NextRequest } from "next/server";
import { UserRole } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { TransactionService } from "@/lib/services/transaction.service";
import { apiResponse, apiError, ApiError } from "@/lib/utils/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new ApiError(400, "Arquivo não enviado");
    }

    if (file.size > 700 * 1024) {
      throw new ApiError(400, "Arquivo excede 700KB. Reduza o tamanho da imagem.");
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      throw new ApiError(400, "Apenas imagens e PDFs são permitidos");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptUrl = await TransactionService.uploadReceipt(
      id,
      buffer,
      file.name,
      file.type,
      user
    );

    return apiResponse({ receiptUrl }, 201);
  } catch (error) {
    return apiError(error);
  }
}
