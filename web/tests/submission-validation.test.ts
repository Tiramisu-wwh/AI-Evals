import { describe, expect, test } from "vitest";

import { validateSubmissionPayload } from "@/lib/validation";

const validPayload = {
  summary: "评估内部知识问答的首轮效果",
  systemType: "rag" as const,
  scoringRubric: "相关性\n忠实度\n完整性",
  goldenSamples: [
    {
      input: "差旅报销怎么申请？",
      expectedOutput: "说明入口、审批流程和注意事项",
      note: "",
    },
  ],
  candidateSamples: [
    {
      input: "差旅报销怎么申请？",
      actualOutput: "先进入 OA，再选择报销模块",
      note: "",
    },
  ],
  attachmentIds: [],
};

describe("validateSubmissionPayload", () => {
  test("accepts a valid submission payload", () => {
    expect(() => validateSubmissionPayload(validPayload)).not.toThrow();
  });

  test("rejects an empty golden sample list", () => {
    expect(() =>
      validateSubmissionPayload({
        ...validPayload,
        goldenSamples: [],
      }),
    ).toThrow(/黄金集至少需要 1 条样本/);
  });

  test("rejects an empty candidate sample list", () => {
    expect(() =>
      validateSubmissionPayload({
        ...validPayload,
        candidateSamples: [],
      }),
    ).toThrow(/待评测内容至少需要 1 条记录/);
  });

  test("rejects a sample missing input or output", () => {
    expect(() =>
      validateSubmissionPayload({
        ...validPayload,
        goldenSamples: [
          {
            input: "",
            expectedOutput: "需要有输出",
            note: "",
          },
        ],
      }),
    ).toThrow(/黄金集第 1 条样本缺少输入或期望输出/);
  });
});
