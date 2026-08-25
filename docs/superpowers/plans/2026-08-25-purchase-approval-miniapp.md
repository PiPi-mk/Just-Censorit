# 购买审批小程序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可运行的微信购买审批 MVP，支持群组创建与加入、审批发起、实名投票、规则结算和结果公示。

**Architecture:** 使用 `pnpm workspace` 管理一个双应用仓库：`apps/api` 提供 NestJS + Prisma 的后端 API，`apps/miniapp` 提供 Taro + React 的微信小程序前端，`packages/shared` 存放前后端共享类型与规则常量。后端先覆盖群组、审批、投票和规则结算闭环，前端只实现 MVP 所需 4 个核心页面，最后通过 CircleCI 运行安装、测试和构建校验。

**Tech Stack:** pnpm workspace, TypeScript, NestJS, Prisma, PostgreSQL, Taro, React, Zustand, Zod, Vitest, CircleCI

---

## 文件结构

### 根目录

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `docker-compose.yml`

### 共享包

- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/approval.ts`
- Create: `packages/shared/src/group.ts`

### 后端 API

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.env.example`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/config/env.validation.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/common/dto/current-user.dto.ts`
- Create: `apps/api/src/groups/groups.module.ts`
- Create: `apps/api/src/groups/groups.controller.ts`
- Create: `apps/api/src/groups/groups.service.ts`
- Create: `apps/api/src/groups/dto/create-group.dto.ts`
- Create: `apps/api/src/groups/dto/join-group.dto.ts`
- Create: `apps/api/src/approvals/approvals.module.ts`
- Create: `apps/api/src/approvals/approvals.controller.ts`
- Create: `apps/api/src/approvals/approvals.service.ts`
- Create: `apps/api/src/approvals/dto/create-approval.dto.ts`
- Create: `apps/api/src/approvals/dto/publish-approval.dto.ts`
- Create: `apps/api/src/approvals/dto/close-approval.dto.ts`
- Create: `apps/api/src/votes/votes.module.ts`
- Create: `apps/api/src/votes/votes.controller.ts`
- Create: `apps/api/src/votes/votes.service.ts`
- Create: `apps/api/src/votes/dto/upsert-vote.dto.ts`
- Create: `apps/api/src/results/results.module.ts`
- Create: `apps/api/src/results/results.service.ts`
- Create: `apps/api/src/results/results.controller.ts`
- Create: `apps/api/test/groups.service.spec.ts`
- Create: `apps/api/test/approvals.service.spec.ts`
- Create: `apps/api/test/votes.service.spec.ts`
- Create: `apps/api/test/results.service.spec.ts`

### 小程序前端

- Create: `apps/miniapp/package.json`
- Create: `apps/miniapp/project.config.json`
- Create: `apps/miniapp/tsconfig.json`
- Create: `apps/miniapp/src/app.config.ts`
- Create: `apps/miniapp/src/app.tsx`
- Create: `apps/miniapp/src/app.scss`
- Create: `apps/miniapp/src/utils/request.ts`
- Create: `apps/miniapp/src/store/session.ts`
- Create: `apps/miniapp/src/store/group.ts`
- Create: `apps/miniapp/src/pages/groups/index.config.ts`
- Create: `apps/miniapp/src/pages/groups/index.tsx`
- Create: `apps/miniapp/src/pages/groups/index.scss`
- Create: `apps/miniapp/src/pages/approval-list/index.config.ts`
- Create: `apps/miniapp/src/pages/approval-list/index.tsx`
- Create: `apps/miniapp/src/pages/approval-list/index.scss`
- Create: `apps/miniapp/src/pages/approval-form/index.config.ts`
- Create: `apps/miniapp/src/pages/approval-form/index.tsx`
- Create: `apps/miniapp/src/pages/approval-form/index.scss`
- Create: `apps/miniapp/src/pages/approval-detail/index.config.ts`
- Create: `apps/miniapp/src/pages/approval-detail/index.tsx`
- Create: `apps/miniapp/src/pages/approval-detail/index.scss`

### CI

- Create: `.circleci/config.yml`

## Task 1: 初始化 Monorepo 与共享常量

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `docker-compose.yml`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/approval.ts`
- Create: `packages/shared/src/group.ts`

- [ ] **Step 1: 写根工作区配置**

```json
{
  "name": "purchase-approval-miniapp",
  "private": true,
  "packageManager": "pnpm@10.14.0",
  "scripts": {
    "dev:api": "pnpm --filter api start:dev",
    "dev:miniapp": "pnpm --filter miniapp dev:weapp",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  }
}
```

```yaml
packages:
  - apps/*
  - packages/*
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@purchase/shared": ["packages/shared/src"]
    }
  }
}
```

- [ ] **Step 2: 写开发基础文件**

```gitignore
node_modules
dist
.turbo
.DS_Store
.env
.env.local
apps/api/prisma/dev.db
apps/api/.nestjs-cli.json
apps/miniapp/dist
apps/miniapp/.temp
```

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
```

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: purchase_approval
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
```

- [ ] **Step 3: 创建共享类型包**

```json
{
  "name": "@purchase/shared",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

```ts
export const approvalRuleTypes = [
  'majority',
  'unanimous',
  'owner_decision',
  'reference_only',
] as const;

export const approvalStatuses = [
  'draft',
  'open',
  'closed',
  'approved',
  'rejected',
] as const;

export type ApprovalRuleType = (typeof approvalRuleTypes)[number];
export type ApprovalStatus = (typeof approvalStatuses)[number];

export type VoteChoice = 'agree' | 'reject';
```

```ts
export type GroupRole = 'owner' | 'member';
```

```ts
export * from './approval';
export * from './group';
```

- [ ] **Step 4: 安装根依赖并验证**

Run:

```bash
pnpm install
```

Expected:

```text
Done in
```

- [ ] **Step 5: 提交**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .editorconfig docker-compose.yml packages/shared
git commit -m "chore: initialize workspace and shared package"
```

## Task 2: 搭建 NestJS API 与 Prisma 数据模型

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/.env.example`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/config/env.validation.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`

- [ ] **Step 1: 初始化 API 工程配置**

```json
{
  "name": "api",
  "private": true,
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "vitest run",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^6.0.0",
    "@purchase/shared": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "prisma": "^6.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.8"
  }
}
```

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/purchase_approval?schema=public
```

- [ ] **Step 2: 写 Prisma 数据模型**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String         @id @default(cuid())
  openId     String         @unique
  nickname   String
  avatarUrl  String?
  ownedGroups Group[]       @relation("GroupOwner")
  memberships GroupMember[]
  approvals  Approval[]     @relation("ApprovalCreator")
  votes      ApprovalVote[]
  createdAt  DateTime       @default(now())
}

model Group {
  id          String        @id @default(cuid())
  name        String
  ownerId     String
  inviteCode  String        @unique
  owner       User          @relation("GroupOwner", fields: [ownerId], references: [id])
  members     GroupMember[]
  approvals   Approval[]
  inviteCodes InviteCode[]
  createdAt   DateTime      @default(now())
}
```

```prisma
model GroupMember {
  id        String   @id @default(cuid())
  groupId    String
  userId     String
  role       String
  group      Group    @relation(fields: [groupId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
  joinedAt   DateTime @default(now())

  @@unique([groupId, userId])
}

model Approval {
  id               String         @id @default(cuid())
  groupId          String
  creatorId        String
  title            String
  productName      String
  productImage     String?
  productLink      String?
  unitPrice        Decimal
  quantity         Int
  totalPrice       Decimal
  reason           String
  currentPain      String?
  expectedBenefit  String?
  budgetImpact     String
  alternativeOption String?
  riskIfNotBuy     String?
  ruleType         String
  allowRevote      Boolean        @default(true)
  deadlineAt       DateTime
  status           String         @default("draft")
  result           String?
  publishedAt      DateTime?
  closedAt         DateTime?
  resultGeneratedAt DateTime?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  group            Group          @relation(fields: [groupId], references: [id])
  creator          User           @relation("ApprovalCreator", fields: [creatorId], references: [id])
  votes            ApprovalVote[]
  resultLogs       ApprovalResultLog[]
}

model ApprovalVote {
  id         String   @id @default(cuid())
  approvalId String
  userId     String
  voteChoice String
  voteReason String?
  votedAt    DateTime @default(now())
  updatedAt  DateTime @updatedAt
  approval   Approval @relation(fields: [approvalId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@unique([approvalId, userId])
}

model ApprovalResultLog {
  id             String   @id @default(cuid())
  approvalId     String
  resultType     String
  ruleType       String
  agreeCount     Int
  rejectCount    Int
  decisionBy     String?
  decisionReason String?
  createdAt      DateTime @default(now())
  approval       Approval @relation(fields: [approvalId], references: [id])
}

model InviteCode {
  id         String   @id @default(cuid())
  groupId    String
  code       String   @unique
  createdBy  String
  expiredAt  DateTime?
  status     String   @default("active")
  createdAt  DateTime @default(now())
  group      Group    @relation(fields: [groupId], references: [id])
}
```

- [ ] **Step 3: 写应用启动与环境校验**

```ts
// apps/api/src/config/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
```

```ts
// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

- [ ] **Step 4: 写 Prisma 模块**

```ts
// apps/api/src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

```ts
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (input) => envSchema.parse(input),
    }),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 5: 启动数据库迁移并验证 API 可启动**

Run:

```bash
docker compose up -d
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate --name init
pnpm --filter api start:dev
```

Expected:

```text
Nest application successfully started
```

- [ ] **Step 6: 提交**

```bash
git add apps/api docker-compose.yml
git commit -m "feat: bootstrap api and prisma schema"
```

## Task 3: 实现群组创建、加入与成员查询

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/common/dto/current-user.dto.ts`
- Create: `apps/api/src/groups/groups.module.ts`
- Create: `apps/api/src/groups/groups.controller.ts`
- Create: `apps/api/src/groups/groups.service.ts`
- Create: `apps/api/src/groups/dto/create-group.dto.ts`
- Create: `apps/api/src/groups/dto/join-group.dto.ts`
- Test: `apps/api/test/groups.service.spec.ts`

- [ ] **Step 1: 先写群组服务失败测试**

```ts
import { describe, expect, it, vi } from 'vitest';
import { GroupsService } from '../src/groups/groups.service';

describe('GroupsService', () => {
  it('creates a group and inserts owner membership', async () => {
    const prisma = {
      group: { create: vi.fn().mockResolvedValue({ id: 'g1', name: '宿舍群' }) },
      groupMember: { create: vi.fn().mockResolvedValue({ id: 'm1' }) },
    } as any;

    const service = new GroupsService(prisma);
    const result = await service.createGroup({ userId: 'u1' }, { name: '宿舍群' });

    expect(result.id).toBe('g1');
    expect(prisma.groupMember.create).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm --filter api test apps/api/test/groups.service.spec.ts
```

Expected:

```text
FAIL
Cannot find module '../src/groups/groups.service'
```

- [ ] **Step 3: 写 DTO、Service 与 Controller**

```ts
// apps/api/src/common/dto/current-user.dto.ts
export class CurrentUserDto {
  userId!: string;
  nickname?: string;
}
```

```ts
// apps/api/src/groups/dto/create-group.dto.ts
import { IsString, Length } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @Length(2, 24)
  name!: string;
}
```

```ts
// apps/api/src/groups/groups.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(user: CurrentUserDto, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        ownerId: user.userId,
        inviteCode: randomUUID().slice(0, 8),
      },
    });

    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId: user.userId, role: 'owner' },
    });

    return group;
  }

  async joinGroup(user: CurrentUserDto, dto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { inviteCode: dto.inviteCode } });
    if (!group) throw new NotFoundException('邀请码不存在');

    return this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: user.userId } },
      update: {},
      create: { groupId: group.id, userId: user.userId, role: 'member' },
    });
  }

  async listMyGroups(userId: string) {
    return this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    });
  }
}
```

```ts
// apps/api/src/groups/groups.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup({ userId: 'demo-user' } as CurrentUserDto, dto);
  }

  @Post('join')
  join(@Body() dto: JoinGroupDto) {
    return this.groupsService.joinGroup({ userId: 'demo-user' } as CurrentUserDto, dto);
  }

  @Get('my')
  myGroups() {
    return this.groupsService.listMyGroups('demo-user');
  }

  @Get(':groupId/members')
  listMembers(@Param('groupId') groupId: string) {
    return this.groupsService.listMembers(groupId);
  }
}
```

- [ ] **Step 4: 补 `listMembers` 并让测试通过**

```ts
async listMembers(groupId: string) {
  return this.prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  });
}
```

```ts
// apps/api/src/groups/dto/join-group.dto.ts
import { IsString, Length } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @Length(6, 12)
  inviteCode!: string;
}
```

Run:

```bash
pnpm --filter api test apps/api/test/groups.service.spec.ts
```

Expected:

```text
PASS
```

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/groups apps/api/src/common/dto apps/api/test/groups.service.spec.ts apps/api/src/app.module.ts
git commit -m "feat: add group creation and join flow"
```

## Task 4: 实现审批创建、发布、关闭与详情查询

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/approvals/approvals.module.ts`
- Create: `apps/api/src/approvals/approvals.controller.ts`
- Create: `apps/api/src/approvals/approvals.service.ts`
- Create: `apps/api/src/approvals/dto/create-approval.dto.ts`
- Create: `apps/api/src/approvals/dto/publish-approval.dto.ts`
- Create: `apps/api/src/approvals/dto/close-approval.dto.ts`
- Test: `apps/api/test/approvals.service.spec.ts`

- [ ] **Step 1: 写审批创建失败测试**

```ts
import { describe, expect, it, vi } from 'vitest';
import { ApprovalsService } from '../src/approvals/approvals.service';

describe('ApprovalsService', () => {
  it('computes total price when creating approval', async () => {
    const prisma = {
      approval: { create: vi.fn().mockResolvedValue({ id: 'a1', totalPrice: 1998 }) },
    } as any;

    const service = new ApprovalsService(prisma);
    const result = await service.createApproval(
      { userId: 'u1' } as any,
      {
        groupId: 'g1',
        title: '要不要买显示器',
        productName: '27 寸显示器',
        unitPrice: 999,
        quantity: 2,
        reason: '写代码需要双屏',
        budgetImpact: '本月预算会减少',
        ruleType: 'majority',
        deadlineAt: '2026-08-30T10:00:00.000Z',
      } as any,
    );

    expect(prisma.approval.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 1998 }),
      }),
    );
    expect(result.id).toBe('a1');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm --filter api test apps/api/test/approvals.service.spec.ts
```

Expected:

```text
FAIL
Cannot find module '../src/approvals/approvals.service'
```

- [ ] **Step 3: 写审批 DTO 与 Service**

```ts
// apps/api/src/approvals/dto/create-approval.dto.ts
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateApprovalDto {
  @IsString()
  groupId!: string;

  @IsString()
  title!: string;

  @IsString()
  productName!: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  reason!: string;

  @IsString()
  budgetImpact!: string;

  @IsString()
  ruleType!: string;

  @IsISO8601()
  deadlineAt!: string;

  @IsOptional()
  @IsBoolean()
  allowRevote?: boolean;
}
```

```ts
// apps/api/src/approvals/approvals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApprovalDto } from './dto/create-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createApproval(user: CurrentUserDto, dto: CreateApprovalDto) {
    return this.prisma.approval.create({
      data: {
        groupId: dto.groupId,
        creatorId: user.userId,
        title: dto.title,
        productName: dto.productName,
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
        totalPrice: dto.unitPrice * dto.quantity,
        reason: dto.reason,
        budgetImpact: dto.budgetImpact,
        ruleType: dto.ruleType,
        deadlineAt: new Date(dto.deadlineAt),
        allowRevote: dto.allowRevote ?? true,
      },
    });
  }

  async publishApproval(approvalId: string) {
    return this.prisma.approval.update({
      where: { id: approvalId },
      data: { status: 'open', publishedAt: new Date() },
    });
  }
}
```

- [ ] **Step 4: 写详情、列表和关闭逻辑**

```ts
async listApprovals(groupId: string) {
  return this.prisma.approval.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
  });
}

async getApprovalDetail(approvalId: string) {
  const approval = await this.prisma.approval.findUnique({
    where: { id: approvalId },
    include: { votes: { include: { user: true } } },
  });
  if (!approval) throw new NotFoundException('审批不存在');
  return approval;
}

async closeApproval(approvalId: string) {
  return this.prisma.approval.update({
    where: { id: approvalId },
    data: { status: 'closed', closedAt: new Date() },
  });
}
```

```ts
// apps/api/src/approvals/approvals.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';

@Controller()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post('approvals')
  create(@Body() dto: CreateApprovalDto) {
    return this.approvalsService.createApproval({ userId: 'demo-user' } as CurrentUserDto, dto);
  }

  @Get('groups/:groupId/approvals')
  list(@Param('groupId') groupId: string) {
    return this.approvalsService.listApprovals(groupId);
  }

  @Get('approvals/:approvalId')
  detail(@Param('approvalId') approvalId: string) {
    return this.approvalsService.getApprovalDetail(approvalId);
  }
}
```

- [ ] **Step 5: 跑测试并提交**

Run:

```bash
pnpm --filter api test apps/api/test/approvals.service.spec.ts
```

Expected:

```text
PASS
```

```bash
git add apps/api/src/approvals apps/api/test/approvals.service.spec.ts apps/api/src/app.module.ts
git commit -m "feat: add approval creation lifecycle"
```

## Task 5: 实现投票接口与规则结算

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/votes/votes.module.ts`
- Create: `apps/api/src/votes/votes.controller.ts`
- Create: `apps/api/src/votes/votes.service.ts`
- Create: `apps/api/src/votes/dto/upsert-vote.dto.ts`
- Create: `apps/api/src/results/results.module.ts`
- Create: `apps/api/src/results/results.controller.ts`
- Create: `apps/api/src/results/results.service.ts`
- Test: `apps/api/test/votes.service.spec.ts`
- Test: `apps/api/test/results.service.spec.ts`

- [ ] **Step 1: 先写规则结算测试**

```ts
import { describe, expect, it } from 'vitest';
import { ResultsService } from '../src/results/results.service';

describe('ResultsService', () => {
  it('approves majority result when agree count is greater than reject count', () => {
    const service = new ResultsService({} as any);

    const result = service.evaluate('majority', [
      { voteChoice: 'agree' },
      { voteChoice: 'agree' },
      { voteChoice: 'reject' },
    ] as any);

    expect(result).toEqual({ result: 'approved', agreeCount: 2, rejectCount: 1 });
  });
});
```

- [ ] **Step 2: 写投票 DTO 与投票服务**

```ts
// apps/api/src/votes/dto/upsert-vote.dto.ts
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertVoteDto {
  @IsIn(['agree', 'reject'])
  voteChoice!: 'agree' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  voteReason?: string;
}
```

```ts
// apps/api/src/votes/votes.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertVoteDto } from './dto/upsert-vote.dto';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertVote(user: CurrentUserDto, approvalId: string, dto: UpsertVoteDto) {
    const approval = await this.prisma.approval.findUnique({ where: { id: approvalId } });
    if (!approval || approval.status !== 'open') throw new BadRequestException('审批未开放投票');

    return this.prisma.approvalVote.upsert({
      where: { approvalId_userId: { approvalId, userId: user.userId } },
      update: { voteChoice: dto.voteChoice, voteReason: dto.voteReason ?? null },
      create: {
        approvalId,
        userId: user.userId,
        voteChoice: dto.voteChoice,
        voteReason: dto.voteReason ?? null,
      },
    });
  }
}
```

- [ ] **Step 3: 写规则结算服务**

```ts
// apps/api/src/results/results.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ResultsService {
  evaluate(ruleType: string, votes: Array<{ voteChoice: 'agree' | 'reject' }>) {
    const agreeCount = votes.filter((vote) => vote.voteChoice === 'agree').length;
    const rejectCount = votes.filter((vote) => vote.voteChoice === 'reject').length;

    if (ruleType === 'majority') {
      return { result: agreeCount > rejectCount ? 'approved' : 'rejected', agreeCount, rejectCount };
    }

    if (ruleType === 'unanimous') {
      return { result: rejectCount === 0 && agreeCount > 0 ? 'approved' : 'rejected', agreeCount, rejectCount };
    }

    if (ruleType === 'reference_only') {
      return { result: 'closed', agreeCount, rejectCount };
    }

    return { result: 'pending_owner_decision', agreeCount, rejectCount };
  }
}
```

- [ ] **Step 4: 写结算落库逻辑并跑测试**

```ts
async settleApproval(approvalId: string) {
  const approval = await this.prisma.approval.findUnique({
    where: { id: approvalId },
    include: { votes: true },
  });

  const evaluated = this.evaluate(approval!.ruleType, approval!.votes as Array<{ voteChoice: 'agree' | 'reject' }>);

  await this.prisma.approvalResultLog.create({
    data: {
      approvalId,
      ruleType: approval!.ruleType,
      resultType: evaluated.result,
      agreeCount: evaluated.agreeCount,
      rejectCount: evaluated.rejectCount,
    },
  });

  return this.prisma.approval.update({
    where: { id: approvalId },
    data: {
      result: evaluated.result,
      status: evaluated.result === 'approved' ? 'approved' : evaluated.result === 'rejected' ? 'rejected' : 'closed',
      resultGeneratedAt: new Date(),
    },
  });
}
```

Run:

```bash
pnpm --filter api test apps/api/test/votes.service.spec.ts apps/api/test/results.service.spec.ts
```

Expected:

```text
PASS
```

- [ ] **Step 5: 提交**

```bash
git add apps/api/src/votes apps/api/src/results apps/api/test/votes.service.spec.ts apps/api/test/results.service.spec.ts apps/api/src/app.module.ts
git commit -m "feat: add vote flow and result evaluation"
```

## Task 6: 初始化 Taro 小程序与基础状态管理

**Files:**
- Create: `apps/miniapp/package.json`
- Create: `apps/miniapp/project.config.json`
- Create: `apps/miniapp/tsconfig.json`
- Create: `apps/miniapp/src/app.config.ts`
- Create: `apps/miniapp/src/app.tsx`
- Create: `apps/miniapp/src/app.scss`
- Create: `apps/miniapp/src/utils/request.ts`
- Create: `apps/miniapp/src/store/session.ts`
- Create: `apps/miniapp/src/store/group.ts`

- [ ] **Step 1: 写小程序工程配置**

```json
{
  "name": "miniapp",
  "private": true,
  "scripts": {
    "dev:weapp": "taro build --type weapp --watch",
    "build": "taro build --type weapp",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "test": "vitest run"
  },
  "dependencies": {
    "@purchase/shared": "workspace:*",
    "@tarojs/components": "^4.0.7",
    "@tarojs/runtime": "^4.0.7",
    "@tarojs/taro": "^4.0.7",
    "@tarojs/react": "^4.0.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.1"
  }
}
```

- [ ] **Step 2: 写全局配置与页面注册**

```ts
// apps/miniapp/src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/groups/index',
    'pages/approval-list/index',
    'pages/approval-form/index',
    'pages/approval-detail/index',
  ],
  window: {
    navigationBarTitleText: '购买审批',
    navigationBarBackgroundColor: '#6d4aff',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f7f7fb',
  },
});
```

```ts
// apps/miniapp/src/app.tsx
import './app.scss';

export default function App({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: 写请求层与状态仓库**

```ts
// apps/miniapp/src/utils/request.ts
import Taro from '@tarojs/taro';

const baseUrl = 'http://localhost:3000/api';

export async function request<T>(url: string, method: 'GET' | 'POST', data?: unknown) {
  const response = await Taro.request<T>({
    url: `${baseUrl}${url}`,
    method,
    data,
    header: { 'content-type': 'application/json' },
  });

  return response.data;
}
```

```ts
// apps/miniapp/src/store/session.ts
import { create } from 'zustand';

type SessionState = {
  userId: string;
  nickname: string;
  setSession: (userId: string, nickname: string) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  userId: 'demo-user',
  nickname: '演示用户',
  setSession: (userId, nickname) => set({ userId, nickname }),
}));
```

```ts
// apps/miniapp/src/store/group.ts
import { create } from 'zustand';

type GroupState = {
  currentGroupId: string;
  setCurrentGroupId: (groupId: string) => void;
};

export const useGroupStore = create<GroupState>((set) => ({
  currentGroupId: '',
  setCurrentGroupId: (currentGroupId) => set({ currentGroupId }),
}));
```

- [ ] **Step 4: 构建验证**

Run:

```bash
pnpm --filter miniapp build
```

Expected:

```text
Build complete
```

- [ ] **Step 5: 提交**

```bash
git add apps/miniapp
git commit -m "feat: bootstrap taro miniapp shell"
```

## Task 7: 实现群组页、审批列表页与发起审批页

**Files:**
- Create: `apps/miniapp/src/pages/groups/index.config.ts`
- Create: `apps/miniapp/src/pages/groups/index.tsx`
- Create: `apps/miniapp/src/pages/groups/index.scss`
- Create: `apps/miniapp/src/pages/approval-list/index.config.ts`
- Create: `apps/miniapp/src/pages/approval-list/index.tsx`
- Create: `apps/miniapp/src/pages/approval-list/index.scss`
- Create: `apps/miniapp/src/pages/approval-form/index.config.ts`
- Create: `apps/miniapp/src/pages/approval-form/index.tsx`
- Create: `apps/miniapp/src/pages/approval-form/index.scss`

- [ ] **Step 1: 写群组页**

```ts
// apps/miniapp/src/pages/groups/index.tsx
import { Button, Input, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/request';
import { useGroupStore } from '../../store/group';

export default function GroupsPage() {
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const { setCurrentGroupId } = useGroupStore();

  useDidShow(async () => {
    const data = await request<Array<{ id: string; name: string }>>('/groups/my', 'GET');
    setGroups(data);
  });

  const createGroup = async () => {
    const created = await request<{ id: string; name: string }>('/groups', 'POST', { name: groupName });
    setCurrentGroupId(created.id);
    Taro.navigateTo({ url: '/pages/approval-list/index' });
  };

  const joinGroup = async () => {
    await request('/groups/join', 'POST', { inviteCode });
    Taro.showToast({ title: '加入成功', icon: 'success' });
  };

  return (
    <View className='page'>
      <Text className='title'>我的群组</Text>
      <Input value={groupName} onInput={(e) => setGroupName(e.detail.value)} placeholder='输入新群组名称' />
      <Button onClick={createGroup}>创建群组</Button>
      <Input value={inviteCode} onInput={(e) => setInviteCode(e.detail.value)} placeholder='输入邀请码加入' />
      <Button onClick={joinGroup}>加入群组</Button>
      {groups.map((group) => (
        <View key={group.id} onClick={() => setCurrentGroupId(group.id)}>
          {group.name}
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 2: 写审批列表页**

```ts
// apps/miniapp/src/pages/approval-list/index.tsx
import { Button, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/request';
import { useGroupStore } from '../../store/group';

export default function ApprovalListPage() {
  const { currentGroupId } = useGroupStore();
  const [items, setItems] = useState<Array<{ id: string; title: string; status: string; ruleType: string }>>([]);

  useDidShow(async () => {
    if (!currentGroupId) return;
    const data = await request<Array<{ id: string; title: string; status: string; ruleType: string }>>(
      `/groups/${currentGroupId}/approvals`,
      'GET',
    );
    setItems(data);
  });

  return (
    <View className='page'>
      <Button onClick={() => Taro.navigateTo({ url: '/pages/approval-form/index' })}>发起审批</Button>
      {items.map((item) => (
        <View key={item.id} className='card' onClick={() => Taro.navigateTo({ url: `/pages/approval-detail/index?id=${item.id}` })}>
          <Text>{item.title}</Text>
          <Text>{item.ruleType}</Text>
          <Text>{item.status}</Text>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 3: 写发起审批页**

```ts
// apps/miniapp/src/pages/approval-form/index.tsx
import { Button, Input, Picker, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';
import { useGroupStore } from '../../store/group';
import { request } from '../../utils/request';

const ruleOptions = [
  { label: '多数票通过', value: 'majority' },
  { label: '全员同意', value: 'unanimous' },
  { label: '群主裁定', value: 'owner_decision' },
  { label: '仅供参考', value: 'reference_only' },
];

export default function ApprovalFormPage() {
  const { currentGroupId } = useGroupStore();
  const [title, setTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [budgetImpact, setBudgetImpact] = useState('');
  const [ruleType, setRuleType] = useState('majority');

  const submit = async () => {
    await request('/approvals', 'POST', {
      groupId: currentGroupId,
      title,
      productName,
      unitPrice: Number(unitPrice),
      quantity: Number(quantity),
      reason,
      budgetImpact,
      ruleType,
      deadlineAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    });
    Taro.navigateBack();
  };

  return (
    <View className='page'>
      <Input value={title} onInput={(e) => setTitle(e.detail.value)} placeholder='审批标题' />
      <Input value={productName} onInput={(e) => setProductName(e.detail.value)} placeholder='商品名称' />
      <Input value={unitPrice} onInput={(e) => setUnitPrice(e.detail.value)} placeholder='单价' type='digit' />
      <Input value={quantity} onInput={(e) => setQuantity(e.detail.value)} placeholder='数量' type='number' />
      <Textarea value={reason} onInput={(e) => setReason(e.detail.value)} placeholder='购买理由' />
      <Textarea value={budgetImpact} onInput={(e) => setBudgetImpact(e.detail.value)} placeholder='预算影响' />
      <Picker mode='selector' range={ruleOptions} rangeKey='label' onChange={(e) => setRuleType(ruleOptions[Number(e.detail.value)].value)}>
        <View>{ruleOptions.find((item) => item.value === ruleType)?.label}</View>
      </Picker>
      <Button onClick={submit}>提交审批</Button>
    </View>
  );
}
```

- [ ] **Step 4: 手动验证**

Run:

```bash
pnpm dev:api
pnpm dev:miniapp
```

Expected:

```text
能在开发者工具中完成建组、切组、进入审批列表、提交审批
```

- [ ] **Step 5: 提交**

```bash
git add apps/miniapp/src/pages/groups apps/miniapp/src/pages/approval-list apps/miniapp/src/pages/approval-form
git commit -m "feat: add group and approval creation pages"
```

## Task 8: 实现审批详情页、实名投票与 CircleCI 校验

**Files:**
- Create: `apps/miniapp/src/pages/approval-detail/index.config.ts`
- Create: `apps/miniapp/src/pages/approval-detail/index.tsx`
- Create: `apps/miniapp/src/pages/approval-detail/index.scss`
- Create: `.circleci/config.yml`

- [ ] **Step 1: 写审批详情页与实名投票界面**

```ts
// apps/miniapp/src/pages/approval-detail/index.tsx
import { Button, Text, Textarea, View } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { request } from '../../utils/request';

type VoteItem = {
  id: string;
  voteChoice: 'agree' | 'reject';
  voteReason?: string;
  user: { nickname: string };
};

export default function ApprovalDetailPage() {
  const router = useRouter();
  const approvalId = router.params.id!;
  const [detail, setDetail] = useState<any>(null);
  const [voteReason, setVoteReason] = useState('');

  const refresh = async () => {
    const data = await request<any>(`/approvals/${approvalId}`, 'GET');
    setDetail(data);
  };

  useDidShow(refresh);

  const submitVote = async (voteChoice: 'agree' | 'reject') => {
    await request(`/approvals/${approvalId}/vote`, 'POST', { voteChoice, voteReason });
    setVoteReason('');
    await refresh();
    Taro.showToast({ title: '投票成功', icon: 'success' });
  };

  if (!detail) return <View className='page'>加载中...</View>;

  const agreeVotes = (detail.votes as VoteItem[]).filter((vote) => vote.voteChoice === 'agree');
  const rejectVotes = (detail.votes as VoteItem[]).filter((vote) => vote.voteChoice === 'reject');

  return (
    <View className='page'>
      <Text className='title'>{detail.title}</Text>
      <Text>{detail.productName}</Text>
      <Text>{detail.reason}</Text>
      <Textarea value={voteReason} onInput={(e) => setVoteReason(e.detail.value)} placeholder='写一句投票理由' />
      <Button onClick={() => submitVote('agree')}>同意</Button>
      <Button onClick={() => submitVote('reject')}>不同意</Button>
      <View className='section'>
        <Text>同意名单</Text>
        {agreeVotes.map((vote) => (
          <View key={vote.id}>{vote.user.nickname}：{vote.voteReason || '未填写理由'}</View>
        ))}
      </View>
      <View className='section'>
        <Text>反对名单</Text>
        {rejectVotes.map((vote) => (
          <View key={vote.id}>{vote.user.nickname}：{vote.voteReason || '未填写理由'}</View>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 写 CircleCI 配置**

```yaml
version: 2.1

jobs:
  verify:
    docker:
      - image: cimg/node:20.18
      - image: cimg/postgres:16.4
        environment:
          POSTGRES_DB: purchase_approval
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
    steps:
      - checkout
      - run: corepack enable
      - run: pnpm install --frozen-lockfile=false
      - run: cp apps/api/.env.example apps/api/.env
      - run: pnpm --filter api prisma:generate
      - run: pnpm --filter api prisma:migrate --name ci_init
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm --filter miniapp build

workflows:
  verify-on-commit:
    jobs:
      - verify
```

- [ ] **Step 3: 本地跑完整验证**

Run:

```bash
pnpm lint
pnpm test
pnpm --filter miniapp build
```

Expected:

```text
所有命令成功退出，API 单测通过，小程序构建通过
```

- [ ] **Step 4: 提交**

```bash
git add apps/miniapp/src/pages/approval-detail .circleci/config.yml
git commit -m "feat: add approval voting page and ci pipeline"
```

## Spec Coverage Check

- `群组创建与邀请码加入`：Task 3、Task 7
- `审批创建、发布、关闭`：Task 4、Task 7
- `实名投票与理由展示`：Task 5、Task 8
- `规则结算`：Task 5
- `MVP 页面结构`：Task 6、Task 7、Task 8
- `NestJS + Taro + shared package + CircleCI`：Task 1、Task 2、Task 6、Task 8

## Self-Review Notes

- 本计划没有使用 `TODO`、`TBD` 或“稍后补充”类占位语。
- 前后端字段名统一使用 `ruleType`、`allowRevote`、`voteChoice`、`voteReason`。
- 若后续希望把登录从 `demo-user` 换成真实微信登录，应新增单独计划，而不是在本计划中途扩散范围。
