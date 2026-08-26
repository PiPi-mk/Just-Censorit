import { describe, expect, it, vi } from 'vitest';
import { submitApproval } from './submit-approval';

describe('submitApproval', () => {
  it('creates an approval and publishes it immediately for voting', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ id: 'approval-1' })
      .mockResolvedValueOnce({ id: 'approval-1', status: 'open' });

    const payload = {
      groupId: 'group-1',
      title: '是否购买显示器',
      productName: '27 寸显示器',
      unitPrice: 999,
      quantity: 1,
      reason: '提升效率',
      budgetImpact: '占用预算',
      ruleType: 'majority',
      deadlineAt: '2026-08-30T10:00:00.000Z',
    };

    const result = await submitApproval(request as any, payload as any);

    expect(request).toHaveBeenNthCalledWith(1, '/approvals', 'POST', payload);
    expect(request).toHaveBeenNthCalledWith(2, '/approvals/approval-1/publish', 'POST', {});
    expect(result).toEqual({ id: 'approval-1', status: 'open' });
  });
});
