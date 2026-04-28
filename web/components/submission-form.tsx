"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE,
  MAX_ATTACHMENT_SIZE_BYTES,
  SYSTEM_TYPE_LABELS,
} from "@/lib/constants";
import { getNextRubricValue } from "@/lib/rubric-templates";
import type {
  AttachmentMeta,
  CandidateSampleInput,
  GoldenSampleInput,
  SystemType,
} from "@/lib/types";

type FieldErrors = Partial<Record<string, string>>;

const INITIAL_GOLDEN_SAMPLE: GoldenSampleInput = {
  input: "",
  expectedOutput: "",
  note: "",
};

const INITIAL_CANDIDATE_SAMPLE: CandidateSampleInput = {
  input: "",
  actualOutput: "",
  note: "",
};

export function SubmissionForm() {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [systemType, setSystemType] = useState<SystemType>("rag");
  const [scoringRubric, setScoringRubric] = useState(
    DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE.rag,
  );
  const [rubricDirty, setRubricDirty] = useState(false);
  const [goldenSamples, setGoldenSamples] = useState<GoldenSampleInput[]>([
    { ...INITIAL_GOLDEN_SAMPLE },
  ]);
  const [candidateSamples, setCandidateSamples] = useState<CandidateSampleInput[]>([
    { ...INITIAL_CANDIDATE_SAMPLE },
  ]);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  const systemTypeOptions = Object.entries(SYSTEM_TYPE_LABELS) as Array<
    [SystemType, string]
  >;

  function updateGoldenSample(
    index: number,
    key: keyof GoldenSampleInput,
    value: string,
  ) {
    setGoldenSamples((current) =>
      current.map((sample, currentIndex) =>
        currentIndex === index ? { ...sample, [key]: value } : sample,
      ),
    );
  }

  function updateCandidateSample(
    index: number,
    key: keyof CandidateSampleInput,
    value: string,
  ) {
    setCandidateSamples((current) =>
      current.map((sample, currentIndex) =>
        currentIndex === index ? { ...sample, [key]: value } : sample,
      ),
    );
  }

  function validateClientForm() {
    const nextErrors: FieldErrors = {};

    if (!summary.trim()) {
      nextErrors.summary = "请填写评测需求简述。";
    }

    if (!scoringRubric.trim()) {
      nextErrors.scoringRubric = "请填写评分机制。";
    }

    if (goldenSamples.some((sample) => !sample.input.trim() || !sample.expectedOutput.trim())) {
      nextErrors.goldenSamples = "黄金集每条样本都需要输入和期望输出。";
    }

    if (candidateSamples.some((sample) => !sample.input.trim() || !sample.actualOutput.trim())) {
      nextErrors.candidateSamples = "待评测内容每条记录都需要输入和实际输出。";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setFormError("");
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append("file", file);

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: data,
        });

        const body = (await response.json().catch(() => null)) as
          | AttachmentMeta
          | { message?: string }
          | null;

        if (!response.ok || !body || !("id" in body)) {
          throw new Error(body && "message" in body ? body.message : "附件上传失败");
        }

        setAttachments((current) => [...current, body]);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "附件上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setFormError("");

    if (!validateClientForm()) {
      return;
    }

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        systemType,
        scoringRubric,
        goldenSamples,
        candidateSamples,
        attachmentIds: attachments.map((attachment) => attachment.id),
      }),
    });

    const body = (await response.json().catch(() => null)) as
      | { id: string }
      | { message?: string }
      | null;

    if (!response.ok || !body || !("id" in body)) {
      setFormError(body && "message" in body ? body.message ?? "提交失败" : "提交失败");
      return;
    }

    startTransition(() => {
      router.push(`/my-submissions/${body.id}`);
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <section className="card section-card">
        <h2 className="section-title">基础信息</h2>
        <p className="section-description">先说明评测目的、系统类型和评分口径。</p>
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="field">
            <label className="field-label" htmlFor="summary">
              评测需求简述
            </label>
            <textarea
              className="text-area"
              id="summary"
              onChange={(event) => setSummary(event.target.value)}
              placeholder="例如：评估内部知识问答对人事制度问题的回答质量。"
              value={summary}
            />
            {fieldErrors.summary ? (
              <div className="field-error">{fieldErrors.summary}</div>
            ) : null}
          </div>

          <div className="system-type-row" data-testid="system-type-block">
            <div className="field system-type-field">
              <label className="field-label" htmlFor="systemType">
                评测系统类型
              </label>
              <select
                className="select-input"
                id="systemType"
                onChange={(event) => {
                  const nextType = event.target.value as SystemType;
                  setSystemType(nextType);
                  setScoringRubric(
                    getNextRubricValue({
                      currentRubric: scoringRubric,
                      nextSystemType: nextType,
                      isDirty: rubricDirty,
                    }),
                  );
                }}
                value={systemType}
              >
                {systemTypeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rubric-editor-block" data-testid="rubric-editor-block">
            <div className="field">
              <div className="rubric-editor-header">
                <label className="field-label" htmlFor="rubric">
                  评分机制
                </label>
                <div className="field-help">
                  系统类型切换时，只有未手改的默认模板会自动更新。
                </div>
              </div>
              <div className="rubric-helper-card">
                默认模板包含：总分、维度权重、评分方式、判定要点、通过条件。可以直接在此基础上补充业务口径。
              </div>
              <textarea
                className="text-area rubric-text-area"
                id="rubric"
                onChange={(event) => {
                  setRubricDirty(true);
                  setScoringRubric(event.target.value);
                }}
                value={scoringRubric}
              />
              {fieldErrors.scoringRubric ? (
                <div className="field-error">{fieldErrors.scoringRubric}</div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="card section-card">
        <h2 className="section-title">黄金集</h2>
        <p className="section-description">录入标准输入和期望输出，至少 1 条。</p>
        <div className="sample-list" style={{ marginTop: 16 }}>
          {goldenSamples.map((sample, index) => (
            <div className="sample-card" key={`golden-${index}`}>
              <div className="sample-card-header">
                <div className="sample-card-title">黄金样本 {index + 1}</div>
                {goldenSamples.length > 1 ? (
                  <button
                    className="button-ghost button-danger"
                    onClick={() =>
                      setGoldenSamples((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    删除
                  </button>
                ) : null}
              </div>
              <div className="stack">
                <div className="field">
                  <label className="field-label">输入</label>
                  <textarea
                    className="text-area"
                    onChange={(event) =>
                      updateGoldenSample(index, "input", event.target.value)
                    }
                    value={sample.input}
                  />
                </div>
                <div className="field">
                  <label className="field-label">期望输出</label>
                  <textarea
                    className="text-area"
                    onChange={(event) =>
                      updateGoldenSample(index, "expectedOutput", event.target.value)
                    }
                    value={sample.expectedOutput}
                  />
                </div>
                <div className="field">
                  <label className="field-label">补充说明</label>
                  <textarea
                    className="text-area"
                    onChange={(event) =>
                      updateGoldenSample(index, "note", event.target.value)
                    }
                    value={sample.note}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {fieldErrors.goldenSamples ? (
          <div className="field-error" style={{ marginTop: 12 }}>
            {fieldErrors.goldenSamples}
          </div>
        ) : null}
        <div className="button-row" style={{ marginTop: 16 }}>
          <button
            className="button-secondary"
            onClick={() =>
              setGoldenSamples((current) => [...current, { ...INITIAL_GOLDEN_SAMPLE }])
            }
            type="button"
          >
            新增黄金样本
          </button>
        </div>
      </section>

      <section className="card section-card">
        <h2 className="section-title">待评测内容</h2>
        <p className="section-description">录入系统实际给出的输入输出，至少 1 条。</p>
        <div className="sample-list" style={{ marginTop: 16 }}>
          {candidateSamples.map((sample, index) => (
            <div className="sample-card" key={`candidate-${index}`}>
              <div className="sample-card-header">
                <div className="sample-card-title">待评测记录 {index + 1}</div>
                {candidateSamples.length > 1 ? (
                  <button
                    className="button-ghost button-danger"
                    onClick={() =>
                      setCandidateSamples((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    删除
                  </button>
                ) : null}
              </div>
              <div className="stack">
                <div className="field">
                  <label className="field-label">输入</label>
                  <textarea
                    className="text-area"
                    onChange={(event) =>
                      updateCandidateSample(index, "input", event.target.value)
                    }
                    value={sample.input}
                  />
                </div>
                <div className="field">
                  <label className="field-label">实际输出</label>
                  <textarea
                    className="text-area"
                    onChange={(event) =>
                      updateCandidateSample(index, "actualOutput", event.target.value)
                    }
                    value={sample.actualOutput}
                  />
                </div>
                <div className="field">
                  <label className="field-label">补充说明</label>
                  <textarea
                    className="text-area"
                    onChange={(event) =>
                      updateCandidateSample(index, "note", event.target.value)
                    }
                    value={sample.note}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {fieldErrors.candidateSamples ? (
          <div className="field-error" style={{ marginTop: 12 }}>
            {fieldErrors.candidateSamples}
          </div>
        ) : null}
        <div className="button-row" style={{ marginTop: 16 }}>
          <button
            className="button-secondary"
            onClick={() =>
              setCandidateSamples((current) => [
                ...current,
                { ...INITIAL_CANDIDATE_SAMPLE },
              ])
            }
            type="button"
          >
            新增待评测记录
          </button>
        </div>
      </section>

      <section className="card section-card">
        <h2 className="section-title">附件</h2>
        <p className="section-description">
          支持上传 xlsx、csv、docx、pdf，单个文件不超过{" "}
          {Math.floor(MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024)} MB。
        </p>
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="field">
            <input
              accept=".xlsx,.csv,.docx,.pdf"
              className="text-input"
              multiple
              onChange={(event) => void handleUpload(event.target.files)}
              type="file"
            />
          </div>
          {uploading ? <div className="field-help">附件上传中...</div> : null}
          <div className="attachment-list">
            {attachments.length === 0 ? (
              <div className="empty-state">当前还没有上传附件。</div>
            ) : (
              attachments.map((attachment) => (
                <div className="attachment-item" key={attachment.id}>
                  <div>
                    <div>{attachment.originalName}</div>
                    <div className="field-help">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    className="button-ghost button-danger"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item.id !== attachment.id),
                      )
                    }
                    type="button"
                  >
                    移除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {formError ? <div className="alert-error">{formError}</div> : null}

      <div className="button-row">
        <button className="button-primary" onClick={handleSubmit} type="button">
          {pending ? "提交中..." : "提交"}
        </button>
      </div>
    </div>
  );
}
