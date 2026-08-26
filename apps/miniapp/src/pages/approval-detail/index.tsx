import { Button, Text, Textarea, View } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import { useCallback, useMemo, useState } from 'react';
import { useSessionStore } from '../../store/session';
import { request } from '../../utils/request';
import { buildApprovalDetailViewModel } from './view-model';
import './index.scss';

export default function ApprovalDetailPage() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.userId);
  const approvalId = router.params.id || router.params.approvalId || '';
  const [detail, setDetail] = useState<any>(null);
  const [voteReason, setVoteReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!approvalId) {
      setErrorMessage('缺少审批 ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await request(`/approvals/${approvalId}`);
      setDetail(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载审批详情失败';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useDidShow(() => {
    void refresh();
  });

  const viewModel = useMemo(() => {
    if (!detail) {
      return null;
    }

    return buildApprovalDetailViewModel(detail, currentUserId);
  }, [currentUserId, detail]);

  const submitVote = useCallback(
    async (voteChoice: 'agree' | 'reject') => {
      if (!approvalId) {
        return;
      }

      setSubmitting(true);
      try {
        await request(`/approvals/${approvalId}/vote`, 'POST', {
          voteChoice,
          voteReason: voteReason.trim(),
        });
        setVoteReason('');
        await refresh();
        Taro.showToast({ title: '投票成功', icon: 'success' });
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交投票失败';
        Taro.showToast({ title: message, icon: 'none' });
      } finally {
        setSubmitting(false);
      }
    },
    [approvalId, refresh, voteReason],
  );

  if (loading) {
    return (
      <View className='approval-detail-page'>
        <View className='state-card'>
          <Text className='state-card__title'>正在加载审批详情</Text>
          <Text className='state-card__description'>稍等一下，系统正在同步最新的实名投票结果。</Text>
        </View>
      </View>
    );
  }

  if (errorMessage || !viewModel) {
    return (
      <View className='approval-detail-page'>
        <View className='state-card'>
          <Text className='state-card__title'>审批详情暂时无法显示</Text>
          <Text className='state-card__description'>{errorMessage || '未获取到审批数据'}</Text>
          <View className='state-card__actions'>
            <Button className='primary-button' onClick={() => void refresh()}>
              重新加载
            </Button>
            <Button className='outline-button' onClick={() => Taro.navigateBack()}>
              返回列表
            </Button>
          </View>
        </View>
      </View>
    );
  }

  const { summary, currentUserVote, voteGroups } = viewModel;

  return (
    <View className='approval-detail-page'>
      <View className='hero-card'>
        <Text className='hero-card__eyebrow'>审批详情</Text>
        <Text className='hero-card__title'>{summary.title}</Text>
        <Text className='hero-card__description'>在同一页完成了解背景、查看实名意见和提交自己的投票。</Text>
      </View>

      <View className='panel'>
        <Text className='section-title'>审批信息</Text>
        <View className='detail-row'>
          <Text className='detail-row__label'>商品</Text>
          <Text className='detail-row__value'>{summary.productName}</Text>
        </View>
        <View className='detail-row'>
          <Text className='detail-row__label'>金额</Text>
          <View className='detail-row__value detail-row__value--stack'>
            <Text>{summary.amountText}</Text>
            {summary.unitPriceText ? <Text className='detail-row__hint'>{summary.unitPriceText} / 件</Text> : null}
            {summary.quantityText ? <Text className='detail-row__hint'>{summary.quantityText}</Text> : null}
          </View>
        </View>
        <View className='detail-row'>
          <Text className='detail-row__label'>理由</Text>
          <Text className='detail-row__value'>{summary.reason}</Text>
        </View>
        <View className='detail-row'>
          <Text className='detail-row__label'>预算影响</Text>
          <Text className='detail-row__value'>{summary.budgetImpact}</Text>
        </View>
        <View className='detail-row'>
          <Text className='detail-row__label'>规则</Text>
          <Text className='detail-row__value'>{summary.ruleLabel}</Text>
        </View>
        <View className='detail-row'>
          <Text className='detail-row__label'>状态</Text>
          <Text className='detail-row__value'>{summary.statusLabel}</Text>
        </View>
        <View className='detail-row'>
          <Text className='detail-row__label'>截止时间</Text>
          <Text className='detail-row__value'>{summary.deadlineText}</Text>
        </View>
      </View>

      <View className='panel'>
        <Text className='section-title'>我的当前投票</Text>
        {currentUserVote ? (
          <View className='current-vote-card'>
            <Text className='current-vote-card__choice'>{currentUserVote.choiceLabel}</Text>
            <Text className='current-vote-card__meta'>{currentUserVote.voterLabel}</Text>
            <Text className='current-vote-card__reason'>{currentUserVote.reasonText}</Text>
          </View>
        ) : (
          <Text className='empty-copy'>你还没有对这条审批投票。</Text>
        )}
      </View>

      <View className='panel'>
        <Text className='section-title'>提交投票</Text>
        <Textarea
          className='vote-textarea'
          maxlength={120}
          placeholder='写一句你的投票理由，其他群成员会实名看到'
          value={voteReason}
          onInput={(event) => setVoteReason(event.detail.value)}
        />
        <View className='vote-actions'>
          <Button className='agree-button' loading={submitting} disabled={submitting} onClick={() => void submitVote('agree')}>
            同意
          </Button>
          <Button className='reject-button' loading={submitting} disabled={submitting} onClick={() => void submitVote('reject')}>
            反对
          </Button>
        </View>
      </View>

      <View className='panel'>
        <View className='section-header'>
          <Text className='section-title'>同意名单</Text>
          <Text className='section-count'>{voteGroups.agree.length} 人</Text>
        </View>
        {voteGroups.agree.length ? (
          voteGroups.agree.map((vote) => (
            <View key={vote.id} className='vote-card vote-card--agree'>
              <Text className='vote-card__name'>{vote.voterLabel}</Text>
              <Text className='vote-card__reason'>{vote.reasonText}</Text>
            </View>
          ))
        ) : (
          <Text className='empty-copy'>暂时还没有人明确表示同意。</Text>
        )}
      </View>

      <View className='panel'>
        <View className='section-header'>
          <Text className='section-title'>反对名单</Text>
          <Text className='section-count'>{voteGroups.reject.length} 人</Text>
        </View>
        {voteGroups.reject.length ? (
          voteGroups.reject.map((vote) => (
            <View key={vote.id} className='vote-card vote-card--reject'>
              <Text className='vote-card__name'>{vote.voterLabel}</Text>
              <Text className='vote-card__reason'>{vote.reasonText}</Text>
            </View>
          ))
        ) : (
          <Text className='empty-copy'>暂时还没有人明确表示反对。</Text>
        )}
      </View>
    </View>
  );
}
