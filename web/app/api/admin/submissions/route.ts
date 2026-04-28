import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { listAdminSubmissions } from "@/lib/submission-repository";
import type { SubmissionStatus, SystemType } from "@/lib/types";

export const runtime = "nodejs";

function getOptionalParam(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key)?.trim();
  return value ? value : undefined;
}

export async function GET(request: Request) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return jsonError("未登录", 401);
  }

  if (viewer.role !== "admin") {
    return jsonError("无权限访问管理员列表", 403);
  }

  const url = new URL(request.url);

  return Response.json({
    items: listAdminSubmissions(getDb(), {
      status: getOptionalParam(url.searchParams, "status") as
        | SubmissionStatus
        | undefined,
      systemType: getOptionalParam(url.searchParams, "systemType") as
        | SystemType
        | undefined,
      createdBy: getOptionalParam(url.searchParams, "createdBy"),
    }),
  });
}
