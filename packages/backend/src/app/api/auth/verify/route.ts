import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/middleware/auth";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    const user = await UserService.findOrCreateFromGoogle(
      authUser.uid,
      authUser.email,
      authUser.email.split("@")[0]
    );
    return apiResponse(user);
  } catch (error) {
    return apiError(error);
  }
}
