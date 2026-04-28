import { getSessionViewer } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const viewer = await getSessionViewer();

  if (!viewer) {
    return Response.json({ viewer: null }, { status: 401 });
  }

  return Response.json({ viewer });
}
