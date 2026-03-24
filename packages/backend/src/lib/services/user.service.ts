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
  /**
   * Admin creates a Comprador by registering their Gmail email.
   * No Firebase Auth user is created here - the user will authenticate
   * via Google Sign-In, and their uid will be linked on first login.
   */
  static async create(data: CreateUserRequest): Promise<User> {
    const { email, displayName, role, phone, pixKey, cpf, address } = data;

    // Check if email already exists in Firestore
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ApiError(400, "Já existe um usuário com este email.");
    }

    // Use email as temporary doc ID (will be migrated to Firebase uid on first login)
    const docId = email.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const now = new Date().toISOString();
    const user: User = {
      uid: docId,
      email: email.toLowerCase(),
      displayName,
      role,
      phone,
      pixKey,
      cpf,
      address,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(USERS_COLLECTION).doc(docId).set(user);
    return user;
  }

  static async findByUid(uid: string): Promise<User | null> {
    const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
    return doc.exists ? (doc.data() as User) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const snapshot = await adminDb
      .collection(USERS_COLLECTION)
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
    return snapshot.empty ? null : (snapshot.docs[0].data() as User);
  }

  /**
   * On first Google login, migrate the Firestore doc from temp ID to Firebase uid
   */
  static async migrateUid(oldUid: string, newUid: string): Promise<User> {
    const oldDoc = await adminDb.collection(USERS_COLLECTION).doc(oldUid).get();
    if (!oldDoc.exists) throw new ApiError(404, "Usuário não encontrado");

    const data = { ...oldDoc.data()!, uid: newUid } as User;
    await adminDb.collection(USERS_COLLECTION).doc(newUid).set(data);
    if (oldUid !== newUid) {
      await adminDb.collection(USERS_COLLECTION).doc(oldUid).delete();
    }

    try {
      await adminAuth.setCustomUserClaims(newUid, { role: data.role });
    } catch {
      // claims will be set on next verify if this fails
    }

    return data;
  }

  static async createAdmin(uid: string, email: string, displayName: string): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      uid,
      email,
      displayName,
      role: UserRole.ADMIN,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await adminAuth.setCustomUserClaims(uid, { role: UserRole.ADMIN });
    await adminDb.collection(USERS_COLLECTION).doc(uid).set(user);
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

  /**
   * List all non-admin users. More robust than filtering by role=COMPRADOR
   * since it catches users that may have been created with different roles.
   */
  static async listCompradores(activeOnly?: boolean): Promise<User[]> {
    const snapshot = await adminDb.collection(USERS_COLLECTION).get();
    let users = snapshot.docs
      .map((doc) => doc.data() as User)
      .filter((u) => u.role !== UserRole.ADMIN);

    if (activeOnly !== undefined) {
      users = users.filter((u) => u.active === activeOnly);
    }

    return users.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static async update(uid: string, data: UpdateUserRequest): Promise<User> {
    const current = await this.getById(uid);

    const updated: User = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // If this user has a real Firebase Auth uid, update claims/display
    try {
      if (data.role && data.role !== current.role) {
        await adminAuth.setCustomUserClaims(uid, { role: data.role });
      }
      if (data.displayName) {
        await adminAuth.updateUser(uid, { displayName: data.displayName });
      }
    } catch {
      // User may not exist in Firebase Auth yet (pre-login), that's OK
    }

    await adminDb.collection(USERS_COLLECTION).doc(uid).set(updated);
    return updated;
  }

  static async delete(uid: string): Promise<void> {
    try {
      await adminAuth.deleteUser(uid);
    } catch {
      // User may not exist in Firebase Auth (never logged in)
    }
    await adminDb.collection(USERS_COLLECTION).doc(uid).delete();
  }
}
