import { SUBMISSION_STATUS_LABELS } from "@/lib/constants";
import type { SubmissionStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`status-badge ${status}`}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}
