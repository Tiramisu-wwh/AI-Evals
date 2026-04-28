import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SubmissionDetailView } from "@/components/submission-detail";
import { getSessionViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSubmissionForViewer } from "@/lib/submission-repository";

export default async function MySubmissionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "user") {
    redirect("/admin/submissions");
  }

  const { id } = await props.params;
  const detail = getSubmissionForViewer(getDb(), id, viewer);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell
      actions={
        <Link className="button-secondary" href="/my-submissions">
          返回我的提交
        </Link>
      }
      description="当前页面为只读详情，方便你回看提交的输入、输出和补充附件。"
      pathname={`/my-submissions/${id}`}
      role={viewer.role}
      title="提交详情"
    >
      <SubmissionDetailView detail={detail} />
    </AppShell>
  );
}
