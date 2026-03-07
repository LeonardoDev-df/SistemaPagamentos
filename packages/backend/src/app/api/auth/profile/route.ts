import { NextRequest } from "next/server";
import { UpdateUserRequest, updateUserSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    const user = await UserService.getById(authUser.uid);
    return apiResponse(user);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await authenticateRequest(req);
    const body = await req.json();
    const validated = validateBody(updateUserSchema, body) as UpdateUserRequest;

    // Non-admin users cannot change their own role
    if (authUser.role !== "ADMIN") {
      delete validated.role;
      delete validated.active;
    }

    const updated = await UserService.update(authUser.uid, validated);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
