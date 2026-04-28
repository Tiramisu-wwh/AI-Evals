import { beforeEach, describe, expect, test } from "vitest";

import {
  createSubmission,
  createTemporaryAttachment,
  getSubmissionForViewer,
  listAdminSubmissions,
  listUserSubmissions,
  updateSubmissionStatus,
} from "@/lib/submission-repository";
import { createTestDatabase } from "@/lib/test-db";
import type { DatabaseContext } from "@/lib/db";

describe("submission repository", () => {
  let db: DatabaseContext;

  beforeEach(() => {
    db = createTestDatabase();
  });

  test("creates a submission and links uploaded attachments", () => {
    const attachment = createTemporaryAttachment(db, {
      originalName: "黄金样本.xlsx",
      storedPath: "uploads/tmp-1.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 1024,
      uploadedBy: "user-1",
    });

    const submission = createSubmission(db, "user-1", {
      summary: "提交一轮 RAG 评测",
      systemType: "rag",
      scoringRubric: "相关性\n忠实度",
      goldenSamples: [
        {
          input: "问题 1",
          expectedOutput: "标准答案 1",
          note: "",
        },
      ],
      candidateSamples: [
        {
          input: "问题 1",
          actualOutput: "实际输出 1",
          note: "",
        },
      ],
      attachmentIds: [attachment.id],
    });

    const detail = getSubmissionForViewer(db, submission.id, {
      id: "user-1",
      role: "user",
    });

    expect(detail.attachments).toHaveLength(1);
    expect(detail.attachments[0]?.originalName).toBe("黄金样本.xlsx");
    expect(detail.status).toBe("pending");
  });

  test("limits a user to their own submissions", () => {
    const ownSubmission = createSubmission(db, "user-1", {
      summary: "我的记录",
      systemType: "rag",
      scoringRubric: "相关性",
      goldenSamples: [{ input: "a", expectedOutput: "b", note: "" }],
      candidateSamples: [{ input: "a", actualOutput: "b", note: "" }],
      attachmentIds: [],
    });

    createSubmission(db, "user-2", {
      summary: "别人的记录",
      systemType: "agent_workflow",
      scoringRubric: "任务成功率",
      goldenSamples: [{ input: "x", expectedOutput: "y", note: "" }],
      candidateSamples: [{ input: "x", actualOutput: "y", note: "" }],
      attachmentIds: [],
    });

    expect(listUserSubmissions(db, "user-1")).toHaveLength(1);
    expect(
      getSubmissionForViewer(db, ownSubmission.id, {
        id: "user-2",
        role: "user",
      }),
    ).toBeNull();
  });

  test("supports admin filters and status updates", () => {
    const first = createSubmission(db, "user-1", {
      summary: "RAG 待处理",
      systemType: "rag",
      scoringRubric: "相关性",
      goldenSamples: [{ input: "a", expectedOutput: "b", note: "" }],
      candidateSamples: [{ input: "a", actualOutput: "b", note: "" }],
      attachmentIds: [],
    });

    createSubmission(db, "user-2", {
      summary: "Agent 待处理",
      systemType: "agent_workflow",
      scoringRubric: "任务成功率",
      goldenSamples: [{ input: "x", expectedOutput: "y", note: "" }],
      candidateSamples: [{ input: "x", actualOutput: "y", note: "" }],
      attachmentIds: [],
    });

    updateSubmissionStatus(db, first.id, "done");

    expect(
      listAdminSubmissions(db, {
        status: "done",
      }),
    ).toHaveLength(1);

    expect(
      listAdminSubmissions(db, {
        systemType: "agent_workflow",
      }),
    ).toHaveLength(1);

    expect(
      listAdminSubmissions(db, {
        createdBy: "user-2",
      }),
    ).toHaveLength(1);
  });
});
