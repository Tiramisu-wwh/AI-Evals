export type SystemType = "rag" | "agent_workflow" | "content_generation";

export type SubmissionStatus = "pending" | "in_progress" | "done";

export type Role = "user" | "admin";

export type Viewer = {
  id: string;
  role: Role;
};

export type GoldenSampleInput = {
  input: string;
  expectedOutput: string;
  note: string;
};

export type CandidateSampleInput = {
  input: string;
  actualOutput: string;
  note: string;
};

export type SubmissionFormPayload = {
  summary: string;
  systemType: SystemType;
  scoringRubric: string;
  goldenSamples: GoldenSampleInput[];
  candidateSamples: CandidateSampleInput[];
  attachmentIds: string[];
};

export type AttachmentMeta = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type SubmissionListItem = {
  id: string;
  summary: string;
  systemType: SystemType;
  status: SubmissionStatus;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
};

export type SubmissionDetail = SubmissionListItem & {
  scoringRubric: string;
  updatedAt: string;
  goldenSamples: Array<
    GoldenSampleInput & {
      id: string;
      sortOrder: number;
    }
  >;
  candidateSamples: Array<
    CandidateSampleInput & {
      id: string;
      sortOrder: number;
    }
  >;
  attachments: AttachmentMeta[];
};

export type UploadInput = {
  originalName: string;
  storedPath: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
};

export type AdminSubmissionFilters = {
  status?: SubmissionStatus;
  systemType?: SystemType;
  createdBy?: string;
};

export type UserSummary = {
  id: string;
  username: string;
  role: Role;
};
