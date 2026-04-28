import { describe, expect, test } from "vitest";

import { validateUploadFile } from "@/lib/validation";

describe("validateUploadFile", () => {
  test("accepts supported file types below the size limit", () => {
    expect(() =>
      validateUploadFile({
        originalName: "golden-set.xlsx",
        size: 1024,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    ).not.toThrow();
  });

  test("rejects an unsupported file extension", () => {
    expect(() =>
      validateUploadFile({
        originalName: "script.exe",
        size: 1024,
        mimeType: "application/octet-stream",
      }),
    ).toThrow(/附件类型不支持/);
  });

  test("rejects a file above the size limit", () => {
    expect(() =>
      validateUploadFile({
        originalName: "large.pdf",
        size: 11 * 1024 * 1024,
        mimeType: "application/pdf",
      }),
    ).toThrow(/附件大小超出限制/);
  });
});
