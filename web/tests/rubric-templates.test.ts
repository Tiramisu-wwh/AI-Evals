import { describe, expect, test } from "vitest";

import {
  DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE,
  SYSTEM_TYPE_LABELS,
} from "@/lib/constants";
import { getNextRubricValue } from "@/lib/rubric-templates";
import type { SystemType } from "@/lib/types";

describe("getNextRubricValue", () => {
  const ragTemplate = DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE.rag;
  const agentTemplate = DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE.agent_workflow;

  test("fills the default rubric when the field is empty", () => {
    expect(
      getNextRubricValue({
        currentRubric: "",
        nextSystemType: "rag",
        isDirty: false,
      }),
    ).toBe(ragTemplate);
  });

  test("replaces the rubric when the user has not edited it", () => {
    expect(
      getNextRubricValue({
        currentRubric: ragTemplate,
        nextSystemType: "agent_workflow",
        isDirty: false,
      }),
    ).toBe(agentTemplate);
  });

  test("keeps the edited rubric when the field is dirty", () => {
    const customRubric = `${ragTemplate}\n- 新增检查点：引用格式`;

    expect(
      getNextRubricValue({
        currentRubric: customRubric,
        nextSystemType: "agent_workflow",
        isDirty: true,
      }),
    ).toBe(customRubric);
  });
});

describe("system type labels", () => {
  test.each<SystemType>(["rag", "agent_workflow", "content_generation"])(
    "contains a visible label for %s",
    (type) => {
      expect(SYSTEM_TYPE_LABELS[type]).toBeTruthy();
    },
  );
});

describe("default rubric templates", () => {
  test.each<SystemType>(["rag", "agent_workflow", "content_generation"])(
    "includes score structure for %s",
    (type) => {
      const template = DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE[type];

      expect(template).toContain("总分：100");
      expect(template).toContain("维度明细：");
      expect(template).toContain("权重：");
      expect(template).toContain("评分方式：");
      expect(template).toContain("通过条件：");
    },
  );

  test("keeps RAG specific dimensions and weights", () => {
    const template = DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE.rag;

    expect(template).toContain("1. 相关性");
    expect(template).toContain("权重：25%");
    expect(template).toContain("2. 忠实度");
    expect(template).toContain("3. 完整性");
    expect(template).toContain("5. 边界控制");
  });

  test("keeps Agent specific dimensions and methods", () => {
    const template = DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE.agent_workflow;

    expect(template).toContain("任务成功率");
    expect(template).toContain("工具调用有效性");
    expect(template).toContain("规则检查 + LLM Judge");
  });
});
