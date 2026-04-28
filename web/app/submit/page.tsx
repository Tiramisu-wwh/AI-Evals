import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SubmissionForm } from "@/components/submission-form";
import { getSessionViewer } from "@/lib/auth";

export default async function SubmitPage() {
  const viewer = await getSessionViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "user") {
    redirect("/admin/submissions");
  }

  return (
    <AppShell
      description="填写评测需求、黄金集、待评测内容和补充附件。提交后记录会进入管理员列表。"
      pathname="/submit"
      role={viewer.role}
      title="提交评测内容"
    >
      <SubmissionForm />
    </AppShell>
  );
}
