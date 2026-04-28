# AI 评测提交平台 V1

这是一个基于 `Next.js` 的内网单体应用，用于收集 AI 评测需求和样本，并支持管理员查看全量提交与维护处理状态。

## 当前能力

- 用户登录
- 新建评测提交
- 查看我的提交列表和详情
- 管理员查看全量提交
- 管理员更新提交状态
- 本地附件上传与下载

## 技术栈

- `Next.js 16`
- `React 19`
- `node:sqlite`
- `Vitest`

## 运行方式

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

启动生产环境：

```bash
pnpm build
pnpm exec next start -H 0.0.0.0 -p 3001
```

## 默认地址

- 开发模式：`http://localhost:3000`
- 生产模式：`http://localhost:3001`
- 局域网分享时可替换为当前机器 IP，例如 `http://10.11.71.84:3001`

## 默认账号

- 管理员：`admin / admin123`
- 普通用户：`user / user123`
- 普通用户：`user2 / user234`

## 目录说明

| 路径 | 说明 |
| --- | --- |
| `app/` | 页面与路由 |
| `components/` | 页面组件和表单组件 |
| `lib/` | 鉴权、数据库、校验、评分模板、存储逻辑 |
| `tests/` | 单元测试与组件测试 |
| `data/` | 本地 SQLite 数据库目录 |

## 验证命令

```bash
pnpm test
pnpm lint
pnpm build
```

## 数据与文件

- SQLite 数据库默认写入 `data/app.db`
- 上传附件默认写入 `uploads/`
- 提交内容默认按录入顺序保存和展示

## 范围边界

- 当前范围不包含注册、找回密码、SSO
- 当前范围不包含自动评测和评分执行
- 当前范围不包含审批流、评论和通知
