import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  authenticateUser,
  setSessionCookie,
  shouldUseSecureCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!body.username?.trim() || !body.password) {
      return jsonError("请输入用户名和密码");
    }

    const viewer = await authenticateUser(getDb(), body.username, body.password);
    await setSessionCookie(viewer, shouldUseSecureCookie(request));

    return Response.json(viewer);
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 401);
    }

    return jsonError("登录失败", 500);
  }
}
