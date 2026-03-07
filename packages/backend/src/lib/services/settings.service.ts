import { SystemSettings, DEFAULT_FEE_PERCENTAGE } from "@sistema-pagamentos/shared";
import { adminDb } from "../firebase/admin";
import { ApiError } from "../utils/response";

const SETTINGS_DOC = "settings/global";

const DEFAULT_SETTINGS: SystemSettings = {
  defaultFeePercentage: DEFAULT_FEE_PERCENTAGE,
  allowedCardTypes: ["VR", "VA"],
  allowedCardBrands: ["Alelo", "Sodexo", "VR", "Ticket"],
  systemName: "Sistema de Pagamentos",
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

export class SettingsService {
  static async get(): Promise<SystemSettings> {
    const doc = await adminDb.doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      await adminDb.doc(SETTINGS_DOC).set(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return doc.data() as SystemSettings;
  }

  static async update(
    data: Partial<SystemSettings>,
    updatedBy: string
  ): Promise<SystemSettings> {
    const current = await this.get();
    const updated: SystemSettings = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    await adminDb.doc(SETTINGS_DOC).set(updated);
    return updated;
  }

  static async getDefaultFeePercentage(): Promise<number> {
    const settings = await this.get();
    return settings.defaultFeePercentage;
  }
}
