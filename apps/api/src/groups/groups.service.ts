import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CurrentUserDto } from '../common/dto/current-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(user: CurrentUserDto, dto: CreateGroupDto) {
    await this.ensureUserRecord(user.userId);

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        ownerId: user.userId,
        inviteCode: randomUUID().slice(0, 8),
      },
    });

    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.userId,
        role: 'owner',
      },
    });

    return group;
  }

  async joinGroup(user: CurrentUserDto, dto: JoinGroupDto) {
    await this.ensureUserRecord(user.userId);

    const group = await this.prisma.group.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!group) {
      throw new NotFoundException('邀请码不存在');
    }

    return this.prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.userId,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        userId: user.userId,
        role: 'member',
      },
    });
  }

  async listMyGroups(userId: string) {
    return this.prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async listMembers(groupId: string, userId: string) {
    await this.assertGroupMember(groupId, userId);

    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
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
