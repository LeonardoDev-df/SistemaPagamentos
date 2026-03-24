import {
  DashboardStats,
  VendedorResumo,
  Transaction,
  TransactionStatus,
} from "@sistema-pagamentos/shared";
import { adminDb } from "../firebase/admin";
import { AuthenticatedUser } from "../middleware/auth";

const TRANSACTIONS_COLLECTION = "transactions";
const CARDS_COLLECTION = "cards";

export class DashboardService {
  static async getStats(user: AuthenticatedUser): Promise<DashboardStats> {
    // Get transactions
    let txQuery: FirebaseFirestore.Query = adminDb.collection(TRANSACTIONS_COLLECTION);
    if (user.role === "COMPRADOR") {
      txQuery = txQuery.where("compradorId", "==", user.uid);
    }

    const txSnapshot = await txQuery.get();
    const transactions = txSnapshot.docs.map((doc) => doc.data() as Transaction);

    // Get cards count
    let cardsQuery: FirebaseFirestore.Query = adminDb.collection(CARDS_COLLECTION);
    const cardsSnapshot = await cardsQuery.get();
    const totalCartoes = cardsSnapshot.size;

    // Aggregate stats
    const byStatus: Record<string, number> = {};
    const byCardType: Record<string, number> = {};
    const vendedorMap = new Map<string, VendedorResumo>();
    let totalCardValue = 0;
    let totalFeeAmount = 0;
    let totalNetAmount = 0;
    let cartoesPagos = 0;
    let cartoesNaoPagos = 0;
    let cartoesAbertos = 0;

    for (const t of transactions) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byCardType[t.cardType] = (byCardType[t.cardType] || 0) + 1;
      totalCardValue += t.cardValue;
      totalFeeAmount += t.feeAmount;
      totalNetAmount += t.netAmount;

      if (t.status === TransactionStatus.PAGO) {
        cartoesPagos++;
      } else if (t.status === TransactionStatus.NAO_PAGO) {
        cartoesNaoPagos++;
      } else if (t.status !== TransactionStatus.CANCELADO) {
        cartoesAbertos++;
      }

      // Aggregate by vendedor
      let resumo = vendedorMap.get(t.vendedorId);
      if (!resumo) {
        resumo = {
          vendedorId: t.vendedorId,
          vendedorName: t.vendedorName,
          totalCartoes: 0,
          totalTransacoes: 0,
          totalPago: 0,
          totalNaoPago: 0,
          totalFaturado: 0,
        };
        vendedorMap.set(t.vendedorId, resumo);
      }
      resumo.totalTransacoes++;
      if (t.status === TransactionStatus.PAGO) {
        resumo.totalPago++;
        resumo.totalFaturado += t.netAmount;
      } else if (t.status === TransactionStatus.NAO_PAGO) {
        resumo.totalNaoPago++;
      }
    }

    // Count cards per vendedor
    for (const doc of cardsSnapshot.docs) {
      const card = doc.data();
      const resumo = vendedorMap.get(card.vendedorId);
      if (resumo) {
        resumo.totalCartoes++;
      }
    }

    const byVendedor = Array.from(vendedorMap.values())
      .sort((a, b) => b.totalFaturado - a.totalFaturado);

    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalTransactions: transactions.length,
      totalCardValue: Math.round(totalCardValue * 100) / 100,
      totalFeeAmount: Math.round(totalFeeAmount * 100) / 100,
      totalNetAmount: Math.round(totalNetAmount * 100) / 100,
      totalCartoes,
      cartoesPagos,
      cartoesNaoPagos,
      cartoesAbertos,
      byStatus,
      byCardType,
      byVendedor,
      recentTransactions,
    };
  }
}
