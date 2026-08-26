import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertVoteDto } from './dto/upsert-vote.dto';

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertVote(user: CurrentUserDto, approvalId: string, dto: UpsertVoteDto) {
    await this.ensureUserRecord(user.userId);

    const approval = await this.getApprovalForMember(approvalId, user.userId);

    if (approval.status !== 'open') {
      throw new BadRequestException('审批未开放投票');
    }

    if (approval.allowRevote === false) {
      const existingVote = await this.prisma.approvalVote.findUnique({
        where: { approvalId_userId: { approvalId, userId: user.userId } },
      });

      if (existingVote) {
        throw new BadRequestException('当前审批不允许改票');
      }
    }

    return this.prisma.approvalVote.upsert({
      where: { approvalId_userId: { approvalId, userId: user.userId } },
      update: { voteChoice: dto.voteChoice, voteReason: dto.voteReason },
      create: {
        approvalId,
        userId: user.userId,
        voteChoice: dto.voteChoice,
        voteReason: dto.voteReason,
      },
    });
  }

  async listVotes(approvalId: string, userId: string) {
    await this.getApprovalForMember(approvalId, userId);

    return this.prisma.approvalVote.findMany({
      where: { approvalId },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
    });
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

  private async getApprovalForMember(approvalId: string, userId: string) {
    const approval = await this.prisma.approval.findUnique({ where: { id: approvalId } });

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
