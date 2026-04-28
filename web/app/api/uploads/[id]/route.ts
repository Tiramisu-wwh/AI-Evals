import fs from "node:fs/promises";

import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getAttachmentForViewer } from "@/lib/submission-repository";
import { resolveStoredFilePath } from "@/lib/storage";

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
  const attachment = getAttachmentForViewer(getDb(), id, viewer);

  if (!attachment) {
    return jsonError("附件不存在", 404);
  }

  const filePath = resolveStoredFilePath(attachment.storedPath);

  try {
    const content = await fs.readFile(filePath);

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
      },
    });
  } catch {
    return jsonError("附件文件不存在", 404);
  }
}
