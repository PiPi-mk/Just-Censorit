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
