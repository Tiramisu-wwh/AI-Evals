// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { LoginForm } from "@/components/login-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

describe("LoginForm", () => {
  test("uses document navigation after a successful login", async () => {
    const assign = vi.fn();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: "user-1", role: "user" }),
      ok: true,
    }));

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        assign,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("用户名"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "user123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "登录" }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("/submit");
    });
  });
});
