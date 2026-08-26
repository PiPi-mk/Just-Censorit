const RULE_LABELS = {
  majority: '多数通过',
  unanimous: '全员同意',
  owner_decision: '群主裁定',
  reference_only: '仅供参考',
};

const STATUS_LABELS = {
  draft: '待发起',
  open: '投票中',
  closed: '已结束',
  approved: '已通过',
  rejected: '未通过',
};

const CHOICE_LABELS = {
  agree: '同意',
  reject: '反对',
};

function formatAmount(value: unknown) {
  const numericValue = Number(value ?? 0);
  return `¥${numericValue.toFixed(2)}`;
}

function formatDateTime(value: unknown) {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}`;
    }
  }

  const date = new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) {
    return '未设置';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatVoterLabel(user: { id?: string; nickname?: string } | undefined, fallbackUserId: string | undefined) {
  const userId = (user?.id || fallbackUserId || '').trim();
  const nickname = (user?.nickname || '').trim();

  if (!nickname) {
    return userId || '未知用户';
  }

  if (!userId || nickname === userId) {
    return nickname;
  }

  return `${nickname} / ${userId}`;
}

function formatVoteItem(vote: any) {
  return {
    id: vote.id,
    choice: vote.voteChoice,
    voterLabel: formatVoterLabel(vote.user, vote.userId),
    reasonText: vote.voteReason && String(vote.voteReason).trim() ? String(vote.voteReason).trim() : '未填写理由',
  };
}

export function buildApprovalDetailViewModel(detail: any, currentUserId: string) {
  const votes = Array.isArray(detail?.votes) ? detail.votes : [];
  const formattedVotes = votes.map(formatVoteItem);
  const agree = formattedVotes.filter((item) => item.choice === 'agree');
  const reject = formattedVotes.filter((item) => item.choice === 'reject');
  const matchedCurrentVote = formattedVotes.find((item, index) => votes[index]?.userId === currentUserId) || null;
  const currentUserVote = matchedCurrentVote
    ? {
        choiceLabel: CHOICE_LABELS[matchedCurrentVote.choice] || matchedCurrentVote.choice,
        voterLabel: matchedCurrentVote.voterLabel,
        reasonText: matchedCurrentVote.reasonText,
      }
    : null;

  return {
    summary: {
      title: detail?.title || '未命名审批',
      productName: detail?.productName || '未填写商品',
      amountText: formatAmount(detail?.totalPrice),
      reason: detail?.reason || '未填写理由',
      budgetImpact: detail?.budgetImpact || '未填写预算影响',
      ruleLabel: RULE_LABELS[detail?.ruleType] || detail?.ruleType || '未设置规则',
      statusLabel: STATUS_LABELS[detail?.status] || detail?.status || '未知状态',
      deadlineText: formatDateTime(detail?.deadlineAt),
      quantityText: detail?.quantity ? `数量 x${detail.quantity}` : '',
      unitPriceText: detail?.unitPrice !== undefined && detail?.unitPrice !== null ? formatAmount(detail.unitPrice) : '',
    },
    currentUserVote,
    voteGroups: {
      agree,
      reject,
    },
  };
}
