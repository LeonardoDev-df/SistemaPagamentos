import { NextRequest } from "next/server";
import { UserRole } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { SettingsService } from "@/lib/services/settings.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req);
    const settings = await SettingsService.get();
    return apiResponse(settings);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN)(user);

    const body = await req.json();
    const updated = await SettingsService.update(body, user.uid);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
