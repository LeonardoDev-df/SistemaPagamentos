import { Transaction } from "./transaction";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalTransactions: number;
  totalCardValue: number;
  totalFeeAmount: number;
  totalNetAmount: number;
  totalCartoes: number;
  cartoesPagos: number;
  cartoesNaoPagos: number;
  cartoesAbertos: number;
  byStatus: Record<string, number>;
  byCardType: Record<string, number>;
  byVendedor: VendedorResumo[];
  recentTransactions: Transaction[];
}

export interface VendedorResumo {
  vendedorId: string;
  vendedorName: string;
  totalCartoes: number;
  totalTransacoes: number;
  totalPago: number;
  totalNaoPago: number;
  totalFaturado: number;
}
