import { z } from "zod";

import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { updateSubmissionStatus } from "@/lib/submission-repository";

export const runtime = "nodejs";

const statusSchema = z.object({
  status: z.enum(["pending", "in_progress", "done"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return jsonError("未登录", 401);
  }

  if (viewer.role !== "admin") {
    return jsonError("无权限更新状态", 403);
  }

  try {
    const body = statusSchema.parse(await request.json());
    const { id } = await context.params;

    updateSubmissionStatus(getDb(), id, body.status);

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message);
    }

    return jsonError("更新状态失败", 500);
  }
}
