import { Button, Input, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useCallback, useMemo, useState } from 'react';
import { useGroupStore } from '../../store/group';
import { useSessionStore } from '../../store/session';
import { request } from '../../utils/request';
import './index.scss';

const ROLE_LABEL = {
  owner: '群主',
  member: '成员',
};

function formatDate(value) {
  if (!value) {
    return '刚刚加入';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '刚刚加入';
  }

  return `${date.getMonth() + 1}月${date.getDate()}日加入`;
}

export default function GroupsPage() {
  const nickname = useSessionStore((state) => state.nickname);
  const currentGroupId = useGroupStore((state) => state.currentGroupId);
  const setCurrentGroupId = useGroupStore((state) => state.setCurrentGroupId);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const refreshGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request('/groups/my');
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载群组失败';
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    void refreshGroups();
  });

  const groupCountText = useMemo(() => `${groups.length} 个可决策群组`, [groups.length]);

  const handleCreateGroup = useCallback(async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Taro.showToast({ title: '请先输入群组名称', icon: 'none' });
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 24) {
      Taro.showToast({ title: '群组名称需为 2-24 个字符', icon: 'none' });
      return;
    }

    setCreating(true);
    try {
      await request('/groups', 'POST', { name: trimmedName });
      setGroupName('');
      await refreshGroups();
      Taro.showToast({ title: '创建成功', icon: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建群组失败';
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setCreating(false);
    }
  }, [groupName, refreshGroups]);

  const handleJoinGroup = useCallback(async () => {
    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      Taro.showToast({ title: '请输入邀请码', icon: 'none' });
      return;
    }

    if (trimmedCode.length < 6 || trimmedCode.length > 12) {
      Taro.showToast({ title: '邀请码长度需为 6-12 位', icon: 'none' });
      return;
    }

    setJoining(true);
    try {
      await request('/groups/join', 'POST', { inviteCode: trimmedCode });
      setInviteCode('');
      await refreshGroups();
      Taro.showToast({ title: '加入成功', icon: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '加入群组失败';
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setJoining(false);
    }
  }, [inviteCode, refreshGroups]);

  const openGroup = useCallback(
    (groupId) => {
      setCurrentGroupId(groupId);
      Taro.navigateTo({ url: '/pages/approval-list/index' });
    },
    [setCurrentGroupId],
  );

  return (
    <View className='groups-page'>
      <View className='hero-card'>
        <Text className='eyebrow'>决策工作台</Text>
        <Text className='hero-title'>你好，{nickname}</Text>
        <Text className='hero-subtitle'>在固定群组里发起购买审批、查看状态，并让每一次支出都有透明依据。</Text>
        <View className='hero-stats'>
          <View className='stat-chip'>
            <Text className='stat-value'>{groupCountText}</Text>
          </View>
          <View className='stat-chip'>
            <Text className='stat-value'>当前群组 {currentGroupId ? '已选择' : '未选择'}</Text>
          </View>
        </View>
      </View>

      <View className='panel'>
        <Text className='section-title'>创建新群组</Text>
        <Text className='section-description'>适合固定成员做预算类判断，例如“宿舍采购”“设备共买”或“家庭大件支出”。</Text>
        <Input
          className='text-input'
          maxlength={24}
          placeholder='输入群组名称，例如：宿舍采购组'
          value={groupName}
          onInput={(event) => setGroupName(event.detail.value)}
        />
        <Button className='primary-button' loading={creating} disabled={creating} onClick={handleCreateGroup}>
          创建群组
        </Button>
      </View>

      <View className='panel'>
        <Text className='section-title'>邀请码入组</Text>
        <Text className='section-description'>输入朋友分享的邀请码，加入现有决策群并同步可见审批。</Text>
        <Input
          className='text-input'
          maxlength={12}
          placeholder='输入 6-12 位邀请码'
          value={inviteCode}
          onInput={(event) => setInviteCode(event.detail.value.trim())}
        />
        <Button className='secondary-button' loading={joining} disabled={joining} onClick={handleJoinGroup}>
          加入群组
        </Button>
      </View>

      <View className='list-header'>
        <Text className='section-title'>我的群组</Text>
        <Button className='ghost-button' size='mini' loading={loading} disabled={loading} onClick={() => void refreshGroups()}>
          刷新
        </Button>
      </View>

      {groups.length > 0 ? (
        groups.map((membership) => {
          const group = membership.group || {};
          const isActive = group.id === currentGroupId;
          return (
            <View
              key={membership.id || group.id}
              className={`group-card${isActive ? ' group-card--active' : ''}`}
              hoverClass='group-card--hover'
              onClick={() => openGroup(group.id)}
            >
              <View className='group-card__main'>
                <View className='group-card__title-row'>
                  <Text className='group-card__title'>{group.name}</Text>
                  <Text className={`role-badge role-badge--${membership.role}`}>{ROLE_LABEL[membership.role] || '成员'}</Text>
                </View>
                <Text className='group-card__meta'>邀请码 {group.inviteCode}</Text>
                <Text className='group-card__meta'>{formatDate(membership.joinedAt)}</Text>
              </View>
              <Text className='group-card__action'>{isActive ? '查看审批' : '进入群组'}</Text>
            </View>
          );
        })
      ) : (
        <View className='empty-card'>
          <Text className='empty-title'>还没有可用群组</Text>
          <Text className='empty-description'>先创建一个决策群，或者用邀请码加入朋友的群组。</Text>
        </View>
      )}
    </View>
  );
}
