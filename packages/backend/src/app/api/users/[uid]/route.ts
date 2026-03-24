import { NextRequest } from "next/server";
import { UserRole, updateUserSchema } from "@sistema-pagamentos/shared";
import { authenticateRequest, requireRole } from "@/lib/middleware/auth";
import { validateBody } from "@/lib/middleware/validate";
import { UserService } from "@/lib/services/user.service";
import { apiResponse, apiError } from "@/lib/utils/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const authUser = await authenticateRequest(req);
    const { uid } = await params;

    // Users can view their own profile, Admin can view anyone
    if (authUser.uid !== uid) {
      requireRole(UserRole.ADMIN)(authUser);
    }

    const user = await UserService.getById(uid);
    return apiResponse(user);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const authUser = await authenticateRequest(req);
    requireRole(UserRole.ADMIN)(authUser);

    const { uid } = await params;
    const body = await req.json();
    const validated = validateBody(updateUserSchema, body);

    const updated = await UserService.update(uid, validated);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const authUser = await authenticateRequest(req);
    requireRole(UserRole.ADMIN)(authUser);

    const { uid } = await params;
    await UserService.delete(uid);
    return apiResponse({ message: "Usuário removido com sucesso" });
  } catch (error) {
    return apiError(error);
  }
}
