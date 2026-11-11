import React, { useImperativeHandle, useState } from 'react';
import { Alert, App, Button, Card, Input, Select, Space, Typography, Upload } from 'antd-pc';
import { Plus } from 'lucide-react';
import QueryBar, { QueryItem } from '../erp/QueryBar.jsx';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { EmptyContent, PcTable, StatusTag } from '../erp/components.jsx';
import { matchesPortalTask, purchaseTypes } from '../pages/mobile-portal-filters.js';
import { calculateTax, isDecimal, quoteError, remainingTime } from '../pages/mobile-portal-pricing.js';

const inquiryFields = [['number', '询价单号'], ['title', '询价标题'], ['way', '询价类型'], ['buyer', '采购员'], ['unit', '采购单位'], ['type', '采购类型'], ['created', '创建时间'], ['end', '结束时间']];
const orderFields = [['number', '订单编号'], ['department', '采购部门'], ['buyer', '采购员'], ['phone', '联系方式'], ['unit', '采购单位'], ['type', '采购类型'], ['centralType', '统采类型'], ['supplier', '供应商'], ['contact', '联系人'], ['documentStatus', '单据状态'], ['contract', '框架合同'], ['contractName', '框架名称']];
const quoteLines = [['material', '物料名称', 150], ['category', '物料类别', 160], ['measure', '单位', 64], ['quantity', '数量', 72], ['config', '配置', 200], ['grossUnit', '含税单价', 116], ['rate', '税率（%）', 106], ['attachment', '报价附件', 180], ['note', '报价说明', 170]];
const taxLines = [['material', '物料编码', 145], ['name', '物料名称', 150], ['category', '物料类别', 145], ['quantity', '数量', 72], ['grossUnit', '含税单价', 116], ['gross', '含税金额', 116], ['rate', '税率（%）', 106], ['netUnit', '不含税单价', 130], ['net', '不含税金额', 125], ['tax', '税额', 100]];
const fileList = (value) => (Array.isArray(value) ? value : value ? [value] : []).map((file, index) =>
  typeof file === 'string' ? { uid: 'existing-' + index, name: file } : file);

export function PortalTasks({ quote, records, status, view, setView, onOpen }) {
  const [query, setQuery] = useState(view.query || '');
  const [type, setType] = useState(view.type);
  const [company, setCompany] = useState(view.company || '');
  const [start, setStart] = useState(view.start || '');
  const [end, setEnd] = useState(view.end || '');
  const { message } = App.useApp();
  const apply = () => {
    if (start && end && start > end) return message.error('结束时间不能早于开始时间');
    setView({ query, type, company, start, end });
  };
  const rows = records.filter((record) => record.status === status && matchesPortalTask(record, view.query, view));
  const filtered = Boolean(view.query?.trim() || view.type || view.company?.trim() || view.start || view.end);
  const columns = [
    { title: quote ? '询价单号' : '订单编号', dataIndex: 'number', width: 168, render: (number) =>
      <Button type="link" size="small" onClick={() => onOpen(number)}>{number}</Button> },
    ...(quote ? [{ title: '询价标题', dataIndex: 'title', width: 210 }] : []),
    { title: '采购类型', dataIndex: 'type', width: 120 },
    { title: '采购单位', dataIndex: 'unit', width: 170 },
    ...(quote ? [{ title: '采购员', dataIndex: 'buyer', width: 100 }] : [{ title: '含税金额', dataIndex: 'gross', width: 112 }]),
    { title: '处理状态', dataIndex: 'status', width: 100, render: (value) => <StatusTag value={value} /> },
    { title: quote ? '结束时间' : '创建时间', dataIndex: quote ? 'end' : 'created', width: 170 },
    ...(status === '待处理' ? [{ title: '操作', key: 'action', align: 'center', fixed: 'right', width: 100, render: (_, row) =>
      <Button type="link" size="small" onClick={() => onOpen(row.number)}>{quote ? '报价' : '价税拆分'}</Button> }] : []),
  ];
  return <div className="pc-page-stack">
    <QueryBar onQuery={apply} onReset={() => { setQuery(''); setType(undefined); setCompany(''); setStart(''); setEnd(''); setView({}); }}>
      <QueryItem label={quote ? '询价单号' : '订单编号'}><Input allowClear value={query} onChange={(e) => setQuery(e.target.value)} onPressEnter={apply} /></QueryItem>
      <QueryItem label="采购类型"><Select allowClear value={type} options={purchaseTypes.map((value) => ({ value }))} onChange={setType} /></QueryItem>
      <QueryItem label={quote ? '采购单位' : '采购公司'}><Input allowClear value={company} onChange={(e) => setCompany(e.target.value)} onPressEnter={apply} /></QueryItem>
      <QueryItem label="开始时间"><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></QueryItem>
      <QueryItem label="结束时间"><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></QueryItem>
    </QueryBar>
    <Card size="small"><PcTable rowKey="number" dataSource={rows} columns={columns} scroll={{ x: 'max-content' }} filtered={filtered} /></Card>
  </div>;
}

export function PortalPricing({ quote, record, onBack, onSubmit, leaveRef }) {
  const [draft, setDraft] = useState(record);
  const { message, modal } = App.useApp();
  const leave = (afterLeave) => {
    if (draft === record) return afterLeave();
    modal.confirm({ centered: true, className: 'pc-confirm', title: '离开编辑？', content: '当前修改尚未提交。', okText: '放弃修改', cancelText: '继续编辑', onOk: afterLeave });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));
  if (!record) return <Card size="small"><EmptyContent description={quote ? '未找到询价单' : '未找到采购订单'} /><Button onClick={onBack}>返回列表</Button></Card>;
  const pending = record.status === '待处理';
  const expired = quote && remainingTime(record) === '已过期';
  const editable = pending && !expired;
  const setLine = (index, update) => setDraft((current) => ({ ...current, lines: current.lines.map((line, i) => i === index ? update(line) : line) }));
  const changeLine = (index, key, value) => setLine(index, (line) => {
    if (!quote && key === 'rate') return value === '' || isDecimal(value) ? calculateTax(line, value) : { ...line, rate: value, netUnit: '', net: '', tax: '' };
    return { ...line, [key]: value };
  });
  const back = () => leave(onBack);
  const submit = () => {
    if (!editable) return;
    const error = quote ? quoteError(draft.lines) : draft.lines.some((line) => ['rate', 'netUnit', 'net', 'tax'].some((key) => !isDecimal(line[key]))) && '请填写完整、有效的价税信息';
    if (error) return message.error(error);
    onSubmit({ ...draft, status: '已处理', ...(quote ? { inquiryStatus: '定价完成' } : {}) });
    message.success('演示记录已移入已处理');
  };
  const columns = (quote ? quoteLines : taxLines).map(([key, title, width]) => ({
    title, dataIndex: key, width, ellipsis: false,
    render: (value, _, index) => {
      if (key === 'attachment') {
        const files = fileList(value);
        return editable ? <Upload multiple beforeUpload={() => false} fileList={files}
          onChange={({ fileList: next }) => changeLine(index, key, next.map(({ uid, name }) => ({ uid, name })))}><Button size="small" icon={<Plus size={14} />}>添加附件</Button></Upload>
          : files.map((file) => file.name).join('、') || '—';
      }
      const editableKeys = quote ? ['grossUnit', 'rate', 'note'] : ['rate', 'netUnit', 'net', 'tax'];
      if (editable && editableKeys.includes(key)) return <Input aria-label={title + ' 第' + (index + 1) + '项'} value={value} inputMode={key === 'note' ? undefined : 'decimal'} onChange={(e) => changeLine(index, key, e.target.value)} />;
      return value || '—';
    },
  }));
  return <div className="pc-page-stack">
    <Card size="small" title={quote ? '询价资料' : '采购订单'} extra={<StatusTag value={quote ? record.inquiryStatus : record.status} />}>
      <DetailGrid>
        {(quote ? inquiryFields : orderFields).map(([key, label]) => <DetailItem key={key} label={label}>{draft[key] || '—'}</DetailItem>)}
        {quote && <DetailItem label="税率（%）">{editable ? <Input aria-label="询价资料税率" value={draft.rate} inputMode="decimal" onChange={(e) => {
          const rate = e.target.value;
          setDraft({ ...draft, rate, lines: draft.lines.map((line) => ({ ...line, rate })) });
        }} /> : draft.rate || '—'}</DetailItem>}
        {quote && <DetailItem label="询价附件">{fileList(draft.attachment).map((file) => file.name).join('、') || '—'}</DetailItem>}
        {quote && <DetailItem label="询价说明" span={3}>{draft.remark || '—'}</DetailItem>}
      </DetailGrid>
    </Card>
    <Card size="small" title={quote ? '报价明细' : '订单明细'}>
      {pending && quote && expired && <Alert type="warning" showIcon title="报价已截止" />}
      {!quote && editable && <Typography.Paragraph type="danger">请您按照发票金额填写并检查，否则会影响后续付款！</Typography.Paragraph>}
      <PcTable rowKey="rowId" pagination={false} scroll={{ x: 'max-content' }} dataSource={draft.lines.map((line, index) => ({ ...line, rowId: index }))} columns={columns} />
    </Card>
    <div className="pc-workflow-actions"><Space><Button onClick={back}>返回列表</Button>{editable && <Button type="primary" onClick={submit}>提交</Button>}</Space></div>
  </div>;
}
