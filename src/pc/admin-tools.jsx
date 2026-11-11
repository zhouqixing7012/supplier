import React, { useEffect, useImperativeHandle, useState } from 'react';
import { Alert, App, Button, Card, DatePicker, Form, Input, Rate, Select, Space, Tabs, Upload } from 'antd-pc';
import { Download, Plus } from 'lucide-react';
import QueryBar, { QueryItem } from '../erp/QueryBar.jsx';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { PcModal, PcTable, StatusTag } from '../erp/components.jsx';
import { dimensionsFor, ratingTypes } from '../pages/mobile-workflows.jsx';

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
const columns = (fields) => fields.map(([dataIndex, title, width]) => ({ dataIndex, title, width }));
const options = (values) => values.map((value) => ({ value }));
const ratingColumns = columns([
  ['name', '供应商名称', 216], ['type', '合作类型', 112], ['content', '合作内容', 180],
  ['person', '业务线联系人', 128], ['department', '所属部门', 190], ['date', '合作时间', 120],
]);
const contains = (value, query) => !query || (value || '').includes(query.trim());

function RatingModal({ editing, suppliers, currentUser, onClose, onSave }) {
  const { row, readOnly } = editing;
  const [form] = Form.useForm();
  const { modal } = App.useApp();
  const type = Form.useWatch('type', form);
  const choices = suppliers.filter((supplier) => ['已审批', '变更中'].includes(supplier.status) && !supplier.blacklisted);
  const accept = (values) => {
    const supplier = choices.find((item) => item.id === values.supplierId);
    onSave({
      ...row, ...values, id: row?.id || crypto.randomUUID(), name: row?.name || supplier.name, person: row?.person || currentUser,
      department: row?.department || '', date: row?.date || today(), rated: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }),
      status: '已评分', score: '',
    });
  };
  const changeType = (next) => {
    if (next === type || !form.getFieldValue('dimensions')?.some(Boolean)) {
      form.setFieldsValue({ type: next, dimensions: [] });
      return;
    }
    modal.confirm({ title: '切换合作类型后需要重新填写评分项，是否继续？', centered: true, className: 'pc-confirm',
      onOk: () => form.setFieldsValue({ type: next, dimensions: [] }) });
  };
  return <PcModal open title={readOnly ? '评分详情' : row?.status === '已评分' ? '修改评分' : '评分'} width={640}
    onCancel={onClose} onOk={() => form.submit()} okText="提交" footer={readOnly ? <Button onClick={onClose}>关闭</Button> : undefined}>
    {readOnly ? <DetailGrid columns={1} labelWidth={180} className="pc-detail-grid">
      {ratingColumns.map(({ dataIndex, title }) => <DetailItem label={title} key={dataIndex}>{row[dataIndex] || '—'}</DetailItem>)}
      {dimensionsFor(row.type).map((label, index) => <DetailItem label={label} key={label}>{row.dimensions[index] ? row.dimensions[index] + ' / 5' : '—'}</DetailItem>)}
      <DetailItem label="评价">{row.comment || '—'}</DetailItem>
      <DetailItem label="评价得分">{row.score || '—'}</DetailItem>
      <DetailItem label="评分时间">{row.rated || '—'}</DetailItem>
    </DetailGrid> : <Form form={form} layout="vertical" initialValues={row} onFinish={accept}>
      {row ? <Form.Item label="供应商名称"><Input readOnly value={row.name} /></Form.Item> :
        <Form.Item name="supplierId" label="供应商名称" rules={[{ required: true, message: '请选择供应商' }]}>
          <Select showSearch optionFilterProp="label" options={choices.map(({ id, name }) => ({ value: id, label: name }))} />
        </Form.Item>}
      <Form.Item label="合作类型" required>
        <Form.Item name="type" noStyle rules={[{ required: true, message: '请选择合作类型' }]} getValueFromEvent={() => type}>
          <Select options={options(ratingTypes)} onChange={changeType} />
        </Form.Item>
      </Form.Item>
      <Form.Item name="content" label="合作事项" rules={[{ required: true, whitespace: true, message: '请输入合作事项' }]}><Input /></Form.Item>
      {type && dimensionsFor(type).map((label, index) => <Form.Item key={label} name={['dimensions', index]} label={label}
        rules={[{ type: 'number', required: true, min: 0.5, max: 5, message: '请选择 0.5 至 5 分' }]}><Rate allowHalf /></Form.Item>)}
      <Form.Item name="comment" label="评价"><Input.TextArea maxLength={500} rows={3} /></Form.Item>
    </Form>}
  </PcModal>;
}

export function RatingPage({ mode, records, suppliers, currentUser, onSave, exportRows }) {
  const mine = mode === 'my-ratings';
  const operations = mode === 'rating-operations';
  const [filter, setFilter] = useState({});
  const [applied, setApplied] = useState({});
  const [status, setStatus] = useState('全部');
  const [editing, setEditing] = useState(null);
  const change = (key, value) => setFilter((current) => ({ ...current, [key]: value }));
  const excluded = (applied.excluded || '').split(/[\n#]/).map((name) => name.trim()).filter(Boolean);
  const [start, end] = applied.created || [];
  const filtered = operations
    ? Boolean(start || end || excluded.length)
    : Boolean(applied.name?.trim() || applied.person?.trim() || applied.department?.trim() || applied.type);
  const rows = records.filter((row) => {
    if (operations) return row.contract && row.status === '未评分' && !row.approvalNumber &&
      !excluded.includes(row.person) && (!start || row.created.slice(0, 10) >= start.format('YYYY-MM-DD')) &&
      (!end || row.created.slice(0, 10) <= end.format('YYYY-MM-DD'));
    return (!mine || row.person === currentUser) && (status === '全部' || row.status === status) &&
      contains(row.name, applied.name) && contains(row.person, applied.person) && contains(row.department, applied.department) &&
      (!applied.type || row.type === applied.type);
  });
  if (operations) rows.sort((a, b) => b.created.localeCompare(a.created));
  const operationColumns = [...columns([['id', '主键', 185]]), ...ratingColumns, ...columns([['created', '创建时间', 170]])];
  const tableColumns = operations ? operationColumns : [
    ...ratingColumns, ...columns([['rated', '评分时间', 170], ['score', '评价得分', 105]]),
    { title: '评分状态', dataIndex: 'status', width: 105, render: (value) => <StatusTag value={value} /> },
    { title: '操作', width: 155, fixed: 'right', render: (_, row) => <Space size={4}>
      {row.status === '未评分' ? <Button size="small" type="link" onClick={() => setEditing({ row })}>评分</Button> :
        <><Button size="small" type="link" onClick={() => setEditing({ row, readOnly: true })}>评分详情</Button>
          {mine && <Button size="small" type="link" onClick={() => setEditing({ row })}>修改评分</Button>}</>}
    </Space> },
  ];
  return <div className="pc-page-stack">
    <QueryBar onQuery={() => setApplied(filter)} onReset={() => { setApplied({}); setFilter({}); }}>
      {operations ? <>
        <QueryItem label="创建时间"><DatePicker.RangePicker value={filter.created} allowEmpty={[true, true]} onChange={(value) => change('created', value)} /></QueryItem>
        <QueryItem label="排除评分人"><Input.TextArea rows={2} value={filter.excluded || ''} placeholder="逐行输入姓名，或用 # 分隔" onChange={(event) => change('excluded', event.target.value)} /></QueryItem>
      </> : <>
        {columns([['name', '供应商名称'], ['person', '业务线联系人'], ['department', '所属部门']]).filter(({ dataIndex }) => !mine || dataIndex === 'name')
          .map(({ dataIndex, title }) => <QueryItem key={dataIndex} label={title}><Input allowClear value={filter[dataIndex] || ''} onChange={(event) => change(dataIndex, event.target.value)} /></QueryItem>)}
        <QueryItem label="合作类型"><Select allowClear options={options(ratingTypes)} value={filter.type} onChange={(value) => change('type', value)} /></QueryItem>
      </>}
    </QueryBar>
    <Card size="small" extra={operations ? <Space>
      <Button icon={<Download size={14} />} disabled={!rows.length} onClick={() => exportRows(rows.slice(0, 1000), operationColumns, '评分查询-演示数据.csv')}>导出</Button>
      <Button disabled title="批量发起评分服务待接入">批量发起评分</Button>
    </Space> : !mine && <Button type="primary" icon={<Plus size={14} />} onClick={() => setEditing({})}>新增评分</Button>}>
      {mine && <Tabs activeKey={status} onChange={setStatus} items={['全部', '未评分', '已评分'].map((key) => ({ key, label: key }))} />}
      <PcTable rowKey="id" dataSource={rows} columns={tableColumns} scroll={{ x: 'max-content' }} filtered={filtered} />
    </Card>
    {editing && <RatingModal editing={editing} suppliers={suppliers} currentUser={currentUser} onClose={() => setEditing(null)}
      onSave={(row) => { onSave(row); setEditing(null); }} />}
  </div>;
}

export { BankApplicationPage } from './bank-application.jsx';

export function BlacklistPage({ suppliers, onOpen }) {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const rows = suppliers.flatMap((supplier) => (supplier.blacklistRecords || []).map((entry) => ({ ...entry, supplier })))
    .filter(({ supplier }) => contains(supplier.name, applied));
  return <div className="pc-page-stack">
    <QueryBar onQuery={() => setApplied(query)} onReset={() => { setApplied(''); setQuery(''); }}>
      <QueryItem label="供应商名称"><Input allowClear value={query} onChange={(event) => setQuery(event.target.value)} onPressEnter={() => setApplied(query)} /></QueryItem>
    </QueryBar>
    <Card size="small"><PcTable rowKey="id" dataSource={rows} scroll={{ x: 'max-content' }} filtered={Boolean(applied.trim())} columns={[
      { title: '供应商名称', width: 210, render: (_, row) => <Button type="link" size="small" onClick={() => onOpen(row.supplier)}>{row.supplier.name}</Button> },
      ...columns([['status', '操作状态', 110], ['applyUser', '拉黑操作人', 150], ['applyTime', '拉黑时间', 170], ['applyReason', '拉黑原因', 200],
        ['removeUser', '移除操作人', 150], ['removeTime', '移除时间', 170], ['removeReason', '移除原因', 200]]),
    ]} /></Card>
  </div>;
}

export function ManualSyncPage() {
  return <Card size="small"><Alert type="info" showIcon message="手动同步服务尚未接入" /></Card>;
}
