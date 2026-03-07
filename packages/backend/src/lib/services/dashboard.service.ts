import {
  DashboardStats,
  Transaction,
  TransactionStatus,
} from "@sistema-pagamentos/shared";
import { adminDb } from "../firebase/admin";
import { AuthenticatedUser } from "../middleware/auth";

const TRANSACTIONS_COLLECTION = "transactions";

export class DashboardService {
  static async getStats(user: AuthenticatedUser): Promise<DashboardStats> {
    let query: FirebaseFirestore.Query = adminDb.collection(TRANSACTIONS_COLLECTION);

    if (user.role === "COMPRADOR") {
      query = query.where("compradorId", "==", user.uid);
    } else if (user.role === "VENDEDOR") {
      query = query.where("vendedorId", "==", user.uid);
    }

    const snapshot = await query.get();
    const transactions = snapshot.docs.map((doc) => {
      const data = doc.data() as Transaction;
      data.cardPassword = undefined;
      return data;
    });

    const byStatus: Record<string, number> = {};
    const byCardType: Record<string, number> = {};
    let totalCardValue = 0;
    let totalFeeAmount = 0;
    let totalNetAmount = 0;

    for (const t of transactions) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byCardType[t.cardType] = (byCardType[t.cardType] || 0) + 1;
      totalCardValue += t.cardValue;
      totalFeeAmount += t.feeAmount;
      totalNetAmount += t.netAmount;
    }

    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalTransactions: transactions.length,
      totalCardValue: Math.round(totalCardValue * 100) / 100,
      totalFeeAmount: Math.round(totalFeeAmount * 100) / 100,
      totalNetAmount: Math.round(totalNetAmount * 100) / 100,
      byStatus,
      byCardType,
      recentTransactions,
    };
  }
}
