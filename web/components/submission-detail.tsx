import Link from "next/link";

import { RubricDisplay } from "@/components/rubric-display";
import { SYSTEM_TYPE_LABELS } from "@/lib/constants";
import type { SubmissionDetail } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function SubmissionDetailView(props: {
  detail: SubmissionDetail;
  aside?: React.ReactNode;
}) {
  const { detail } = props;

  return (
    <div className="detail-layout">
      <div className="detail-grid">
        <section className="card section-card">
          <div className="stack">
            <div className="meta-grid">
              <div className="meta-item">
                <div className="meta-label">评测系统类型</div>
                <div className="meta-value">
                  {SYSTEM_TYPE_LABELS[detail.systemType]}
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-label">当前状态</div>
                <div className="meta-value">
                  <StatusBadge status={detail.status} />
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-label">提交人</div>
                <div className="meta-value">{detail.createdByUsername}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">提交时间</div>
                <div className="meta-value">
                  {new Date(detail.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
            </div>

            <div className="meta-item">
              <div className="meta-label">评测需求简述</div>
              <div className="meta-value">{detail.summary}</div>
            </div>
          </div>
        </section>

        {props.aside ? props.aside : <div />}
      </div>

      <section className="card section-card">
        <h2 className="section-title">评分机制</h2>
        <p className="section-description">
          默认模板包含总分、维度权重、评分方式、判定要点和通过条件。用户如有改动，这里展示最终提交版本。
        </p>
        <div style={{ marginTop: 16 }}>
          <RubricDisplay rubric={detail.scoringRubric} />
        </div>
      </section>

      <section className="card section-card">
        <h2 className="section-title">黄金集</h2>
        <p className="section-description">用户给出的输入和期望输出，用于明确正确结果。</p>
        <div className="sample-list" style={{ marginTop: 16 }}>
          {detail.goldenSamples.map((sample, index) => (
            <div className="sample-card" key={sample.id}>
              <div className="sample-card-header">
                <div className="sample-card-title">黄金样本 {index + 1}</div>
              </div>
              <div className="stack">
                <div className="field">
                  <div className="field-label">输入</div>
                  <div className="meta-value">{sample.input}</div>
                </div>
                <div className="field">
                  <div className="field-label">期望输出</div>
                  <div className="meta-value">{sample.expectedOutput}</div>
                </div>
                {sample.note ? (
                  <div className="field">
                    <div className="field-label">补充说明</div>
                    <div className="meta-value">{sample.note}</div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card section-card">
        <h2 className="section-title">待评测内容</h2>
        <p className="section-description">用户实际拿到的输入输出，用于后续分析和比对。</p>
        <div className="sample-list" style={{ marginTop: 16 }}>
          {detail.candidateSamples.map((sample, index) => (
            <div className="sample-card" key={sample.id}>
              <div className="sample-card-header">
                <div className="sample-card-title">待评测记录 {index + 1}</div>
              </div>
              <div className="stack">
                <div className="field">
                  <div className="field-label">输入</div>
                  <div className="meta-value">{sample.input}</div>
                </div>
                <div className="field">
                  <div className="field-label">实际输出</div>
                  <div className="meta-value">{sample.actualOutput}</div>
                </div>
                {sample.note ? (
                  <div className="field">
                    <div className="field-label">补充说明</div>
                    <div className="meta-value">{sample.note}</div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card section-card">
        <h2 className="section-title">附件</h2>
        <p className="section-description">
          第一版只提供上传和下载，不做内容解析和在线预览。
        </p>
        <div className="attachment-list" style={{ marginTop: 16 }}>
          {detail.attachments.length === 0 ? (
            <div className="empty-state">当前没有附件。</div>
          ) : (
            detail.attachments.map((attachment) => (
              <div className="attachment-item" key={attachment.id}>
                <div>
                  <div>{attachment.originalName}</div>
                  <div className="field-help">
                    {(attachment.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Link
                  className="button-secondary"
                  href={`/api/uploads/${attachment.id}`}
                  target="_blank"
                >
                  下载
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
