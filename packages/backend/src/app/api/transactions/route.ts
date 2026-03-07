import { NextRequest } from "next/server";
import {
  UserRole,
  createTransactionSchema,
  TransactionStatus,
} from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { TransactionService } from "@/lib/services/transaction.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN, UserRole.COMPRADOR)(user);

    const body = await req.json();
    const validated = validateBody(createTransactionSchema, body);

    const transaction = await TransactionService.create(validated, user);
    return apiResponse(transaction, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const searchParams = req.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") as TransactionStatus | undefined,
      vendedorId:
        user.role === UserRole.VENDEDOR
          ? user.uid
          : searchParams.get("vendedorId") ?? undefined,
      compradorId: searchParams.get("compradorId") ?? undefined,
      cardType: searchParams.get("cardType") as "VR" | "VA" | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    };

    const result = await TransactionService.list(filters, user);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
