import { describe, expect, it } from 'vitest';
import { buildApprovalDetailViewModel } from './view-model';

describe('buildApprovalDetailViewModel', () => {
  it('groups votes, resolves current user vote, and formats key fields for approval detail', () => {
    const detail = {
      id: 'approval-1',
      title: '是否购买新显示器',
      productName: '27 寸显示器',
      totalPrice: 1999.5,
      reason: '双屏提升效率',
      budgetImpact: '占用本月外设预算',
      ruleType: 'majority',
      status: 'open',
      deadlineAt: '2026-08-30T10:30:00.000Z',
      votes: [
        {
          id: 'vote-1',
          voteChoice: 'agree',
          voteReason: '值得买',
          userId: 'demo-user',
          user: { id: 'demo-user', nickname: '演示用户' },
        },
        {
          id: 'vote-2',
          voteChoice: 'reject',
          voteReason: '预算太紧',
          userId: 'user-2',
          user: { id: 'user-2', nickname: '小李' },
        },
        {
          id: 'vote-3',
          voteChoice: 'agree',
          voteReason: '',
          userId: 'user-3',
          user: { id: 'user-3', nickname: '' },
        },
      ],
    };

    const result = buildApprovalDetailViewModel(detail, 'demo-user');

    expect(result.summary.amountText).toBe('¥1999.50');
    expect(result.summary.ruleLabel).toBe('多数通过');
    expect(result.summary.statusLabel).toBe('投票中');
    expect(result.summary.deadlineText).toBe('2026-08-30 10:30');
    expect(result.currentUserVote).toEqual({
      choiceLabel: '同意',
      reasonText: '值得买',
      voterLabel: '演示用户 / demo-user',
    });
    expect(result.voteGroups.agree).toEqual([
      {
        id: 'vote-1',
        choice: 'agree',
        voterLabel: '演示用户 / demo-user',
        reasonText: '值得买',
      },
      {
        id: 'vote-3',
        choice: 'agree',
        voterLabel: 'user-3',
        reasonText: '未填写理由',
      },
    ]);
    expect(result.voteGroups.reject).toEqual([
      {
        id: 'vote-2',
        choice: 'reject',
        voterLabel: '小李 / user-2',
        reasonText: '预算太紧',
      },
    ]);
  });
});
