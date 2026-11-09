import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Actions, AttachmentLink, CardActions, Empty, Field, Header, Row, Section, StatusTag } from './mobile-ui.jsx';
import { MultiAttachmentField } from './mobile-portal-files.jsx';
import { useBackLayer, useDirtyForm } from './mobile-interaction.jsx';
import { runMotion } from './mobile-motion.jsx';
import { calculateTax, isDecimal, quoteError, remainingTime } from './mobile-portal-pricing.js';

const taxFields = [['material', '物料编码'], ['name', '物料名称'], ['category', '物料类别'], ['quantity', '数量'], ['grossUnit', '含税单价'], ['rate', '税率（%）'], ['netUnit', '不含税单价'], ['tax', '税额'], ['net', '不含税金额'], ['gross', '含税金额']];
const quoteFields = [['material', '物料名称'], ['measure', '单位'], ['quantity', '数量'], ['category', '物料类别'], ['config', '配置'], ['grossUnit', '含税单价'], ['rate', '税率（%）']];
const orderFields = [['number', '订单编号'], ['department', '采购部门'], ['buyer', '采购员'], ['phone', '联系方式'], ['unit', '采购单位'], ['type', '采购类型'], ['centralType', '统采类型'], ['supplier', '供应商'], ['contact', '联系人'], ['documentStatus', '单据状态'], ['contract', '框架合同'], ['contractName', '框架名称']];

function FileRow({ label, value, onPreview }) {
  const files = Array.isArray(value) ? value : value ? [value] : [];
  return <Row label={label}>{files.length ? <div className="m-pricing-file-list">{files.map((file, index) => <AttachmentLink key={String(file) + '-' + index} value={file} onPreview={onPreview} />)}</div> : '无'}</Row>;
}

function LineEditor({ line, index, quote, onCancel, onSave, notify, onPreview }) {
  const [draft, setDraft] = useState(() => structuredClone(line));
  const [calculationError, setCalculationError] = useState('');
  const guard = useDirtyForm(draft);
  const cancel = () => guard.leave(onCancel);
  useBackLayer(true, cancel);
  const change = (key, value) => {
    if (!quote && key === 'rate') {
      try { setDraft(calculateTax(draft, value)); setCalculationError(''); }
      catch { setDraft({ ...draft, rate: value, netUnit: '', net: '', tax: '' }); setCalculationError('请先填写有效的税率和含税金额'); }
    } else { setDraft({ ...draft, [key]: value }); setCalculationError(''); }
  };
  const save = () => {
    if (calculationError) return notify(calculationError);
    const error = quote ? quoteError([draft]).replace('第1项', `第${index + 1}项`) : taxFields.slice(5).find(([key]) => !isDecimal(draft[key]));
    if (error) return notify(typeof error === 'string' ? error : '请输入有效的' + error[1]);
    guard.accept(); onSave(draft);
  };
  return <div className="m-fullscreen-panel m-pricing-editor" role="dialog" aria-modal="true" aria-label={quote ? '编辑报价明细' : '编辑价税明细'}>
    <Header title={quote ? '编辑报价明细' : '编辑价税明细'} onBack={cancel} />
    <Section title={quote ? draft.material : draft.name} collapsible={false}>
      {(quote ? quoteFields.slice(1, 5) : taxFields.slice(0, 5).filter(([key]) => key !== 'name')).map(([key, label]) => <Row key={key} label={label}>{draft[key] || '—'}</Row>)}
    </Section>
    <Section title={quote ? '报价信息' : '价税信息'} collapsible={false}>
      {(quote ? quoteFields.slice(5) : taxFields.slice(5)).map(([key, label]) => <Field key={key} label={label} required inputMode="decimal" value={draft[key]} onChange={value => change(key, value)} />)}
      {calculationError && <p className="m-field-error" role="alert">{calculationError}</p>}
      {quote && <><MultiAttachmentField label="报价附件" value={draft.attachment} onChange={attachment => setDraft({ ...draft, attachment })} onPreview={onPreview} /><Field label="报价说明" multiline value={draft.note} onChange={note => setDraft({ ...draft, note })} /></>}
    </Section>
    <Actions items={[{ label: '取消', secondary: true, onClick: cancel }, { label: '确定', onClick: save }]} />
  </div>;
}

export function PortalPricingDetail({ quote, records, store, go, notify, onPreview, mapParams = {} }) {
  const number = new URLSearchParams(window.location.hash.split('?')[1]).get('record');
  const sample = mapParams.map
    ? records.find(item => (item.status === '已处理') === (Number(mapParams.tab) % 2 === 1))
    : null;
  const record = records.find(item => item.number === number) || sample || (!quote && !number ? records[0] : null);
  store.portalTaskTab ??= quote ? (record?.status === '已处理' ? 1 : 0) : (record?.status === '已处理' ? 3 : 2);
  const [draft, setDraft] = useState(() => structuredClone(record || {}));
  const [editor, setEditor] = useState(mapParams.panel === 'line' && record?.status === '待处理' && record.lines?.length ? 0 : null);
  const editable = !!record && record.status === '待处理';
  const guard = useDirtyForm(draft, editable);
  const back = () => guard.leave(() => go('workspace-tasks'));
  if (!record) return <><Empty text={quote ? '未找到询价单' : '未找到采购订单'} /><Actions items={[{ label: quote ? '返回报价列表' : '返回价税拆分列表', onClick: back }]} /></>;
  const changeRate = value => setDraft({ ...draft, rate: value, lines: draft.lines.map(line => ({ ...line, rate: value })) });
  const expired = quote && remainingTime(record) === '已过期';
  const submit = () => {
    if (expired) return notify('报价已截止，无法提交');
    if (quote) {
      const error = quoteError(draft.lines); if (error) return notify(error);
    } else {
      const invalid = draft.lines.findIndex(line => taxFields.slice(5).some(([key]) => !isDecimal(line[key])));
      if (invalid >= 0) return notify(`请填写第${invalid + 1}项完整、有效的价税信息`);
    }
    const next = { ...structuredClone(draft), status: '已处理', ...(quote ? { inquiryStatus: '定价完成' } : {}) };
    const key = quote ? 'portalInquiries' : 'portalOrders';
    store[key] = records.map(item => item.number === number || item === record ? next : item);
    guard.accept(); notify(quote ? '报价已提交' : '价税拆分已提交'); go('workspace-tasks');
  };
  return <div className="m-portal-pricing">
    {quote && <section className="m-portal-object-summary" aria-label={quote ? '询价摘要' : '采购订单摘要'}>
      <div className="m-record-heading"><h2>{quote ? draft.title : draft.number}</h2><StatusTag value={quote ? draft.inquiryStatus : draft.status} /></div>
      {quote && <p className="m-portal-record-number" aria-label="询价单号">{draft.number}</p>}
      {quote && editable && <p className="m-input-note m-quote-deadline">{expired ? '报价已截止' : '报价截止时间：' + draft.end + '，超时自动取消报价资格。'}</p>}
    </section>}
    {quote ? <Section title="询价资料" className="m-quote-info" collapsible={false}>
      {[['way', '询价类型'], ['buyer', '采购员'], ['unit', '采购单位'], ['type', '采购类型'], ['created', '创建时间'], ['end', '结束时间']].map(([key, label]) => <Row key={key} label={label}>{draft[key] || '—'}</Row>)}
      {editable ? <Field label="税率（%）" inputMode="decimal" value={draft.rate || ''} onChange={changeRate} /> : <Row label="税率（%）">{draft.rate || '—'}</Row>}
      <FileRow label="询价附件" value={draft.attachment} onPreview={onPreview} />
      <Row label="询价说明">{draft.remark || '—'}</Row>
    </Section> : <Section className="m-order-info-card" collapsible={false}>
      <div className="m-record-heading"><h2>{draft.number}</h2><StatusTag value={draft.status} /></div>
      {orderFields.filter(([key]) => key !== 'number').map(([key, label]) => <Row key={key} label={label}>{draft[key] || '—'}</Row>)}
    </Section>}
    {!quote && editable && <p className="m-pricing-warning" role="note">请您按照发票金额填写并检查，否则会影响后续付款！</p>}
    {draft.lines.map((line, index) => <Section key={index} title={`${index + 1}. ${quote ? line.material : line.name}`} collapsible={false}>
      {(quote ? quoteFields.slice(1) : taxFields.filter(([key]) => key !== 'name')).map(([key, label]) => <Row key={key} label={label}>{line[key] || '—'}</Row>)}
      {quote && <><FileRow label="报价附件" value={line.attachment} onPreview={onPreview} /><Row label="报价说明">{line.note || '—'}</Row></>}
      {editable && <CardActions><button aria-label={'编辑第' + (index + 1) + '项' + (quote ? '报价' : '价税')} onClick={() => runMotion(() => setEditor(index), 'forward')}><Pencil aria-hidden="true" /></button></CardActions>}
    </Section>)}
    <Actions items={[{ label: '返回列表', secondary: editable, onClick: back }, ...(editable ? [{ label: '提交', onClick: submit }] : [])]} />
    {editor !== null && <LineEditor key={editor} index={editor} quote={quote} line={draft.lines[editor]} notify={notify} onPreview={onPreview} onCancel={() => runMotion(() => setEditor(null), 'back')} onSave={line => { setDraft({ ...draft, lines: draft.lines.map((entry, index) => index === editor ? line : entry) }); runMotion(() => setEditor(null), 'back'); }} />}
  </div>;
}
