import { Button, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCallback, useMemo, useState } from 'react';
import { useGroupStore } from '../../store/group';
import { request } from '../../utils/request';
import './index.scss';

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

function formatMoney(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) {
    return '刚刚创建';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '刚刚创建';
  }

  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

export default function ApprovalListPage() {
  const currentGroupId = useGroupStore((state) => state.currentGroupId);
  const [approvals, setApprovals] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentGroupId) {
      setApprovals([]);
      setGroupName('');
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all([request(`/groups/${currentGroupId}/approvals`), request('/groups/my')]);
      const approvalData = Array.isArray(results[0]) ? results[0] : [];
      const membershipData = Array.isArray(results[1]) ? results[1] : [];
      setApprovals(approvalData);
      const currentMembership = membershipData.find((item) => item.group && item.group.id === currentGroupId);
      setGroupName((currentMembership && currentMembership.group && currentMembership.group.name) || '当前群组');
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载审批失败';
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [currentGroupId]);

  useDidShow(() => {
    void refresh();
  });

  const summaryText = useMemo(() => {
    if (!approvals.length) {
      return '当前群组还没有审批单';
    }

    const openCount = approvals.filter((item) => item.status === 'open').length;
    return `共 ${approvals.length} 条审批，其中 ${openCount} 条正在投票`;
  }, [approvals]);

  const goToGroups = useCallback(() => {
    Taro.redirectTo({ url: '/pages/groups/index' });
  }, []);

  const goToDetail = useCallback((approvalId) => {
    Taro.navigateTo({ url: `/pages/approval-detail/index?id=${approvalId}` });
  }, []);

  const goToForm = useCallback(() => {
    if (!currentGroupId) {
      Taro.showToast({ title: '请先选择群组', icon: 'none' });
      return;
    }

    Taro.navigateTo({ url: '/pages/approval-form/index' });
  }, [currentGroupId]);

  if (!currentGroupId) {
    return (
      <View className='approval-list-page'>
        <View className='empty-state'>
          <Text className='empty-state__title'>还没有选中群组</Text>
          <Text className='empty-state__description'>先回到群组页选择一个要查看的决策群，再进入审批列表。</Text>
          <Button className='primary-button' onClick={goToGroups}>
            去选择群组
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className='approval-list-page'>
      <View className='summary-card'>
        <Text className='summary-card__eyebrow'>当前群组</Text>
        <Text className='summary-card__title'>{groupName || '加载中...'}</Text>
        <Text className='summary-card__description'>{summaryText}</Text>
        <View className='summary-card__actions'>
          <Button className='primary-button' onClick={goToForm}>
            发起审批
          </Button>
          <Button className='outline-button' loading={loading} disabled={loading} onClick={() => void refresh()}>
            刷新列表
          </Button>
        </View>
      </View>

      {approvals.length > 0 ? (
        approvals.map((item) => (
          <View key={item.id} className='approval-card' hoverClass='approval-card--hover' onClick={() => goToDetail(item.id)}>
            <View className='approval-card__row'>
              <Text className='approval-card__title'>{item.title}</Text>
              <Text className={`status-badge status-badge--${item.status}`}>{STATUS_LABELS[item.status] || item.status}</Text>
            </View>
            <Text className='approval-card__product'>{item.productName}</Text>
            <View className='approval-card__metrics'>
              <Text className='metric-chip'>总额 {formatMoney(item.totalPrice)}</Text>
              <Text className='metric-chip'>数量 x{item.quantity}</Text>
              <Text className='metric-chip metric-chip--rule'>{RULE_LABELS[item.ruleType] || item.ruleType}</Text>
            </View>
            <Text className='approval-card__meta'>{formatDate(item.createdAt)}</Text>
          </View>
        ))
      ) : (
        <View className='empty-state empty-state--compact'>
          <Text className='empty-state__title'>当前群组暂无审批</Text>
          <Text className='empty-state__description'>现在就发起第一条购买审批，把标题、预算影响和决策规则说明清楚。</Text>
          <Button className='primary-button' onClick={goToForm}>
            立即发起
          </Button>
        </View>
      )}
    </View>
  );
}
