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
import { adminDb, adminStorage } from "../firebase/admin";
import { AuthenticatedUser } from "../middleware/auth";
import { ApiError } from "../utils/response";
import { encrypt, decrypt } from "../utils/encryption";
import { calculateFee } from "../utils/calculations";
import { SettingsService } from "./settings.service";
import { UserService } from "./user.service";

const TRANSACTIONS_COLLECTION = "transactions";

export class TransactionService {
  static async create(
    data: CreateTransactionRequest,
    user: AuthenticatedUser
  ): Promise<Transaction> {
    const feePercentage = data.feePercentage ?? (await SettingsService.getDefaultFeePercentage());
    const { feeAmount, netAmount } = calculateFee(data.cardBalance, feePercentage);

    const comprador = await UserService.getById(data.compradorId);
    const vendedor = await UserService.getById(user.uid);

    const now = new Date().toISOString();
    const docRef = adminDb.collection(TRANSACTIONS_COLLECTION).doc();

    const transaction: Transaction = {
      id: docRef.id,
      cardValue: data.cardValue,
      cardBalance: data.cardBalance,
      cardPassword: encrypt(data.cardPassword),
      cardType: data.cardType,
      cardBrand: data.cardBrand,

      vendedorId: user.uid,
      vendedorName: vendedor.displayName,
      compradorId: data.compradorId,
      compradorName: comprador.displayName,

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
          note: "Transação criada",
        },
      ],

      saleDate: data.saleDate,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(transaction);
    return { ...transaction, cardPassword: undefined };
  }

  static async getById(id: string, includePassword = false): Promise<Transaction> {
    const doc = await adminDb.collection(TRANSACTIONS_COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Transação não encontrada");
    }

    const transaction = doc.data() as Transaction;
    if (includePassword && transaction.cardPassword) {
      transaction.cardPassword = decrypt(transaction.cardPassword);
    } else {
      transaction.cardPassword = undefined;
    }
    return transaction;
  }

  static async list(
    filters: TransactionFilters,
    user: AuthenticatedUser
  ): Promise<PaginatedResponse<Transaction>> {
    let query: FirebaseFirestore.Query = adminDb.collection(TRANSACTIONS_COLLECTION);

    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters.vendedorId) {
      query = query.where("vendedorId", "==", filters.vendedorId);
    }
    if (filters.compradorId) {
      query = query.where("compradorId", "==", filters.compradorId);
    }
    if (filters.cardType) {
      query = query.where("cardType", "==", filters.cardType);
    }

    query = query.orderBy("createdAt", "desc");

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(limit);

    const snapshot = await query.get();
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data() as Transaction;
      data.cardPassword = undefined;
      return data;
    });

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

    if (data.cardPassword) {
      updates.cardPassword = encrypt(data.cardPassword);
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
    const transaction = await this.getById(id);

    const storagePath = `receipts/${id}/${Date.now()}_${fileName}`;
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    await file.save(fileBuffer, {
      metadata: { contentType },
    });

    await file.makePublic();
    const receiptUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    await adminDb.collection(TRANSACTIONS_COLLECTION).doc(id).update({
      receiptUrl,
      receiptPath: storagePath,
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
