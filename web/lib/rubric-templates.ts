import { DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE } from "@/lib/constants";
import type { SystemType } from "@/lib/types";

export function getNextRubricValue(input: {
  currentRubric: string;
  nextSystemType: SystemType;
  isDirty: boolean;
}) {
  if (input.isDirty && input.currentRubric.trim()) {
    return input.currentRubric;
  }

  return DEFAULT_SCORING_RUBRICS_BY_SYSTEM_TYPE[input.nextSystemType];
}
