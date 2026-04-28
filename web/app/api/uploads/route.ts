import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { createTemporaryAttachment } from "@/lib/submission-repository";
import { saveUploadedFile } from "@/lib/storage";
import { validateUploadFile } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return jsonError("未登录", 401);
  }

  if (viewer.role !== "user") {
    return jsonError("管理员不能上传附件", 403);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("请选择要上传的附件");
  }

  try {
    validateUploadFile({
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });

    const saved = await saveUploadedFile(file);
    const attachment = createTemporaryAttachment(getDb(), {
      originalName: file.name,
      storedPath: saved.storedPath,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      uploadedBy: viewer.id,
    });

    return Response.json(attachment, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message);
    }

    return jsonError("上传失败", 500);
  }
}
