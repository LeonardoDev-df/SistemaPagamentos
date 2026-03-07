import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
} from "@sistema-pagamentos/shared";
import { adminAuth, adminDb } from "../firebase/admin";
import { ApiError } from "../utils/response";

const USERS_COLLECTION = "users";

export class UserService {
  static async create(data: CreateUserRequest): Promise<User> {
    const { email, password, displayName, role, phone, pixKey } = data;

    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    await adminAuth.setCustomUserClaims(authUser.uid, { role });

    const now = new Date().toISOString();
    const user: User = {
      uid: authUser.uid,
      email,
      displayName,
      role,
      phone,
      pixKey,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(USERS_COLLECTION).doc(authUser.uid).set(user);
    return user;
  }

  static async getById(uid: string): Promise<User> {
    const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
    if (!doc.exists) {
      throw new ApiError(404, "Usuário não encontrado");
    }
    return doc.data() as User;
  }

  static async list(filters?: { role?: UserRole; active?: boolean }): Promise<User[]> {
    let query: FirebaseFirestore.Query = adminDb.collection(USERS_COLLECTION);

    if (filters?.role) {
      query = query.where("role", "==", filters.role);
    }
    if (filters?.active !== undefined) {
      query = query.where("active", "==", filters.active);
    }

    query = query.orderBy("createdAt", "desc");
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as User);
  }

  static async update(uid: string, data: UpdateUserRequest): Promise<User> {
    const current = await this.getById(uid);

    const updated: User = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (data.role && data.role !== current.role) {
      await adminAuth.setCustomUserClaims(uid, { role: data.role });
    }

    if (data.displayName) {
      await adminAuth.updateUser(uid, { displayName: data.displayName });
    }

    await adminDb.collection(USERS_COLLECTION).doc(uid).set(updated);
    return updated;
  }

  static async delete(uid: string): Promise<void> {
    await adminAuth.deleteUser(uid);
    await adminDb.collection(USERS_COLLECTION).doc(uid).delete();
  }

  static async findOrCreateFromGoogle(
    uid: string,
    email: string,
    displayName: string
  ): Promise<User> {
    const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
    if (doc.exists) {
      return doc.data() as User;
    }

    const now = new Date().toISOString();
    const user: User = {
      uid,
      email,
      displayName,
      role: UserRole.COMPRADOR,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await adminAuth.setCustomUserClaims(uid, { role: UserRole.COMPRADOR });
    await adminDb.collection(USERS_COLLECTION).doc(uid).set(user);
    return user;
  }
}
