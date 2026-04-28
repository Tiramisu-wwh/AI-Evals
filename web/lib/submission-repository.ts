import { randomUUID } from "node:crypto";

import type { DatabaseContext } from "@/lib/db";
import type {
  AdminSubmissionFilters,
  AttachmentMeta,
  SubmissionDetail,
  SubmissionFormPayload,
  SubmissionListItem,
  SubmissionStatus,
  UploadInput,
  UserSummary,
  Viewer,
} from "@/lib/types";
import { validateSubmissionPayload } from "@/lib/validation";

function nowIso() {
  return new Date().toISOString();
}

function mapSubmissionRow(row: Record<string, string>): SubmissionListItem {
  return {
    id: row.id,
    summary: row.summary,
    systemType: row.system_type as SubmissionListItem["systemType"],
    status: row.status as SubmissionListItem["status"],
    createdBy: row.created_by,
    createdByUsername: row.username,
    createdAt: row.created_at,
  };
}

export function createTemporaryAttachment(db: DatabaseContext, input: UploadInput) {
  const id = randomUUID();
  const uploadedAt = nowIso();

  db.sqlite
    .prepare(
      `
        INSERT INTO submission_attachments (
          id,
          submission_id,
          original_name,
          stored_path,
          mime_type,
          size,
          uploaded_by,
          uploaded_at
        )
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      input.originalName,
      input.storedPath,
      input.mimeType,
      input.size,
      input.uploadedBy,
      uploadedAt,
    );

  return {
    id,
    originalName: input.originalName,
    mimeType: input.mimeType,
    size: input.size,
  };
}

export function createSubmission(
  db: DatabaseContext,
  createdBy: string,
  payload: SubmissionFormPayload,
) {
  const parsed = validateSubmissionPayload(payload);
  const submissionId = randomUUID();
  const timestamp = nowIso();

  db.sqlite.exec("BEGIN");

  try {
    db.sqlite
      .prepare(
        `
          INSERT INTO submissions (
            id,
            summary,
            system_type,
            scoring_rubric,
            status,
            created_by,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        submissionId,
        parsed.summary.trim(),
        parsed.systemType,
        parsed.scoringRubric.trim(),
        "pending",
        createdBy,
        timestamp,
        timestamp,
      );

    const insertGolden = db.sqlite.prepare(
      `
        INSERT INTO golden_samples (
          id,
          submission_id,
          input,
          expected_output,
          note,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    );

    parsed.goldenSamples.forEach((sample, index) => {
      insertGolden.run(
        randomUUID(),
        submissionId,
        sample.input.trim(),
        sample.expectedOutput.trim(),
        sample.note.trim(),
        index,
      );
    });

    const insertCandidate = db.sqlite.prepare(
      `
        INSERT INTO candidate_samples (
          id,
          submission_id,
          input,
          actual_output,
          note,
          sort_order
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    );

    parsed.candidateSamples.forEach((sample, index) => {
      insertCandidate.run(
        randomUUID(),
        submissionId,
        sample.input.trim(),
        sample.actualOutput.trim(),
        sample.note.trim(),
        index,
      );
    });

    if (parsed.attachmentIds.length > 0) {
      const updateAttachment = db.sqlite.prepare(
        `
          UPDATE submission_attachments
          SET submission_id = ?
          WHERE id = ? AND uploaded_by = ? AND submission_id IS NULL
        `,
      );

      parsed.attachmentIds.forEach((attachmentId) => {
        updateAttachment.run(submissionId, attachmentId, createdBy);
      });
    }

    db.sqlite.exec("COMMIT");

    return {
      id: submissionId,
      status: "pending" as const,
    };
  } catch (error) {
    db.sqlite.exec("ROLLBACK");
    throw error;
  }
}

export function listUserSubmissions(
  db: DatabaseContext,
  userId: string,
): SubmissionListItem[] {
  const rows = db.sqlite
    .prepare(
      `
        SELECT
          submissions.id,
          submissions.summary,
          submissions.system_type,
          submissions.status,
          submissions.created_by,
          submissions.created_at,
          users.username
        FROM submissions
        INNER JOIN users ON users.id = submissions.created_by
        WHERE submissions.created_by = ?
        ORDER BY submissions.created_at DESC
      `,
    )
    .all(userId) as Array<Record<string, string>>;

  return rows.map(mapSubmissionRow);
}

export function listAdminSubmissions(
  db: DatabaseContext,
  filters: AdminSubmissionFilters,
): SubmissionListItem[] {
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters.status) {
    conditions.push("submissions.status = ?");
    values.push(filters.status);
  }

  if (filters.systemType) {
    conditions.push("submissions.system_type = ?");
    values.push(filters.systemType);
  }

  if (filters.createdBy) {
    conditions.push("submissions.created_by = ?");
    values.push(filters.createdBy);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db.sqlite
    .prepare(
      `
        SELECT
          submissions.id,
          submissions.summary,
          submissions.system_type,
          submissions.status,
          submissions.created_by,
          submissions.created_at,
          users.username
        FROM submissions
        INNER JOIN users ON users.id = submissions.created_by
        ${where}
        ORDER BY submissions.created_at DESC
      `,
    )
    .all(...values) as Array<Record<string, string>>;

  return rows.map(mapSubmissionRow);
}

export function getSubmissionForViewer(
  db: DatabaseContext,
  submissionId: string,
  viewer: Viewer,
): SubmissionDetail | null {
  const row = db.sqlite
    .prepare(
      `
        SELECT
          submissions.id,
          submissions.summary,
          submissions.system_type,
          submissions.scoring_rubric,
          submissions.status,
          submissions.created_by,
          submissions.created_at,
          submissions.updated_at,
          users.username
        FROM submissions
        INNER JOIN users ON users.id = submissions.created_by
        WHERE submissions.id = ?
      `,
    )
    .get(submissionId) as Record<string, string> | undefined;

  if (!row) {
    return null;
  }

  if (viewer.role === "user" && row.created_by !== viewer.id) {
    return null;
  }

  const goldenSamples = db.sqlite
    .prepare(
      `
        SELECT id, input, expected_output, note, sort_order
        FROM golden_samples
        WHERE submission_id = ?
        ORDER BY sort_order ASC
      `,
    )
    .all(submissionId) as Array<Record<string, string | number>>;

  const candidateSamples = db.sqlite
    .prepare(
      `
        SELECT id, input, actual_output, note, sort_order
        FROM candidate_samples
        WHERE submission_id = ?
        ORDER BY sort_order ASC
      `,
    )
    .all(submissionId) as Array<Record<string, string | number>>;

  const attachments = db.sqlite
    .prepare(
      `
        SELECT id, original_name, mime_type, size
        FROM submission_attachments
        WHERE submission_id = ?
        ORDER BY uploaded_at ASC
      `,
    )
    .all(submissionId) as Array<Record<string, string | number>>;

  return {
    id: row.id,
    summary: row.summary,
    systemType: row.system_type as SubmissionDetail["systemType"],
    scoringRubric: row.scoring_rubric,
    status: row.status as SubmissionDetail["status"],
    createdBy: row.created_by,
    createdByUsername: row.username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    goldenSamples: goldenSamples.map((sample) => ({
      id: String(sample.id),
      input: String(sample.input),
      expectedOutput: String(sample.expected_output),
      note: String(sample.note),
      sortOrder: Number(sample.sort_order),
    })),
    candidateSamples: candidateSamples.map((sample) => ({
      id: String(sample.id),
      input: String(sample.input),
      actualOutput: String(sample.actual_output),
      note: String(sample.note),
      sortOrder: Number(sample.sort_order),
    })),
    attachments: attachments.map((attachment) => ({
      id: String(attachment.id),
      originalName: String(attachment.original_name),
      mimeType: String(attachment.mime_type),
      size: Number(attachment.size),
    })),
  };
}

export function updateSubmissionStatus(
  db: DatabaseContext,
  submissionId: string,
  status: SubmissionStatus,
) {
  db.sqlite
    .prepare(
      `
        UPDATE submissions
        SET status = ?, updated_at = ?
        WHERE id = ?
      `,
    )
    .run(status, nowIso(), submissionId);
}

export function getAttachmentForViewer(
  db: DatabaseContext,
  attachmentId: string,
  viewer: Viewer,
): (AttachmentMeta & { storedPath: string }) | null {
  const row = db.sqlite
    .prepare(
      `
        SELECT
          submission_attachments.id,
          submission_attachments.original_name,
          submission_attachments.mime_type,
          submission_attachments.size,
          submission_attachments.stored_path,
          submissions.created_by
        FROM submission_attachments
        INNER JOIN submissions
          ON submissions.id = submission_attachments.submission_id
        WHERE submission_attachments.id = ?
      `,
    )
    .get(attachmentId) as
    | {
        id: string;
        original_name: string;
        mime_type: string;
        size: number;
        stored_path: string;
        created_by: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  if (viewer.role === "user" && row.created_by !== viewer.id) {
    return null;
  }

  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    storedPath: row.stored_path,
  };
}

export function listUsers(db: DatabaseContext): UserSummary[] {
  const rows = db.sqlite
    .prepare(
      `
        SELECT id, username, role
        FROM users
        ORDER BY username ASC
      `,
    )
    .all() as Array<Record<string, string>>;

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role as UserSummary["role"],
  }));
}
