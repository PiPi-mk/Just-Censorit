import { Button, Input, Picker, Text, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';
import { useGroupStore } from '../../store/group';
import { request } from '../../utils/request';
import { submitApproval } from './submit-approval';
import './index.scss';

const RULE_OPTIONS = [
  { label: '多数通过', value: 'majority', hint: '赞成票大于反对票时通过，适合大多数采购。' },
  { label: '全员同意', value: 'unanimous', hint: '任何反对都会阻止通过，适合高敏感预算项。' },
  { label: '群主裁定', value: 'owner_decision', hint: '保留讨论过程，由群主做最终判断。' },
  { label: '仅供参考', value: 'reference_only', hint: '收集团队意见，但不自动给出通过结论。' },
];

function getDefaultDeadline() {
  return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
}

export default function ApprovalFormPage() {
  const currentGroupId = useGroupStore((state) => state.currentGroupId);
  const [form, setForm] = useState({
    title: '',
    productName: '',
    unitPrice: '',
    quantity: '1',
    reason: '',
    budgetImpact: '',
  });
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const selectedRule = RULE_OPTIONS[selectedRuleIndex] || RULE_OPTIONS[0];
  const totalPrice = useMemo(() => {
    const unitPrice = Number(form.unitPrice);
    const quantity = Number(form.quantity);
    if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) {
      return '0.00';
    }

    return (Math.max(0, unitPrice) * Math.max(0, quantity)).toFixed(2);
  }, [form.quantity, form.unitPrice]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = () => {
    if (!currentGroupId) {
      Taro.showToast({ title: '请先选择群组', icon: 'none' });
      return null;
    }

    const payload = {
      groupId: currentGroupId,
      title: form.title.trim(),
      productName: form.productName.trim(),
      unitPrice: Number(form.unitPrice),
      quantity: Number(form.quantity),
      reason: form.reason.trim(),
      budgetImpact: form.budgetImpact.trim(),
      ruleType: selectedRule.value,
      deadlineAt: getDefaultDeadline(),
    };

    if (!payload.title || !payload.productName || !payload.reason || !payload.budgetImpact) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' });
      return null;
    }

    if (!Number.isFinite(payload.unitPrice) || payload.unitPrice <= 0) {
      Taro.showToast({ title: '单价必须大于 0', icon: 'none' });
      return null;
    }

    if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
      Taro.showToast({ title: '数量必须为正整数', icon: 'none' });
      return null;
    }

    return payload;
  };

  const handleSubmit = async () => {
    const payload = validate();
    if (!payload) {
      return;
    }

    setSubmitting(true);
    try {
      await submitApproval(request, payload);
      Taro.showToast({ title: '提交成功', icon: 'success' });
      Taro.navigateBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交审批失败';
      Taro.showToast({ title: message, icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentGroupId) {
    return (
      <View className='approval-form-page'>
        <View className='empty-state'>
          <Text className='empty-state__title'>还没有选中群组</Text>
          <Text className='empty-state__description'>请先从群组页进入一个群组，再在该群上下文里发起审批。</Text>
          <Button className='primary-button' onClick={() => Taro.redirectTo({ url: '/pages/groups/index' })}>
            去选择群组
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className='approval-form-page'>
      <View className='hero-card'>
        <Text className='hero-card__eyebrow'>当前群组</Text>
        <Text className='hero-card__title'>准备发起一条新的购买审批</Text>
        <Text className='hero-card__description'>把目标、成本和预算影响说明白，能显著提高决策效率与共识质量。</Text>
      </View>

      <View className='panel'>
        <Text className='section-title'>审批信息</Text>
        <View className='field'>
          <Text className='field__label'>审批标题</Text>
          <Input className='text-input' maxlength={40} placeholder='例如：是否购买 27 寸显示器' value={form.title} onInput={(event) => updateField('title', event.detail.value)} />
        </View>
        <View className='field'>
          <Text className='field__label'>商品名称</Text>
          <Input className='text-input' maxlength={40} placeholder='填写要购买的商品或服务' value={form.productName} onInput={(event) => updateField('productName', event.detail.value)} />
        </View>
        <View className='field-row'>
          <View className='field field-row__item'>
            <Text className='field__label'>单价</Text>
            <Input className='text-input' type='digit' placeholder='0.00' value={form.unitPrice} onInput={(event) => updateField('unitPrice', event.detail.value)} />
          </View>
          <View className='field field-row__item'>
            <Text className='field__label'>数量</Text>
            <Input className='text-input' type='number' placeholder='1' value={form.quantity} onInput={(event) => updateField('quantity', event.detail.value)} />
          </View>
        </View>
        <View className='amount-card'>
          <Text className='amount-card__label'>预计总额</Text>
          <Text className='amount-card__value'>¥{totalPrice}</Text>
        </View>
      </View>

      <View className='panel'>
        <Text className='section-title'>决策依据</Text>
        <View className='field'>
          <Text className='field__label'>购买理由</Text>
          <Textarea className='textarea' maxlength={200} placeholder='说明痛点、使用场景或为什么现在要买' value={form.reason} onInput={(event) => updateField('reason', event.detail.value)} />
        </View>
        <View className='field'>
          <Text className='field__label'>预算影响</Text>
          <Textarea className='textarea' maxlength={200} placeholder='说明会占用哪部分预算、对本月计划有什么影响' value={form.budgetImpact} onInput={(event) => updateField('budgetImpact', event.detail.value)} />
        </View>
      </View>

      <View className='panel'>
        <Text className='section-title'>审批规则</Text>
        <Picker mode='selector' range={RULE_OPTIONS.map((item) => item.label)} value={selectedRuleIndex} onChange={(event) => setSelectedRuleIndex(Number(event.detail.value))}>
          <View className='picker-card'>
            <Text className='picker-card__label'>当前规则</Text>
            <Text className='picker-card__value'>{selectedRule.label}</Text>
            <Text className='picker-card__hint'>{selectedRule.hint}</Text>
          </View>
        </Picker>
      </View>

      <Button className='submit-button' loading={submitting} disabled={submitting} onClick={handleSubmit}>
        提交审批
      </Button>
    </View>
  );
}
