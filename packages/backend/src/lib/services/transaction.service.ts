import {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionStatus,
  ALLOWED_TRANSITIONS,
  StatusChange,
  PaginatedResponse,
  DEFAULT_PAGE_SIZE,
} from "@sistema-pagamentos/shared";
import { adminDb } from "../firebase/admin";
import { AuthenticatedUser } from "../middleware/auth";
import { ApiError } from "../utils/response";
import { calculateFee } from "../utils/calculations";
import { SettingsService } from "./settings.service";
import { CardService } from "./card.service";

const TRANSACTIONS_COLLECTION = "transactions";

export class TransactionService {
  static async create(
    data: CreateTransactionRequest,
    user: AuthenticatedUser
  ): Promise<Transaction> {
    // Get card info
    const card = await CardService.getById(data.cardId);

    const feePercentage = data.feePercentage ?? (await SettingsService.getDefaultFeePercentage());
    const { feeAmount, netAmount } = calculateFee(data.cardBalance, feePercentage);

    // Comprador is the logged-in user, vendedor comes from the card (vendedores collection)
    const compradorDoc = await adminDb.collection("users").doc(user.uid).get();
    const compradorName = compradorDoc.exists ? compradorDoc.data()!.displayName : user.email;

    // Get vendedor info from vendedores collection
    const vendedorDoc = await adminDb.collection("vendedores").doc(card.vendedorId).get();
    const vendedorData = vendedorDoc.exists ? vendedorDoc.data()! : null;
    const vendedorName = vendedorData?.nome ?? card.vendedorName;
    const vendedorPixKey = vendedorData?.pixKey ?? undefined;
    const vendedorPhone = vendedorData?.phone ?? undefined;

    const now = new Date().toISOString();
    const docRef = adminDb.collection(TRANSACTIONS_COLLECTION).doc();

    const transaction: Transaction = {
      id: docRef.id,
      cardId: data.cardId,
      cardValue: data.cardValue,
      cardBalance: data.cardBalance,
      cardType: card.cardType,
      cardBrand: card.cardBrand,

      vendedorId: card.vendedorId,
      vendedorName,
      vendedorPixKey,
      vendedorPhone,
      compradorId: user.uid,
      compradorName,
      cardNumber: card.cardNumber,

      feePercentage,
      feeAmount,
      netAmount,

      status: TransactionStatus.COMPRADO,
      statusHistory: [
        {
          from: TransactionStatus.COMPRADO,
          to: TransactionStatus.COMPRADO,
          changedBy: user.uid,
          changedAt: now,
          note: "Venda registrada",
        },
      ],

      saleDate: data.saleDate,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(transaction);
    return transaction;
  }

  static async getById(id: string): Promise<Transaction> {
    const doc = await adminDb.collection(TRANSACTIONS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Transação não encontrada");
    }
    return doc.data() as Transaction;
  }

  static async list(
    filters: TransactionFilters,
    user: AuthenticatedUser
  ): Promise<PaginatedResponse<Transaction>> {
    // Fetch all and filter in memory to avoid composite index issues
    const snapshot = await adminDb.collection(TRANSACTIONS_COLLECTION).get();
    let allTransactions = snapshot.docs.map((doc) => doc.data() as Transaction);

    // Apply filters
    if (filters.status) {
      allTransactions = allTransactions.filter((t) => t.status === filters.status);
    }
    if (filters.vendedorId) {
      allTransactions = allTransactions.filter((t) => t.vendedorId === filters.vendedorId);
    }
    if (filters.compradorId) {
      allTransactions = allTransactions.filter((t) => t.compradorId === filters.compradorId);
    }
    if (filters.cardType) {
      allTransactions = allTransactions.filter((t) => t.cardType === filters.cardType);
    }

    // Filter by comprador if not admin
    if (user.role === "COMPRADOR") {
      allTransactions = allTransactions.filter((t) => t.compradorId === user.uid);
    }

    // Sort by date desc
    allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allTransactions.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    const transactions = allTransactions.slice(offset, offset + limit);

    return {
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateStatus(
    id: string,
    newStatus: TransactionStatus,
    note: string | undefined,
    user: AuthenticatedUser
  ): Promise<Transaction> {
    const docRef = adminDb.collection(TRANSACTIONS_COLLECTION).doc(id);

    const result = await adminDb.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) {
        throw new ApiError(404, "Transação não encontrada");
      }

      const transaction = doc.data() as Transaction;
      const allowed = ALLOWED_TRANSITIONS[transaction.status];

      if (!allowed.includes(newStatus)) {
        throw new ApiError(
          400,
          `Transição de status inválida: ${transaction.status} → ${newStatus}`
        );
      }

      const now = new Date().toISOString();
      const statusChange: StatusChange = {
        from: transaction.status,
        to: newStatus,
        changedBy: user.uid,
        changedAt: now,
        note,
      };

      const updates: Partial<Transaction> = {
        status: newStatus,
        statusHistory: [...transaction.statusHistory, statusChange],
        updatedAt: now,
      };

      if (newStatus === TransactionStatus.PAGO) {
        updates.paymentDate = now;
      }

      t.update(docRef, updates);
      return { ...transaction, ...updates, cardPassword: undefined };
    });

    return result;
  }

  static async update(
    id: string,
    data: UpdateTransactionRequest,
    user: AuthenticatedUser
  ): Promise<Transaction> {
    const current = await this.getById(id);

    if (
      current.status === TransactionStatus.PAGO ||
      current.status === TransactionStatus.CANCELADO
    ) {
      throw new ApiError(400, "Não é possível editar transação finalizada");
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (data.cardBalance !== undefined) {
      updates.cardBalance = data.cardBalance;
      const { feeAmount, netAmount } = calculateFee(data.cardBalance, current.feePercentage);
      updates.feeAmount = feeAmount;
      updates.netAmount = netAmount;
    }

    await adminDb.collection(TRANSACTIONS_COLLECTION).doc(id).update(updates);
    return this.getById(id);
  }

  static async delete(id: string): Promise<void> {
    const transaction = await this.getById(id);
    if (transaction.status === TransactionStatus.PAGO) {
      throw new ApiError(400, "Não é possível excluir transação paga");
    }
    await adminDb.collection(TRANSACTIONS_COLLECTION).doc(id).delete();
  }

  static async uploadReceipt(
    id: string,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    user: AuthenticatedUser
  ): Promise<string> {
    await this.getById(id);

    const base64Data = fileBuffer.toString("base64");
    const receiptUrl = `data:${contentType};base64,${base64Data}`;

    await adminDb.collection(TRANSACTIONS_COLLECTION).doc(id).update({
      receiptUrl,
      receiptFileName: fileName,
      updatedAt: new Date().toISOString(),
    });

    return receiptUrl;
  }

  static async exportCsv(
    filters: TransactionFilters,
    user: AuthenticatedUser
  ): Promise<string> {
    const allFilters = { ...filters, page: 1, limit: 10000 };
    const result = await this.list(allFilters, user);
    const transactions = result.data ?? [];

    const headers = [
      "ID", "Data Venda", "Comprador", "Vendedor", "Tipo", "Bandeira",
      "Valor Cartão", "Saldo", "Taxa %", "Valor Taxa", "Valor Líquido",
      "Status", "Data Pagamento",
    ];

    const rows = transactions.map((t) => [
      t.id, t.saleDate, t.compradorName, t.vendedorName, t.cardType,
      t.cardBrand ?? "", t.cardValue, t.cardBalance, t.feePercentage,
      t.feeAmount, t.netAmount, t.status, t.paymentDate ?? "",
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}
