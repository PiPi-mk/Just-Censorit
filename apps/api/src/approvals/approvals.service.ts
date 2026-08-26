import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ResultsService } from '../results/results.service';
import { CreateApprovalDto } from './dto/create-approval.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
  ) {}

  async createApproval(user: CurrentUserDto, dto: CreateApprovalDto) {
    await this.ensureUserRecord(user.userId);
    await this.assertGroupMember(dto.groupId, user.userId);

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

  async listApprovals(groupId: string, userId: string) {
    await this.assertGroupMember(groupId, userId);

    return this.prisma.approval.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApprovalDetail(approvalId: string, userId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: { votes: { include: { user: true } } },
    });

    if (!approval) {
      throw new NotFoundException('审批不存在');
    }

    await this.assertGroupMember(approval.groupId, userId);

    return approval;
  }

  async publishApproval(approvalId: string) {
    return this.prisma.approval.update({
      where: { id: approvalId },
      data: { status: 'open', publishedAt: new Date() },
    });
  }

  async closeApproval(approvalId: string) {
    await this.prisma.approval.update({
      where: { id: approvalId },
      data: { status: 'closed', closedAt: new Date() },
    });

    return this.resultsService.settleApproval(approvalId);
  }

  private async ensureUserRecord(userId: string) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        openId: userId,
        nickname: userId,
      },
    });
  }

  private async assertGroupMember(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('无权访问该群组');
    }

    return membership;
  }
}
