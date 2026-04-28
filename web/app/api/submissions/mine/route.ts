import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { listUserSubmissions } from "@/lib/submission-repository";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return jsonError("未登录", 401);
  }

  if (viewer.role !== "user") {
    return jsonError("管理员不能访问我的提交列表", 403);
  }

  return Response.json({
    items: listUserSubmissions(getDb(), viewer.id),
  });
}
