---
intent: 构建购买审批小程序的首版可运行 MVP，覆盖群组、审批、实名投票、规则结算和结果公示闭环
success_criteria: 可以本地启动 API 与小程序工程，完成建组、发起审批、实名投票、查看结果，并通过 lint、测试和小程序构建校验
risk_level: medium
auto_approve: false
dirty_worktree: allow
---

## Steps

- [ ] **Step 1: 初始化 workspace 根配置与共享包骨架**
action: 在 `/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a` 下创建 `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`、`.gitignore`、`.editorconfig`、`docker-compose.yml`，并创建 `packages/shared/package.json`、`packages/shared/tsconfig.json`、`packages/shared/src/index.ts`、`packages/shared/src/approval.ts`、`packages/shared/src/group.ts`，写入实施计划中已经确定的 workspace 脚本、TypeScript 基础配置、Postgres 开发容器配置和共享常量定义。
loop: false
max_iterations: 3
verify:
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/package.json
    assert:
      kind: exists
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/packages/shared/src
    assert:
      kind: exists

- [ ] **Step 2: 安装根依赖并验证 workspace 可用**
action: 在项目根目录运行 `pnpm install`，确保 workspace 能解析 `apps/*` 与 `packages/*`，并确认根脚本 `pnpm lint`、`pnpm test`、`pnpm build` 已被注册到根 `package.json`。
loop: until pnpm install 成功退出
max_iterations: 3
verify: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm install

- [ ] **Step 3: 初始化 NestJS API 工程与 Prisma schema**
action: 创建 `apps/api/package.json`、`apps/api/tsconfig.json`、`apps/api/nest-cli.json`、`apps/api/.env.example`、`apps/api/prisma/schema.prisma`、`apps/api/src/main.ts`、`apps/api/src/app.module.ts`、`apps/api/src/config/env.validation.ts`、`apps/api/src/prisma/prisma.module.ts`、`apps/api/src/prisma/prisma.service.ts`，并把 `User`、`Group`、`GroupMember`、`Approval`、`ApprovalVote`、`ApprovalResultLog`、`InviteCode` 数据模型按实施计划落入 Prisma schema。
loop: false
max_iterations: 3
verify:
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/apps/api/prisma/schema.prisma
    assert:
      kind: exists
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/apps/api/src/prisma
    assert:
      kind: exists

- [ ] **Step 4: 生成 Prisma Client 并完成首个数据库迁移**
action: 在项目根目录先用 `docker compose up -d` 启动 Postgres，再运行 `pnpm --filter api prisma:generate` 和 `pnpm --filter api prisma:migrate --name init`，确保数据库结构和 Prisma 客户端与 schema 一致。
loop: until Prisma 生成与迁移成功
max_iterations: 3
verify:
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && docker compose up -d && pnpm --filter api prisma:generate && pnpm --filter api prisma:migrate --name init
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/apps/api/prisma
    assert:
      kind: matches-glob
      value: "*.prisma"

- [ ] **Step 5: 为群组模块先写失败测试并实现创建、加入、我的群组、成员列表**
action: 创建 `apps/api/test/groups.service.spec.ts` 作为群组服务测试，先写出建组会自动写入 owner membership 的失败断言；随后实现 `apps/api/src/common/dto/current-user.dto.ts`、`apps/api/src/groups/groups.module.ts`、`apps/api/src/groups/groups.controller.ts`、`apps/api/src/groups/groups.service.ts`、`apps/api/src/groups/dto/create-group.dto.ts`、`apps/api/src/groups/dto/join-group.dto.ts`，使 `POST /groups`、`POST /groups/join`、`GET /groups/my`、`GET /groups/:groupId/members` 可用。
loop: until 群组测试通过
max_iterations: 3
verify: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter api test apps/api/test/groups.service.spec.ts

- [ ] **Step 6: 为审批模块先写失败测试并实现创建、列表、详情、发布、关闭**
action: 创建 `apps/api/test/approvals.service.spec.ts`，先验证审批创建时会计算 `totalPrice`；随后实现 `apps/api/src/approvals/approvals.module.ts`、`apps/api/src/approvals/approvals.controller.ts`、`apps/api/src/approvals/approvals.service.ts`、`apps/api/src/approvals/dto/create-approval.dto.ts`、`apps/api/src/approvals/dto/publish-approval.dto.ts`、`apps/api/src/approvals/dto/close-approval.dto.ts`，让 `POST /approvals`、`GET /groups/:groupId/approvals`、`GET /approvals/:approvalId`、`POST /approvals/:approvalId/publish`、`POST /approvals/:approvalId/close` 正常工作。
loop: until 审批测试通过
max_iterations: 3
verify: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter api test apps/api/test/approvals.service.spec.ts

- [ ] **Step 7: 为投票与规则结算先写失败测试并实现实名投票接口**
action: 创建 `apps/api/test/votes.service.spec.ts` 和 `apps/api/test/results.service.spec.ts`，分别覆盖实名投票 upsert 和多数票结算；随后实现 `apps/api/src/votes/votes.module.ts`、`apps/api/src/votes/votes.controller.ts`、`apps/api/src/votes/votes.service.ts`、`apps/api/src/votes/dto/upsert-vote.dto.ts`、`apps/api/src/results/results.module.ts`、`apps/api/src/results/results.controller.ts`、`apps/api/src/results/results.service.ts`，完成 `POST /approvals/:approvalId/vote`、`GET /approvals/:approvalId/votes`、`GET /approvals/:approvalId/result` 和结算落库逻辑。
loop: until 投票与结算测试通过
max_iterations: 3
verify:
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter api test apps/api/test/votes.service.spec.ts apps/api/test/results.service.spec.ts
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter api build

- [ ] **Step 8: 初始化 Taro 小程序壳与全局请求层**
action: 创建 `apps/miniapp/package.json`、`apps/miniapp/project.config.json`、`apps/miniapp/tsconfig.json`、`apps/miniapp/src/app.config.ts`、`apps/miniapp/src/app.tsx`、`apps/miniapp/src/app.scss`、`apps/miniapp/src/utils/request.ts`、`apps/miniapp/src/store/session.ts`、`apps/miniapp/src/store/group.ts`，按实施计划注册 4 个页面并建立指向 `http://localhost:3000/api` 的请求封装。
loop: false
max_iterations: 3
verify:
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/apps/miniapp/src/app.config.ts
    assert:
      kind: exists
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/apps/miniapp/src/store
    assert:
      kind: exists

- [ ] **Step 9: 实现群组页、审批列表页和发起审批页**
action: 创建 `apps/miniapp/src/pages/groups/index.config.ts`、`apps/miniapp/src/pages/groups/index.tsx`、`apps/miniapp/src/pages/groups/index.scss`、`apps/miniapp/src/pages/approval-list/index.config.ts`、`apps/miniapp/src/pages/approval-list/index.tsx`、`apps/miniapp/src/pages/approval-list/index.scss`、`apps/miniapp/src/pages/approval-form/index.config.ts`、`apps/miniapp/src/pages/approval-form/index.tsx`、`apps/miniapp/src/pages/approval-form/index.scss`，让用户可以建组、通过邀请码入组、查看当前群审批列表并提交新的购买审批。
loop: until 小程序构建成功
max_iterations: 3
verify: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter miniapp build

- [ ] **Step 10: 实现审批详情页、实名投票展示与结果分区**
action: 创建 `apps/miniapp/src/pages/approval-detail/index.config.ts`、`apps/miniapp/src/pages/approval-detail/index.tsx`、`apps/miniapp/src/pages/approval-detail/index.scss`，把审批详情、投票按钮、投票理由输入框、同意名单、反对名单、实名理由展示和最终结果区放在同一页，确保它调用 `POST /approvals/:approvalId/vote` 与 `GET /approvals/:approvalId`。
loop: until 详情页构建通过
max_iterations: 3
verify:
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter miniapp build
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/apps/miniapp/src/pages/approval-detail/index.tsx
    assert:
      kind: exists

- [ ] **Step 11: 连接前后端并做人类界面验收**
action: 在项目根目录分别启动 `pnpm --filter api start:dev` 与 `pnpm --filter miniapp dev:weapp`，使用微信开发者工具手动验证“建组 -> 进入审批列表 -> 发起审批 -> 进入详情页投票 -> 查看实名结果”完整链路，并修复运行中发现的阻断问题。
loop: until MVP 闭环可以手动走通
max_iterations: 3
verify:
  type: human-review
  prompt: 请确认小程序里已经可以完成建组、发起审批、实名投票、查看同意与反对名单这条完整 MVP 链路。
gate: human

- [ ] **Step 12: 接入 CircleCI 并完成最终工程校验**
action: 创建 `.circleci/config.yml`，让流水线依次执行 `pnpm install`、复制 `apps/api/.env.example`、`pnpm --filter api prisma:generate`、`pnpm --filter api prisma:migrate --name ci_init`、`pnpm lint`、`pnpm test`、`pnpm --filter miniapp build`；然后在本地运行同样的 `lint`、`test`、`build` 命令，修复所有阻断项。
loop: until lint、test、build 全部成功
max_iterations: 3
verify:
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm lint
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm test
  - type: shell
    command: cd '/Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a' && pnpm --filter miniapp build
  - type: artifact
    path: /Users/a1/Library/Application Support/TRAE SOLO/ModularData/ai-agent/work-mode-projects/6a8d65caf2b67613a795356a/.circleci/config.yml
    assert:
      kind: exists
