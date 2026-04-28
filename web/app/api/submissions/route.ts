import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { createSubmission } from "@/lib/submission-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return jsonError("未登录", 401);
  }

  if (viewer.role !== "user") {
    return jsonError("管理员不能创建提交", 403);
  }

  try {
    const payload = await request.json();
    const submission = createSubmission(getDb(), viewer.id, payload);

    return Response.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message);
    }

    return jsonError("提交失败", 500);
  }
}
