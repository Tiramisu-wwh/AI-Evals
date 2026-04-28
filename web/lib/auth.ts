import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import type { DatabaseContext } from "@/lib/db";
import type { Role, Viewer } from "@/lib/types";
import {
  createSessionToken,
  getDefaultRouteForRole,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/session";

export async function authenticateUser(
  db: DatabaseContext,
  username: string,
  password: string,
): Promise<Viewer> {
  const row = db.sqlite
    .prepare(
      `
        SELECT id, password_hash, role
        FROM users
        WHERE username = ?
      `,
    )
    .get(username.trim()) as
    | { id: string; password_hash: string; role: Role }
    | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    throw new Error("用户名或密码错误");
  }

  return {
    id: row.id,
    role: row.role,
  };
}

export function shouldUseSecureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto
      .split(",")
      .some((value) => value.trim().toLowerCase() === "https");
  }

  return new URL(request.url).protocol === "https:";
}

export async function setSessionCookie(viewer: Viewer, secure: boolean) {
  const token = await createSessionToken(viewer);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionViewer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

export { createSessionToken, getDefaultRouteForRole, verifySessionToken };
