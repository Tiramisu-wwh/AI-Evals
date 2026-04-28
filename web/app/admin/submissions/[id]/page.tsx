import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { StatusUpdateForm } from "@/components/status-update-form";
import { SubmissionDetailView } from "@/components/submission-detail";
import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSubmissionForViewer } from "@/lib/submission-repository";

export default async function AdminSubmissionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/submit");
  }

  const { id } = await props.params;
  const detail = getSubmissionForViewer(getDb(), id, viewer);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      actions={
        <Link className="button-secondary" href="/admin/submissions">
          返回提交列表
        </Link>
      }
      description="管理员可查看结构化详情、附件和当前状态，并在右侧维护流转结果。"
      pathname={`/admin/submissions/${id}`}
      role={viewer.role}
      title="提交详情"
    >
      <SubmissionDetailView
        aside={
          <StatusUpdateForm
            initialStatus={detail.status}
            submissionId={detail.id}
          />
        }
        detail={detail}
      />
    </AppShell>
  );
}
