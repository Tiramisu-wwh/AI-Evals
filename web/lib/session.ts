import { SignJWT, jwtVerify } from "jose";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { Role, Viewer } from "@/lib/types";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "ai-evals-dev-session-secret",
);

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

export function getDefaultRouteForRole(role: Role) {
  return role === "admin" ? "/admin/submissions" : "/submit";
}

export async function createSessionToken(viewer: Viewer) {
  return new SignJWT({
    id: viewer.id,
    role: viewer.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);

    if (typeof payload.id !== "string" || typeof payload.role !== "string") {
      return null;
    }

    if (payload.role !== "user" && payload.role !== "admin") {
      return null;
    }

    return {
      id: payload.id,
      role: payload.role,
    } as Viewer;
  } catch {
    return null;
  }
}
