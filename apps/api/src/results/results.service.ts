import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async settleApproval(approvalId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: { votes: true },
    });

    if (!approval) {
      throw new NotFoundException('审批不存在');
    }

    const evaluated = this.evaluate(
      approval.ruleType,
      approval.votes as Array<{ voteChoice: 'agree' | 'reject' }>,
    );

    await this.prisma.approvalResultLog.create({
      data: {
        approvalId,
        ruleType: approval.ruleType,
        resultType: evaluated.result,
        agreeCount: evaluated.agreeCount,
        rejectCount: evaluated.rejectCount,
      },
    });

    return this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        result: evaluated.result,
        status:
          evaluated.result === 'approved'
            ? 'approved'
            : evaluated.result === 'rejected'
              ? 'rejected'
              : 'closed',
        resultGeneratedAt: new Date(),
      },
    });
  }

  async getApprovalResult(approvalId: string, userId: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
      include: { resultLogs: { orderBy: { createdAt: 'desc' } } },
    });

    if (!approval) {
      throw new NotFoundException('审批不存在');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: approval.groupId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('无权访问该群组');
    }

    return approval;
  }
}
