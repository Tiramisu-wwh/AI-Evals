import { describe, expect, test } from "vitest";

import {
  authenticateUser,
  getDefaultRouteForRole,
  shouldUseSecureCookie,
  verifySessionToken,
} from "@/lib/auth";
import { createTestDatabase } from "@/lib/test-db";

describe("authenticateUser", () => {
  test("returns the viewer payload for valid credentials", async () => {
    const db = createTestDatabase();

    await expect(authenticateUser(db, "admin", "admin123")).resolves.toMatchObject(
      {
        id: "admin-1",
        role: "admin",
      },
    );
  });

  test("rejects invalid credentials", async () => {
    const db = createTestDatabase();

    await expect(authenticateUser(db, "admin", "wrong-password")).rejects.toThrow(
      /用户名或密码错误/,
    );
  });
});

describe("session token", () => {
  test("round-trips a signed viewer payload", async () => {
    const token = await verifySessionToken(
      await (await import("@/lib/auth")).createSessionToken({
        id: "user-1",
        role: "user",
      }),
    );

    expect(token).toMatchObject({
      id: "user-1",
      role: "user",
    });
  });
});

describe("getDefaultRouteForRole", () => {
  test("sends admins to the admin list", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/admin/submissions");
  });

  test("sends users to the submit page", () => {
    expect(getDefaultRouteForRole("user")).toBe("/submit");
  });
});

describe("shouldUseSecureCookie", () => {
  test("does not require secure cookies for plain http LAN access", () => {
    const request = new Request("http://10.11.71.84:3001/api/auth/login", {
      method: "POST",
    });

    expect(shouldUseSecureCookie(request)).toBe(false);
  });

  test("enables secure cookies when the request is https", () => {
    const request = new Request("https://ai-evals.example.com/api/auth/login", {
      method: "POST",
    });

    expect(shouldUseSecureCookie(request)).toBe(true);
  });

  test("prefers x-forwarded-proto when running behind a proxy", () => {
    const request = new Request("http://ai-evals.internal/api/auth/login", {
      headers: {
        "x-forwarded-proto": "https",
      },
      method: "POST",
    });

    expect(shouldUseSecureCookie(request)).toBe(true);
  });
});
