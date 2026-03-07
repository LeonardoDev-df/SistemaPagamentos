import { NextResponse } from "next/server";
import { ApiResponse } from "@sistema-pagamentos/shared";

export function apiResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: unknown, defaultStatus = 500): NextResponse<ApiResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }

  // Handle Firebase Auth errors as 400
  const errAny = error as Record<string, unknown>;
  const code = String(errAny?.code ?? "");
  if (code.startsWith("auth/")) {
    const message = error instanceof Error ? error.message : "Erro de autenticação";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : "Erro interno do servidor";
  console.error("[apiError]", error);
  return NextResponse.json(
    { success: false, error: message },
    { status: defaultStatus }
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
