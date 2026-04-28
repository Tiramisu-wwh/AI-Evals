// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { RubricDisplay } from "@/components/rubric-display";

describe("RubricDisplay", () => {
  test("renders rubric sections with block titles and content", () => {
    render(
      <RubricDisplay
        rubric={[
          "总分：100",
          "",
          "维度明细：",
          "1. 相关性",
          "- 权重：25%",
          "- 评分方式：LLM Judge（0-5 分）",
          "",
          "通过条件：",
          "- 总分 >= 80",
          "- 忠实度 >= 4/5",
        ].join("\n")}
      />,
    );

    expect(screen.getByText("总分")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("维度明细")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes("1. 相关性") ?? false,
      )[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes("- 权重：25%") ?? false,
      )[0],
    ).toBeInTheDocument();
    expect(screen.getByText("通过条件")).toBeInTheDocument();
  });
});
