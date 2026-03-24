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

  /**
   * List vendedores by comprador - fetches all and filters in memory
   * to avoid needing composite Firestore indexes
   */
  static async listByComprador(compradorId: string, activeOnly?: boolean): Promise<Vendedor[]> {
    const snapshot = await adminDb.collection(VENDEDORES_COLLECTION).get();
    let vendedores = snapshot.docs
      .map((doc) => doc.data() as Vendedor)
      .filter((v) => v.compradorId === compradorId);

    if (activeOnly !== undefined) {
      vendedores = vendedores.filter((v) => v.active === activeOnly);
    }

    return vendedores.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async listAll(activeOnly?: boolean): Promise<Vendedor[]> {
    const snapshot = await adminDb.collection(VENDEDORES_COLLECTION).get();
    let vendedores = snapshot.docs.map((doc) => doc.data() as Vendedor);

    if (activeOnly !== undefined) {
      vendedores = vendedores.filter((v) => v.active === activeOnly);
    }

    return vendedores.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
