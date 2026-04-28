import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getDefaultRouteForRole, getSessionViewer } from "@/lib/auth";

export default async function LoginPage() {
  const viewer = await getSessionViewer();

  if (viewer) {
    redirect(getDefaultRouteForRole(viewer.role));
  }

  return (
    <div className="login-shell">
      <div className="card login-card">
        <h1 className="login-title">登录 AI 评测提交平台</h1>
        <p className="login-copy">
          第一版只覆盖登录、提交、我的提交和管理员全量列表。当前为内网演示版，账号内置。
        </p>
        <LoginForm />
        <div className="demo-box">
          <div>演示账号：</div>
          <div>
            管理员 <span className="inline-code">admin / admin123</span>
          </div>
          <div>
            用户 <span className="inline-code">user / user123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
