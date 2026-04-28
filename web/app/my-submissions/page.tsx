import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getSessionViewer } from "@/lib/auth";
import { SYSTEM_TYPE_LABELS } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { listUserSubmissions } from "@/lib/submission-repository";

export default async function MySubmissionsPage() {
  const viewer = await getSessionViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "user") {
    redirect("/admin/submissions");
  }

  const items = listUserSubmissions(getDb(), viewer.id);

  return (
    <AppShell
      description="这里展示你提交过的全部记录。第一版只支持查看，不支持修改、删除和重提。"
      pathname="/my-submissions"
      role={viewer.role}
      title="我的提交"
    >
      <section className="card section-card">
        {items.length === 0 ? (
          <div className="empty-state">
            你还没有提交记录。先去 <Link className="table-link" href="/submit">提交评测内容</Link>。
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>评测需求简述</th>
                <th>系统类型</th>
                <th>状态</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="table-link" href={`/my-submissions/${item.id}`}>
                      {item.summary}
                    </Link>
                  </td>
                  <td>{SYSTEM_TYPE_LABELS[item.systemType]}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{new Date(item.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppShell>
  );
}
