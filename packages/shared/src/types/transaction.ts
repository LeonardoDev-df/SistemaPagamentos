import { TransactionStatus } from "../enums/transaction-status";

export interface StatusChange {
  from: TransactionStatus;
  to: TransactionStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  cardValue: number;
  cardBalance: number;
  cardType: "VR" | "VA";
  cardBrand?: string;

  vendedorId: string;
  vendedorName: string;
  vendedorPixKey?: string;
  vendedorPhone?: string;
  compradorId: string;
  compradorName: string;
  cardNumber?: string;

  feePercentage: number;
  feeAmount: number;
  netAmount: number;

  status: TransactionStatus;
  statusHistory: StatusChange[];

  receiptUrl?: string;
  receiptPath?: string;

  saleDate: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  cardId: string;
  cardValue: number;
  cardBalance: number;
  saleDate: string;
  feePercentage?: number;
}

export interface UpdateTransactionRequest {
  cardBalance?: number;
  status?: TransactionStatus;
  statusNote?: string;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  vendedorId?: string;
  compradorId?: string;
  cardType?: "VR" | "VA";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
