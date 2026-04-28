import { z } from "zod";

import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/lib/constants";
import type { SubmissionFormPayload } from "@/lib/types";

const baseSampleSchema = z.object({
  input: z.string(),
  note: z.string(),
});

const goldenSampleSchema = baseSampleSchema.extend({
  expectedOutput: z.string(),
});

const candidateSampleSchema = baseSampleSchema.extend({
  actualOutput: z.string(),
});

const payloadSchema = z.object({
  summary: z.string().trim().min(1, "请填写评测需求简述"),
  systemType: z.enum(["rag", "agent_workflow", "content_generation"]),
  scoringRubric: z.string().trim().min(1, "请填写评分机制"),
  goldenSamples: z.array(goldenSampleSchema).min(1, "黄金集至少需要 1 条样本"),
  candidateSamples: z
    .array(candidateSampleSchema)
    .min(1, "待评测内容至少需要 1 条记录"),
  attachmentIds: z.array(z.string()),
});

function hasText(value: string) {
  return value.trim().length > 0;
}

export function validateSubmissionPayload(payload: SubmissionFormPayload) {
  const parsed = payloadSchema.parse(payload);

  if (parsed.goldenSamples.length === 0) {
    throw new Error("黄金集至少需要 1 条样本");
  }

  if (parsed.candidateSamples.length === 0) {
    throw new Error("待评测内容至少需要 1 条记录");
  }

  parsed.goldenSamples.forEach((sample, index) => {
    if (!hasText(sample.input) || !hasText(sample.expectedOutput)) {
      throw new Error(`黄金集第 ${index + 1} 条样本缺少输入或期望输出`);
    }
  });

  parsed.candidateSamples.forEach((sample, index) => {
    if (!hasText(sample.input) || !hasText(sample.actualOutput)) {
      throw new Error(`待评测内容第 ${index + 1} 条记录缺少输入或实际输出`);
    }
  });

  return parsed;
}

export function validateUploadFile(input: {
  originalName: string;
  size: number;
  mimeType: string;
}) {
  const extension = input.originalName.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension as never)) {
    throw new Error("附件类型不支持");
  }

  if (input.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("附件大小超出限制");
  }
}
