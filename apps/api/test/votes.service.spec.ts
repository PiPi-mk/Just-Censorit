import { describe, expect, it, vi } from 'vitest';
import { VotesService } from '../src/votes/votes.service';

describe('VotesService', () => {
  it('upserts a vote by approvalId and userId when approval is open', async () => {
    const prisma = {
      user: { upsert: vi.fn().mockResolvedValue({ id: 'u1' }) },
      groupMember: {
        findUnique: vi.fn().mockResolvedValue({ id: 'gm1', groupId: 'g1', userId: 'u1' }),
      },
      approval: {
        findUnique: vi.fn().mockResolvedValue({ id: 'a1', status: 'open', groupId: 'g1', allowRevote: true }),
      },
      approvalVote: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({
          id: 'v1',
          approvalId: 'a1',
          userId: 'u1',
          voteChoice: 'agree',
          voteReason: '值得买',
        }),
      },
    } as any;

    const service = new VotesService(prisma);
    const result = await service.upsertVote(
      { userId: 'u1' } as any,
      'a1',
      { voteChoice: 'agree', voteReason: '值得买' } as any,
    );

    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: 'g1', userId: 'u1' } },
    });
    expect(prisma.approvalVote.upsert).toHaveBeenCalledWith({
      where: { approvalId_userId: { approvalId: 'a1', userId: 'u1' } },
      update: { voteChoice: 'agree', voteReason: '值得买' },
      create: {
        approvalId: 'a1',
        userId: 'u1',
        voteChoice: 'agree',
        voteReason: '值得买',
      },
    });
    expect(result.id).toBe('v1');
  });

  it('rejects changing an existing vote when allowRevote is false', async () => {
    const prisma = {
      user: { upsert: vi.fn().mockResolvedValue({ id: 'u1' }) },
      groupMember: {
        findUnique: vi.fn().mockResolvedValue({ id: 'gm1', groupId: 'g1', userId: 'u1' }),
      },
      approval: {
        findUnique: vi.fn().mockResolvedValue({ id: 'a1', status: 'open', groupId: 'g1', allowRevote: false }),
      },
      approvalVote: {
        findUnique: vi.fn().mockResolvedValue({ id: 'v1', approvalId: 'a1', userId: 'u1' }),
        upsert: vi.fn(),
      },
    } as any;

    const service = new VotesService(prisma);

    await expect(
      service.upsertVote(
        { userId: 'u1' } as any,
        'a1',
        { voteChoice: 'reject', voteReason: '改主意了' } as any,
      ),
    ).rejects.toThrow('当前审批不允许改票');
    expect(prisma.approvalVote.upsert).not.toHaveBeenCalled();
  });
});
