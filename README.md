# AI Evals

AI Evals 包含两部分内容：

- `docs/`：AI 评测 V1 文档包，覆盖框架、接入、试点、模板和汇报材料
- `web/`：AI 评测提交平台 V1，覆盖登录、评测提交、我的提交、管理员列表和状态维护

## 目录说明

| 目录 | 说明 |
| --- | --- |
| `docs/` | 文档入口、方法论、操作手册、模板、试点材料 |
| `web/` | Next.js 应用代码、接口、测试和本地数据目录 |

## 快速入口

- 文档总览：[`docs/README.md`](./docs/README.md)
- 文档导航：[`docs/文档导航.md`](./docs/%E6%96%87%E6%A1%A3%E5%AF%BC%E8%88%AA.md)
- 平台说明：[`web/README.md`](./web/README.md)

## 本地启动

进入 `web/` 目录后执行：

```bash
pnpm install
pnpm dev
```

默认访问地址：

- 开发模式：`http://localhost:3000`
- 生产模式：`http://localhost:3001`

## 默认账号

- 管理员：`admin / admin123`
- 普通用户：`user / user123`
- 普通用户：`user2 / user234`

## 数据说明

- 本地数据库默认写入 `web/data/app.db`
- 附件默认写入 `web/uploads/`
- `.gitignore` 已排除本地数据库、上传目录、构建产物和依赖目录

## 当前范围

- 包含：登录、提交评测内容、查看我的提交、管理员查看全量提交并更新状态
- 不包含：自动评测、附件内容解析、通知消息、审批流、SSO
