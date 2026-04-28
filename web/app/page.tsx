import { redirect } from "next/navigation";

import { getDefaultRouteForRole, getSessionViewer } from "@/lib/auth";

export default async function HomePage() {
  const viewer = await getSessionViewer();

  if (!viewer) {
    redirect("/login");
  }

  redirect(getDefaultRouteForRole(viewer.role));
}
