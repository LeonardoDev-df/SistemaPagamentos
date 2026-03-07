import { NextRequest } from "next/server";
import { UserRole, createUserSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    requireRole(UserRole.ADMIN)(user);

    const body = await req.json();
    const validated = validateBody(createUserSchema, body);

    const newUser = await UserService.create(validated);
    return apiResponse(newUser, 201);
  } catch (error) {
    return apiError(error);
  }
}
