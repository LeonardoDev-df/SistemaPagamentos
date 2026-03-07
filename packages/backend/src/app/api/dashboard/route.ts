import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/middleware/auth";
import { DashboardService } from "@/lib/services/dashboard.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const stats = await DashboardService.getStats(user);
    return apiResponse(stats);
  } catch (error) {
    return apiError(error);
  }
}
