"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleLogout() {
    setError("");

    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      setError("退出登录失败，请重试。");
      return;
    }

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <button className="button-secondary" onClick={handleLogout} type="button">
        {pending ? "退出中..." : "退出登录"}
      </button>
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}
