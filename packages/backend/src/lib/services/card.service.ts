import {
  Card,
  CreateCardRequest,
  UpdateCardRequest,
} from "@sistema-pagamentos/shared";
import { adminDb } from "../firebase/admin";
import { ApiError } from "../utils/response";
import { encrypt, decrypt } from "../utils/encryption";

const CARDS_COLLECTION = "cards";

export class CardService {
  static async create(data: CreateCardRequest, compradorName: string): Promise<Card> {
    const { vendedorId, cardType, cardBrand, cardNumber, cardPassword, valorMensal, diaVencimento } = data;

    // Get vendedor name from vendedores collection
    const vendedorDoc = await adminDb.collection("vendedores").doc(vendedorId).get();
    if (!vendedorDoc.exists) throw new ApiError(404, "Vendedor não encontrado");
    const vendedorName = vendedorDoc.data()!.nome;

    const now = new Date().toISOString();
    const docRef = adminDb.collection(CARDS_COLLECTION).doc();

    const card: Card = {
      id: docRef.id,
      vendedorId,
      vendedorName,
      cardType,
      cardBrand,
      cardNumber,
      cardPassword: encrypt(cardPassword),
      valorMensal,
      diaVencimento,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(card);
    return { ...card, cardPassword: undefined };
  }

  static async getById(id: string): Promise<Card> {
    const doc = await adminDb.collection(CARDS_COLLECTION).doc(id).get();
    if (!doc.exists) throw new ApiError(404, "Cartão não encontrado");
    return doc.data() as Card;
  }

  static async getByIdWithPassword(id: string): Promise<Card & { decryptedPassword: string }> {
    const card = await this.getById(id);
    return {
      ...card,
      decryptedPassword: card.cardPassword ? decrypt(card.cardPassword) : "",
    };
  }

  /**
   * List cards - fetches all and filters in memory to avoid composite index issues
   */
  static async listByVendedor(vendedorId: string): Promise<Card[]> {
    const snapshot = await adminDb.collection(CARDS_COLLECTION).get();
    return snapshot.docs
      .map((doc) => doc.data() as Card)
      .filter((c) => c.vendedorId === vendedorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => ({ ...c, cardPassword: undefined }));
  }

  static async listAll(): Promise<Card[]> {
    const snapshot = await adminDb.collection(CARDS_COLLECTION).get();
    return snapshot.docs
      .map((doc) => doc.data() as Card)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => ({ ...c, cardPassword: undefined }));
  }

  static async update(id: string, data: UpdateCardRequest): Promise<Card> {
    const current = await this.getById(id);

    const updated: Card = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.cardPassword) {
      updated.cardPassword = encrypt(data.cardPassword);
    }

    const cleanData = Object.fromEntries(
      Object.entries(updated).filter(([, v]) => v !== undefined)
    );

    await adminDb.collection(CARDS_COLLECTION).doc(id).set(cleanData);
    return { ...updated, cardPassword: undefined };
  }

  static async delete(id: string): Promise<void> {
    await adminDb.collection(CARDS_COLLECTION).doc(id).delete();
  }
}
