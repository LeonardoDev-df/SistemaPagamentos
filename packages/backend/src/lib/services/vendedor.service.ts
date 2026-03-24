import {
  Vendedor,
  CreateVendedorRequest,
  UpdateVendedorRequest,
} from "@sistema-pagamentos/shared";
import { adminDb } from "../firebase/admin";
import { ApiError } from "../utils/response";

const VENDEDORES_COLLECTION = "vendedores";

export class VendedorService {
  static async create(data: CreateVendedorRequest, compradorId: string): Promise<Vendedor> {
    const now = new Date().toISOString();
    const docRef = adminDb.collection(VENDEDORES_COLLECTION).doc();

    const vendedor: Vendedor = {
      id: docRef.id,
      compradorId,
      nome: data.nome,
      funcao: data.funcao,
      empresa: data.empresa,
      phone: data.phone,
      pixKey: data.pixKey,
      cpf: data.cpf,
      address: data.address,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(vendedor);
    return vendedor;
  }

  static async getById(id: string): Promise<Vendedor> {
    const doc = await adminDb.collection(VENDEDORES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Vendedor não encontrado");
    }
    return doc.data() as Vendedor;
  }

  static async listByComprador(compradorId: string, activeOnly?: boolean): Promise<Vendedor[]> {
    let query: FirebaseFirestore.Query = adminDb
      .collection(VENDEDORES_COLLECTION)
      .where("compradorId", "==", compradorId);

    if (activeOnly !== undefined) {
      query = query.where("active", "==", activeOnly);
    }

    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as Vendedor);
  }

  static async listAll(activeOnly?: boolean): Promise<Vendedor[]> {
    let query: FirebaseFirestore.Query = adminDb.collection(VENDEDORES_COLLECTION);

    if (activeOnly !== undefined) {
      query = query.where("active", "==", activeOnly);
    }

    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as Vendedor);
  }

  static async update(id: string, data: UpdateVendedorRequest): Promise<Vendedor> {
    const current = await this.getById(id);

    const updated: Vendedor = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection(VENDEDORES_COLLECTION).doc(id).set(updated);
    return updated;
  }

  static async delete(id: string): Promise<void> {
    const doc = await adminDb.collection(VENDEDORES_COLLECTION).doc(id).get();
    if (!doc.exists) {
      throw new ApiError(404, "Vendedor não encontrado");
    }
    await adminDb.collection(VENDEDORES_COLLECTION).doc(id).delete();
  }
}
