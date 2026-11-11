import React, { useImperativeHandle, useRef, useState } from 'react';
import { App, Button, Card, DatePicker, Form, Input, Rate, Select, Space, Tabs } from 'antd-pc';
import QueryBar, { QueryItem } from '../erp/QueryBar.jsx';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { EmptyContent, PcTable, StatusTag } from '../erp/components.jsx';
import { canRateSupplier } from '../pages/mobile-rules.js';
import { dimensionsFor, ratingTypes } from '../pages/mobile-workflows.jsx';

const cooperationFields = [
  ['name', '供应商名称', 216],
  ['type', '合作类型', 112],
  ['content', '合作内容', 180],
  ['person', '业务线联系人', 128],
  ['department', '所属部门', 190],
  ['date', '合作时间', 120],
];
const statuses = ['全部', '未评分', '已评分'];
const typeOptions = ratingTypes.map((value) => ({ value }));
const ratingTime = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
const display = (value) => value === undefined || value === null || value === '' ? '—' : value;
const contains = (value, term) => (value || '').toLowerCase().includes(term);
const validDimension = (value) => Number.isFinite(value) && value >= 0.5 && value <= 5 && Number.isInteger(value * 2);

export function supplierForRating(record, suppliers) {
  return record.supplierId
    ? suppliers.find((supplier) => supplier.id === record.supplierId)
    : suppliers.find((supplier) => supplier.name === record.name);
}

export function PcRatingEditor({ record, supplier, currentUser, readOnly = false, requireEligibleSupplier = false, onBack, onSave, leaveRef }) {
  const { message, modal } = App.useApp();
  const [initial] = useState(() => ({
    type: record?.type || undefined,
    content: record?.content || '',
    dimensions: record?.dimensions || [],
    comment: record?.comment || '',
  }));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const labels = ratingTypes.includes(draft.type) ? dimensionsFor(draft.type) : [];
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const leave = (action) => {
    if (submitting.current) return;
    if (readOnly || !dirty) {
      action();
      return;
    }
    modal.confirm({
      title: '放弃本次评分填写？', content: '离开后，本次未提交的修改将丢失。',
      centered: true, className: 'pc-confirm', okText: '放弃修改', cancelText: '继续填写', onOk: action,
    });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));

  const setField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const changeType = (type) => {
    if (type === draft.type) return;
    const apply = () => {
      setDraft((current) => ({ ...current, type, dimensions: [] }));
      setErrors((current) => ({ ...current, type: undefined, dimensions: undefined }));
    };
    if (draft.dimensions.some(Boolean)) {
      modal.confirm({
        title: '切换合作类型后需要重新填写评分项，是否继续？',
        centered: true, className: 'pc-confirm', okText: '继续', cancelText: '取消', onOk: apply,
      });
    } else apply();
  };

  const changeDimension = (index, value) => {
    const dimensions = labels.map((_, position) => position === index ? value : draft.dimensions[position] || 0);
    setDraft((current) => ({ ...current, dimensions }));
    if (dimensions.every(validDimension)) setErrors((current) => ({ ...current, dimensions: undefined }));
  };

  const submit = async () => {
    if (submitting.current || readOnly) return;
    const nextErrors = {};
    if (!labels.length) nextErrors.type = '请选择合作类型';
    if (!draft.content.trim()) nextErrors.content = '请输入合作事项';
    if (labels.length && labels.some((_, index) => !validDimension(draft.dimensions[index]))) {
      nextErrors.dimensions = '请完成全部评分项';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (requireEligibleSupplier && (!supplier || !canRateSupplier(supplier))) {
      message.warning('当前供应商状态不支持评分');
      return;
    }
    submitting.current = true;
    setSaving(true);
    try {
      await onSave({
        ...record,
        ...draft,
        id: record?.id || crypto.randomUUID(),
        supplierId: record?.supplierId || supplier?.id,
        name: record?.name || supplier?.name || '',
        person: record?.person || currentUser,
        status: '已评分',
        rated: ratingTime(),
        // 原型保存各项实际分值，评价得分由正式规则计算。
        score: '',
      });
    } catch {
      message.error('评分提交失败，请重试。');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return <div className="pc-page-stack">
    <Card size="small" title="供应商信息">
      <DetailGrid labelWidth={116}>
        <DetailItem label="供应商名称">{display(record?.name || supplier?.name)}</DetailItem>
        <DetailItem label="供应商类型">{display(supplier?.type)}</DetailItem>
        <DetailItem label="供应商状态">{supplier ? <StatusTag value={supplier.status} /> : '—'}</DetailItem>
        <DetailItem label="注册方式">{display(supplier?.mode)}</DetailItem>
        <DetailItem label="邀请人">{display(supplier?.inviter)}</DetailItem>
        <DetailItem label="邀请时间">{display(supplier?.date)}</DetailItem>
      </DetailGrid>
    </Card>
    {record && <Card size="small" title="合作记录">
      <DetailGrid labelWidth={116}>
        <DetailItem label="业务线联系人">{display(record.person)}</DetailItem>
        <DetailItem label="所属部门">{display(record.department)}</DetailItem>
        <DetailItem label="合作时间">{display(record.date)}</DetailItem>
      </DetailGrid>
    </Card>}
    <Card size="small" title="评分信息">
      {readOnly ? <DetailGrid columns={2} labelWidth={188}>
        <DetailItem label="合作类型">{display(record?.type)}</DetailItem>
        <DetailItem label="合作事项">{display(record?.content)}</DetailItem>
        {labels.map((label, index) => <DetailItem label={label} key={label}>
          {validDimension(draft.dimensions[index]) ? draft.dimensions[index] + ' / 5' : '—'}
        </DetailItem>)}
        <DetailItem label="评价得分">{display(record?.score)}</DetailItem>
        <DetailItem label="评分时间">{display(record?.rated)}</DetailItem>
        <DetailItem label="评价" span={2}>{display(record?.comment)}</DetailItem>
      </DetailGrid> : <Form id="pc-rating-editor" layout="vertical" disabled={saving} onFinish={submit}>
        <Form.Item label="合作类型" htmlFor="pc-rating-type" required validateStatus={errors.type ? 'error' : undefined} help={errors.type}>
          <Select id="pc-rating-type" placeholder="请选择合作类型" value={draft.type} options={typeOptions} onChange={changeType} />
        </Form.Item>
        <Form.Item label="合作事项" htmlFor="pc-rating-content" required validateStatus={errors.content ? 'error' : undefined} help={errors.content}>
          <Input id="pc-rating-content" value={draft.content} onChange={(event) => setField('content', event.target.value)} />
        </Form.Item>
        {labels.map((label, index) => {
          const invalid = errors.dimensions && !validDimension(draft.dimensions[index]);
          return <Form.Item label={label} key={label} required validateStatus={invalid ? 'error' : undefined}>
            <Space>
              <Rate allowHalf allowClear={false} disabled={saving} aria-label={label} aria-invalid={!!invalid}
                value={draft.dimensions[index] || 0} onChange={(value) => changeDimension(index, value)} />
              <span aria-live="polite">{draft.dimensions[index] ? draft.dimensions[index] + ' / 5' : '未评分'}</span>
            </Space>
          </Form.Item>;
        })}
        {errors.dimensions && <Form.Item validateStatus="error" help={errors.dimensions}><span /></Form.Item>}
        <Form.Item label="评价" htmlFor="pc-rating-comment">
          <Input.TextArea id="pc-rating-comment" maxLength={500} showCount rows={3} value={draft.comment}
            onChange={(event) => setField('comment', event.target.value)} />
        </Form.Item>
      </Form>}
    </Card>
    <div className="pc-register-actions">
      <Button disabled={saving} onClick={() => leave(onBack)}>返回</Button>
      {!readOnly && <Button type="primary" form="pc-rating-editor" htmlType="submit" loading={saving}>提交</Button>}
    </div>
  </div>;
}

export function MyRatingsWorkspace({ records, suppliers, currentUser, onSave, leaveRef, editing, onOpen, onBack, view, onViewChange }) {
  const { filter = {}, applied = {}, status = '全部', page = 1, pageSize = 10 } = view || {};
  const setView = (patch) => onViewChange({ ...view, ...patch });
  const change = (key, value) => setView({ filter: { ...filter, [key]: value } });
  const ownRecords = records.filter((record) => record.person === currentUser);

  if (editing) {
    const record = ownRecords.find((item) => item.id === editing.recordId);
    if (!record || (editing.readOnly && record.status !== '已评分')) {
      return <Card size="small"><EmptyContent description="未找到该评分记录" /><Button onClick={onBack}>返回评分列表</Button></Card>;
    }
    return <PcRatingEditor key={record.id + (editing.readOnly ? '-detail' : '-edit')} record={record}
      supplier={supplierForRating(record, suppliers)} currentUser={currentUser} readOnly={editing.readOnly} onBack={onBack}
      onSave={onSave} leaveRef={leaveRef} />;
  }

  const keyword = applied.keyword?.trim().toLowerCase() || '';
  const person = applied.person?.trim().toLowerCase() || '';
  const department = applied.department?.trim().toLowerCase() || '';
  const start = applied.rated?.[0]?.format('YYYY-MM-DD');
  const end = applied.rated?.[1]?.format('YYYY-MM-DD');
  const filtered = Boolean(keyword || person || department || applied.type || start || end || status !== '全部');
  const rows = ownRecords.filter((record) => {
    const rated = record.rated?.slice(0, 10) || '';
    return (status === '全部' || record.status === status)
      && (!keyword || [record.name, record.content, record.person].some((value) => contains(value, keyword)))
      && contains(record.person, person) && contains(record.department, department)
      && (!applied.type || record.type === applied.type)
      && (!start || (rated && rated >= start)) && (!end || (rated && rated <= end));
  });
  const tableColumns = [
    ...cooperationFields.map(([dataIndex, title, width]) => ({ dataIndex, title, width, render: display })),
    { title: '评分时间', dataIndex: 'rated', width: 170, render: (value, record) => record.status === '已评分' ? display(value) : '—' },
    { title: '评价得分', dataIndex: 'score', width: 105, render: (value, record) => record.status === '已评分' ? display(value) : '—' },
    { title: '操作', width: 155, fixed: 'right', render: (_, row) => row.status === '未评分'
      ? <Button size="small" type="link" onClick={() => onOpen(row, false)}>评分</Button>
      : row.status === '已评分' && <Space size={4}>
        <Button size="small" type="link" onClick={() => onOpen(row, true)}>评分详情</Button>
        <Button size="small" type="link" onClick={() => onOpen(row, false)}>修改评分</Button>
      </Space> },
  ];
  const query = () => setView({ applied: filter, page: 1 });
  return <div className="pc-page-stack">
    <QueryBar onQuery={query} onReset={() => setView({ filter: {}, applied: {}, page: 1 })}>
      <QueryItem label="搜索"><Input allowClear placeholder="搜索供应商或合作内容" value={filter.keyword || ''}
        onChange={(event) => change('keyword', event.target.value)} onPressEnter={query} /></QueryItem>
      <QueryItem label="合作类型"><Select allowClear options={typeOptions} value={filter.type}
        onChange={(value) => change('type', value)} /></QueryItem>
      <QueryItem label="业务线联系人"><Input allowClear placeholder="请输入业务线联系人" value={filter.person || ''}
        onChange={(event) => change('person', event.target.value)} onPressEnter={query} /></QueryItem>
      <QueryItem label="所属部门"><Input allowClear placeholder="请输入所属部门" value={filter.department || ''}
        onChange={(event) => change('department', event.target.value)} onPressEnter={query} /></QueryItem>
      <QueryItem label="评分时间"><DatePicker.RangePicker value={filter.rated} allowEmpty={[true, true]} format="YYYY-MM-DD"
        onChange={(value) => change('rated', value)} /></QueryItem>
    </QueryBar>
    <Card size="small">
      <Tabs activeKey={status} onChange={(value) => setView({ status: value, page: 1 })}
        items={statuses.map((key) => ({ key, label: key }))} />
      <PcTable rowKey="id" columns={tableColumns} dataSource={rows} scroll={{ x: 'max-content' }}
        pagination={{ current: Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize))), pageSize, showSizeChanger: true,
          onChange: (nextPage, nextSize) => setView({ page: nextPage, pageSize: nextSize }) }}
        locale={filtered ? { emptyText: <EmptyContent description="未查询到符合条件的评分记录" /> } : undefined} />
    </Card>
  </div>;
}
