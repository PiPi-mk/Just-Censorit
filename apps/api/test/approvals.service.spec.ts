import { describe, expect, it, vi } from 'vitest';
import { ApprovalsService } from '../src/approvals/approvals.service';

describe('ApprovalsService', () => {
  it('computes total price when creating approval', async () => {
    const prisma = {
      user: { upsert: vi.fn().mockResolvedValue({ id: 'u1' }) },
      groupMember: {
        findUnique: vi.fn().mockResolvedValue({ id: 'gm1', groupId: 'g1', userId: 'u1' }),
      },
      approval: { create: vi.fn().mockResolvedValue({ id: 'a1', totalPrice: 1998 }) },
    } as any;
    const resultsService = { settleApproval: vi.fn() } as any;

    const service = new ApprovalsService(prisma, resultsService);
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

    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(prisma.groupMember.findUnique).toHaveBeenCalledWith({
      where: { groupId_userId: { groupId: 'g1', userId: 'u1' } },
    });
    expect(prisma.approval.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalPrice: 1998 }),
      }),
    );
    expect(result.id).toBe('a1');
  });

  it('rejects approval creation when user is not a group member', async () => {
    const prisma = {
      user: { upsert: vi.fn().mockResolvedValue({ id: 'u1' }) },
      groupMember: { findUnique: vi.fn().mockResolvedValue(null) },
      approval: { create: vi.fn() },
    } as any;
    const service = new ApprovalsService(prisma, { settleApproval: vi.fn() } as any);

    await expect(
      service.createApproval(
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
      ),
    ).rejects.toThrow('无权访问该群组');
  });

  it('settles approval after closing it', async () => {
    const prisma = {
      approval: {
        update: vi.fn().mockResolvedValue({ id: 'a1', status: 'closed' }),
      },
    } as any;
    const resultsService = {
      settleApproval: vi.fn().mockResolvedValue({ id: 'a1', result: 'approved' }),
    } as any;
    const service = new ApprovalsService(prisma, resultsService);

    const result = await service.closeApproval('a1');

    expect(prisma.approval.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { status: 'closed', closedAt: expect.any(Date) },
    });
    expect(resultsService.settleApproval).toHaveBeenCalledWith('a1');
    expect(result).toEqual({ id: 'a1', result: 'approved' });
  });
});
