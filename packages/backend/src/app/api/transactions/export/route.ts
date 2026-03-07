import { NextRequest, NextResponse } from "next/server";
import { TransactionStatus } from "@sistema-pagamentos/shared";
import { authenticateRequest } from "@/lib/middleware/auth";
import { TransactionService } from "@/lib/services/transaction.service";
import { apiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const searchParams = req.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") as TransactionStatus | undefined,
      vendedorId: searchParams.get("vendedorId") ?? undefined,
      compradorId: searchParams.get("compradorId") ?? undefined,
      cardType: searchParams.get("cardType") as "VR" | "VA" | undefined,
    };

    const csv = await TransactionService.exportCsv(filters, user);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transacoes_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
