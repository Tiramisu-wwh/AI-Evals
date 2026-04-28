"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SUBMISSION_STATUS_LABELS } from "@/lib/constants";
import type { SubmissionStatus } from "@/lib/types";

const STATUS_OPTIONS: SubmissionStatus[] = ["pending", "in_progress", "done"];

export function StatusUpdateForm(props: {
  submissionId: string;
  initialStatus: SubmissionStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(props.initialStatus);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit() {
    setError("");
    setSuccess("");

    const response = await fetch(`/api/admin/submissions/${props.submissionId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setError(body?.message ?? "状态更新失败，请重试。");
      return;
    }

    setSuccess("状态已更新。");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="card section-card">
      <h2 className="section-title">处理状态</h2>
      <p className="section-description">管理员可在这里更新当前提交流转状态。</p>
      <div className="stack" style={{ marginTop: 16 }}>
        <div className="field">
          <label className="field-label" htmlFor="status">
            当前状态
          </label>
          <select
            className="select-input"
            id="status"
            onChange={(event) => setStatus(event.target.value as SubmissionStatus)}
            value={status}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SUBMISSION_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="button-row">
          <button className="button-primary" onClick={handleSubmit} type="button">
            {pending ? "保存中..." : "保存状态"}
          </button>
        </div>
        {error ? <div className="alert-error">{error}</div> : null}
        {success ? <div className="alert-success">{success}</div> : null}
      </div>
    </section>
  );
}
