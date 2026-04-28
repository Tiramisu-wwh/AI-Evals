import type { SubmissionStatus, SystemType } from "@/lib/types";

export const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  rag: "RAG/问答",
  agent_workflow: "Agent 工作流",
  content_generation: "内容生成",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "待处理",
  in_progress: "处理中",
  done: "已完成",
};

type RubricDimension = {
  name: string;
  weight: number;
  method: string;
  criteria: string[];
};

type RubricPreset = {
  methods: string[];
  dimensions: RubricDimension[];
  passingRules: string[];
};

function buildRubricTemplate(preset: RubricPreset) {
  const lines = [
    "总分：100",
    "",
    "评分方式：",
    ...preset.methods.map((method) => `- ${method}`),
    "",
    "维度明细：",
    ...preset.dimensions.flatMap((dimension, index) => [
      `${index + 1}. ${dimension.name}`,
      `- 权重：${dimension.weight}%`,
      `- 评分方式：${dimension.method}`,
      "- 判定要点：",
      ...dimension.criteria.map((criterion) => `  - ${criterion}`),
      "",
    ]),
    "通过条件：",
    ...preset.passingRules.map((rule) => `- ${rule}`),
  ];

  return lines.join("\n").trim();
}

export const DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE: Record<SystemType, string> =
  {
    rag: buildRubricTemplate({
      methods: [
        "规则检查：用于格式、字段完整性、引用或证据是否提供等硬性校验",
        "LLM Judge：用于相关性、忠实度、完整性、清晰度等质量判断，单项按 1-5 分评分后换算为权重分",
        "人工复核：抽检高风险样本和低分样本，校准边界与争议结果",
      ],
      dimensions: [
        {
          name: "相关性",
          weight: 25,
          method: "LLM Judge（1-5 分）",
          criteria: [
            "是否直接回应用户问题或任务",
            "是否覆盖核心意图，避免答非所问",
          ],
        },
        {
          name: "忠实度",
          weight: 25,
          method: "规则检查 + LLM Judge（1-5 分）",
          criteria: [
            "结论是否来自已给出的知识或证据",
            "是否出现编造、过度推断或错误归因",
          ],
        },
        {
          name: "完整性",
          weight: 20,
          method: "LLM Judge（1-5 分）",
          criteria: [
            "关键步骤、条件、限制是否覆盖完整",
            "是否遗漏影响使用的前置条件或例外情况",
          ],
        },
        {
          name: "清晰度",
          weight: 15,
          method: "LLM Judge（1-5 分）",
          criteria: [
            "表达是否易读、结构是否清晰",
            "是否便于用户直接执行下一步动作",
          ],
        },
        {
          name: "边界控制",
          weight: 15,
          method: "规则检查 + 人工复核",
          criteria: [
            "不确定时是否明确说明边界或提示补充信息",
            "涉及风险事项时是否避免越权承诺或错误指引",
          ],
        },
      ],
      passingRules: [
        "总分 >= 80",
        "忠实度 >= 4/5",
        "边界控制 >= 4/5",
      ],
    }),
    agent_workflow: buildRubricTemplate({
      methods: [
        "规则检查：用于校验必要工具、参数格式、关键状态字段是否齐全",
        "LLM Judge：用于判断任务完成质量和异常处理合理性，单项按 1-5 分评分后换算为权重分",
        "人工复核：抽检失败链路和复杂任务，确认状态与终态是否一致",
      ],
      dimensions: [
        {
          name: "任务成功率",
          weight: 35,
          method: "规则检查 + LLM Judge（达成终态）",
          criteria: [
            "是否完成用户目标，而不是只执行中间步骤",
            "最终输出和环境终态是否满足成功定义",
          ],
        },
        {
          name: "状态正确率",
          weight: 20,
          method: "规则检查 + 人工复核",
          criteria: [
            "中间状态与最终状态是否一致",
            "是否错误声称完成、成功或已保存",
          ],
        },
        {
          name: "工具调用有效性",
          weight: 25,
          method: "规则检查 + LLM Judge",
          criteria: [
            "工具选择是否正确，是否存在多余调用或漏调",
            "参数、顺序和调用结果利用是否合理",
          ],
        },
        {
          name: "异常恢复能力",
          weight: 20,
          method: "LLM Judge + 人工复核",
          criteria: [
            "失败后是否能识别原因并采取合理恢复动作",
            "遇到权限、空数据、超时等场景时是否给出可执行反馈",
          ],
        },
      ],
      passingRules: [
        "总分 >= 80",
        "任务成功率 >= 4/5",
        "工具调用有效性 >= 4/5",
      ],
    }),
    content_generation: buildRubricTemplate({
      methods: [
        "规则检查：用于校验格式、长度、禁用词、必要字段和结构要求",
        "LLM Judge：用于内容质量、指令遵循和事实风险判断，单项按 1-5 分评分后换算为权重分",
        "人工复核：抽检外部事实、高风险表述和风格偏差",
      ],
      dimensions: [
        {
          name: "指令遵循",
          weight: 30,
          method: "规则检查 + LLM Judge（1-5 分）",
          criteria: [
            "是否遵守格式、语气、长度和输出结构要求",
            "是否遗漏用户明确提出的约束条件",
          ],
        },
        {
          name: "内容完整性",
          weight: 20,
          method: "LLM Judge（1-5 分）",
          criteria: [
            "是否覆盖任务所需的核心信息点",
            "是否存在明显缺段或信息残缺",
          ],
        },
        {
          name: "表达质量",
          weight: 20,
          method: "LLM Judge（1-5 分）",
          criteria: [
            "表述是否自然、连贯、可读",
            "结构、标题和段落组织是否便于阅读",
          ],
        },
        {
          name: "事实风险",
          weight: 15,
          method: "规则检查 + 人工复核",
          criteria: [
            "涉及事实性内容时是否准确或明确标注不确定性",
            "是否存在明显编造、误导或未经证实的结论",
          ],
        },
        {
          name: "安全边界",
          weight: 15,
          method: "规则检查 + 人工复核",
          criteria: [
            "是否规避违规、敏感或高风险输出",
            "需要拒答、降级或提醒风险时是否处理到位",
          ],
        },
      ],
      passingRules: [
        "总分 >= 80",
        "指令遵循 >= 4/5",
        "安全边界 >= 4/5",
      ],
    }),
  };

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  "xlsx",
  "csv",
  "docx",
  "pdf",
] as const;

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "application/octet-stream",
]);

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const SESSION_COOKIE_NAME = "ai-evals-session";

export const DEFAULT_USERS = [
  {
    id: "admin-1",
    username: "admin",
    password: "admin123",
    role: "admin" as const,
  },
  {
    id: "user-1",
    username: "user",
    password: "user123",
    role: "user" as const,
  },
  {
    id: "user-2",
    username: "user2",
    password: "user234",
    role: "user" as const,
  },
];
