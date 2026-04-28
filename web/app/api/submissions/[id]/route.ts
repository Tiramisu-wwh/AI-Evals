import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getSubmissionForViewer } from "@/lib/submission-repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return jsonError("未登录", 401);
  }

  const { id } = await context.params;
  const detail = getSubmissionForViewer(getDb(), id, viewer);

  if (!detail) {
    return jsonError("未找到提交记录", 404);
  }

  return Response.json(detail);
}
