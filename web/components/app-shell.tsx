import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  active: boolean;
};

function getNavItems(role: Role, pathname: string): NavItem[] {
  if (role === "admin") {
    return [
      {
        href: "/admin/submissions",
        label: "提交列表",
        active:
          pathname === "/admin/submissions" ||
          pathname.startsWith("/admin/submissions/"),
      },
    ];
  }

  return [
    {
      href: "/submit",
      label: "提交评测内容",
      active: pathname === "/submit",
    },
    {
      href: "/my-submissions",
      label: "我的提交",
      active:
        pathname === "/my-submissions" ||
        pathname.startsWith("/my-submissions/"),
    },
  ];
}

export function AppShell(props: {
  role: Role;
  pathname: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navItems = getNavItems(props.role, props.pathname);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-mark">
          <div className="brand-title">AI 评测提交平台</div>
          <div className="brand-meta">
            第一版聚焦提交流转，不处理自动评测和附件解析。
          </div>
        </div>

        <nav className="nav-group">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`nav-link${item.active ? " active" : ""}`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      <main className="app-main">
        <div className="page-header">
          <div>
            <h1 className="page-title">{props.title}</h1>
            <p className="page-description">{props.description}</p>
          </div>
          {props.actions ? <div className="page-actions">{props.actions}</div> : null}
        </div>
        {props.children}
      </main>
    </div>
  );
}
