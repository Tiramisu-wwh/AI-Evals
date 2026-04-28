import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { getSessionViewer } from "@/lib/auth";
import {
  SUBMISSION_STATUS_LABELS,
  SYSTEM_TYPE_LABELS,
} from "@/lib/constants";
import { getDb } from "@/lib/db";
import { listAdminSubmissions, listUsers } from "@/lib/submission-repository";
import type { SubmissionStatus, SystemType } from "@/lib/types";

function getOptionalValue(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export default async function AdminSubmissionsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await getSessionViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/submit");
  }

  const searchParams = (await props.searchParams) ?? {};
  const status = getOptionalValue(searchParams.status) as SubmissionStatus | undefined;
  const systemType = getOptionalValue(searchParams.systemType) as
    | SystemType
    | undefined;
  const createdBy = getOptionalValue(searchParams.createdBy);
  const db = getDb();
  const items = listAdminSubmissions(db, {
    status,
    systemType,
    createdBy,
  });
  const users = listUsers(db).filter((user) => user.role === "user");

  return (
    <AppShell
      description="管理员可查看全部提交，按状态、系统类型、提交人筛选，并进入详情维护状态。"
      pathname="/admin/submissions"
      role={viewer.role}
      title="提交列表"
    >
      <section className="card section-card">
        <form action="/admin/submissions" className="filter-row">
          <div className="field">
            <label className="field-label" htmlFor="status">
              状态
            </label>
            <select className="select-input" defaultValue={status ?? ""} id="status" name="status">
              <option value="">全部状态</option>
              {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="systemType">
              系统类型
            </label>
            <select
              className="select-input"
              defaultValue={systemType ?? ""}
              id="systemType"
              name="systemType"
            >
              <option value="">全部类型</option>
              {Object.entries(SYSTEM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="createdBy">
              提交人
            </label>
            <select
              className="select-input"
              defaultValue={createdBy ?? ""}
              id="createdBy"
              name="createdBy"
            >
              <option value="">全部提交人</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="button-row">
            <button className="button-primary" type="submit">
              筛选
            </button>
            <Link className="button-secondary" href="/admin/submissions">
              重置
            </Link>
          </div>
        </form>
      </section>

      <section className="card section-card">
        {items.length === 0 ? (
          <div className="empty-state">当前筛选条件下没有记录。</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>评测需求简述</th>
                <th>系统类型</th>
                <th>提交人</th>
                <th>状态</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link className="table-link" href={`/admin/submissions/${item.id}`}>
                      {item.summary}
                    </Link>
                  </td>
                  <td>{SYSTEM_TYPE_LABELS[item.systemType]}</td>
                  <td>{item.createdByUsername}</td>
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
