// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { SubmissionForm } from "@/components/submission-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("SubmissionForm layout", () => {
  test("renders system type and rubric editor as separate layout blocks", () => {
    const { container } = render(<SubmissionForm />);

    const systemTypeBlock = screen
      .getByLabelText("评测系统类型")
      .closest("[data-testid='system-type-block']");
    const rubricBlock = screen
      .getByLabelText("评分机制")
      .closest("[data-testid='rubric-editor-block']");

    expect(systemTypeBlock).toBeTruthy();
    expect(rubricBlock).toBeTruthy();
    expect(systemTypeBlock).not.toBe(rubricBlock);
    expect(container.querySelector(".rubric-input-grid")).toBeNull();
  });
});
