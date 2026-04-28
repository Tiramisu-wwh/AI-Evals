"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Role } from "@/lib/types";

function getDefaultRoute(role: Role) {
  return role === "admin" ? "/admin/submissions" : "/submit";
}

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit() {
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { id: string; role: Role }
      | { message?: string }
      | null;

    if (!response.ok || !body || !("role" in body)) {
      setError(body && "message" in body ? body.message ?? "登录失败" : "登录失败");
      return;
    }

    startTransition(() => {
      router.push(getDefaultRoute(body.role));
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <div className="field">
        <label className="field-label" htmlFor="username">
          用户名
        </label>
        <input
          autoComplete="username"
          className="text-input"
          id="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="请输入用户名"
          value={username}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="password">
          密码
        </label>
        <input
          autoComplete="current-password"
          className="text-input"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          type="password"
          value={password}
        />
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="button-row">
        <button className="button-primary" onClick={handleSubmit} type="button">
          {pending ? "登录中..." : "登录"}
        </button>
      </div>
    </div>
  );
}
