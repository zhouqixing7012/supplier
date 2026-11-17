import React, { useState } from 'react';
import {
  BatchActions, CardActions, Checkbox, Confirm, FullscreenPanel, OptionSheet, Overlay,
  RecordCard, RecordCollection, Row, Section, StatusBadge, Tabs,
} from './index.js';
import { FilterView, PricingLineEditor, QuoteRateField, RatingEditor, RatingWorkspace } from './supplier.js';
import { useBackLayer, useInteraction } from '../../pages/mobile-interaction.jsx';
import { canChangeSupplier, canDeleteSupplier, canSelectSupplierForBatch } from '../../pages/mobile-rules.js';

const ratingSupplier = {
  name: '示例技术服务供应商', type: '企业供应商', mode: '邀请注册',
  status: '已审批', inviter: '示例邀请人', date: '2026-11-14 10:30:00',
};
const ratingSamples = [
  { id: 'demo-unrated', name: ratingSupplier.name, type: '技术服务', content: '设备维护',
    person: '陈才慧', department: '', date: '2026-11-14', rated: '', dimensions: [], status: '未评分' },
  { id: 'demo-rated', name: ratingSupplier.name, type: '技术服务', content: '设备安装',
    person: '陈才慧', department: '', date: '2026-11-10', rated: '2026-11-15 14:00:00',
    dimensions: [4.5, 4, 3.5, 5, 4], score: '84', status: '已评分', comment: '按时完成安装' },
];

export function RatingExamples() {
  const [records, setRecords] = useState(ratingSamples);
  const [editor, setEditor] = useState(null);
  const [view, setView] = useState({});
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [message, setMessage] = useState('');
  const interaction = useInteraction();
  const close = () => interaction.request(() => { setEditor(null); setMessage(''); });
  const closeFilter = () => setFilterOpen(false);
  useBackLayer(Boolean(editor), close);
  useBackLayer(filterOpen, closeFilter);
  const save = record => {
    setRecords(current => current.map(item => item.id === record.id ? record : item));
    setEditor(null);
    setMessage('评分示例已保存');
  };
  return <>
    <RatingWorkspace mine records={records} filters={filters} savedView={view} onViewChange={setView}
      go={route => route.startsWith('rating-filter') ? setFilterOpen(true) : setFilters({})}
      onOpen={(record, readOnly) => { setMessage(''); setEditor({ record, readOnly }); }} />
    {message && !editor && <p className="m-catalog-note" role="status">{message}</p>}
    {filterOpen && <FullscreenPanel title="筛选评分" onBack={closeFilter}>
      <FilterView rating mine initial={filters} onApply={value => { setFilters(value); closeFilter(); }} />
    </FullscreenPanel>}
    {editor && <FullscreenPanel title={editor.readOnly ? '供应商评分详情' : '填写供应商评分'} onBack={close}>
      <RatingEditor record={editor.record} readOnly={editor.readOnly} supplier={ratingSupplier} onCancel={close}
        onSave={save} notify={setMessage} />
      {message && <p className="m-catalog-note" role="alert">{message}</p>}
    </FullscreenPanel>}
  </>;
}

const quoteExample = {
  material: '示例办公显示器', measure: '台', quantity: '2', category: '电子设备',
  config: '27 英寸', grossUnit: '', rate: '', attachment: '', note: '',
};
const taxExample = {
  material: 'DEMO-MATERIAL-001', name: '示例办公设备', category: '电子设备', quantity: '2',
  grossUnit: '113', gross: '226', rate: '', netUnit: '', tax: '', net: '',
};

export function ProcurementExamples() {
  const [tab, setTab] = useState(0);
  const [rate, setRate] = useState('');
  const [quoteLine, setQuoteLine] = useState(quoteExample);
  const [taxLine, setTaxLine] = useState(taxExample);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const quote = tab === 0;
  const line = quote ? quoteLine : taxLine;
  const close = () => { setEditing(false); setMessage(''); };
  const save = value => { (quote ? setQuoteLine : setTaxLine)(value); };
  return <>
    <Tabs items={['报价', '价税拆分']} active={tab} onChange={setTab} label="采购明细示例" showDirectory={false} stretch />
    {quote && <Section title="询价资料" className="m-quote-info" collapsible={false}>
      <Row label="采购单位">示例采购公司</Row>
      <QuoteRateField value={rate} onChange={value => { setRate(value); setQuoteLine(current => ({ ...current, rate: value })); }} />
    </Section>}
    <Section title={quote ? quoteLine.material : taxLine.name} collapsible={false}>
      <Row label="含税单价">{line.grossUnit || '—'}</Row>
      <Row label="税率（%）">{line.rate || '—'}</Row>
      {!quote && <>
        <Row label="不含税金额">{taxLine.net || '—'}</Row>
        <Row label="税额">{taxLine.tax || '—'}</Row>
      </>}
      <CardActions><button type="button" onClick={() => setEditing(true)}>编辑</button></CardActions>
    </Section>
    {editing && <PricingLineEditor line={line} index={0} quote={quote} onSave={save} onCancel={close} notify={setMessage}>
      {message && <p className="m-catalog-note" role="alert">{message}</p>}
    </PricingLineEditor>}
  </>;
}

const sampleInviter = '示例邀请人';
const batchSamples = [
  { id: 'draft', name: '示例草稿供应商', status: '草稿', tone: 'neutral', inviter: sampleInviter, date: '' },
  { id: 'invited', name: '示例受邀供应商', status: '邀请中', tone: 'info', inviter: sampleInviter, date: '2026-11-16 10:00:00' },
  { id: 'approved', name: '示例已审批供应商', status: '已审批', tone: 'success', inviter: sampleInviter, date: '2026-11-10 15:10:00' },
  { id: 'review', name: '示例审批中供应商', status: '审批中', tone: 'warning', inviter: sampleInviter, date: '2026-11-12 09:30:00' },
];
const isSelectable = row => canSelectSupplierForBatch(row, true, sampleInviter);

export function BatchExamples() {
  const [records, setRecords] = useState(batchSamples);
  const [checked, setChecked] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');
  const visible = records.filter(row => row.inviter === sampleInviter);
  const selectable = visible.filter(isSelectable);
  const selection = selectable.filter(row => checked.includes(row.id));
  const close = () => setDialog(null);
  const request = (allowed, kind, error) => {
    setMessage('');
    setDialog(selection.length && selection.every(allowed) ? { kind } : { kind: 'error', error });
  };
  const finish = text => {
    setChecked([]);
    close();
    setMessage(text);
  };
  return <>
    <RecordCollection title="我的邀请示例" count={visible.length} emptyText="暂无示例供应商">
      {visible.map(row => <RecordCard key={row.id} title={row.name} status={<StatusBadge tone={row.tone}>{row.status}</StatusBadge>}>
        <Row label="邀请时间">{row.date || '—'}</Row>
        <Row label="批量选择"><Checkbox label={'选择' + row.name} checked={checked.includes(row.id)} disabled={!isSelectable(row)}
          onChange={enabled => setChecked(current => enabled ? [...current, row.id] : current.filter(id => id !== row.id))} /></Row>
      </RecordCard>)}
    </RecordCollection>
    {message && <p className="m-catalog-note" role="status">{message}</p>}
    <BatchActions className="m-batch-actions-mine" selectedCount={checked.length} selectableCount={selectable.length}
      onSelectAll={enabled => setChecked(enabled ? selectable.map(row => row.id) : [])}
      items={[
        { label: '删除', danger: true, onClick: () => request(row => canDeleteSupplier(row, true), 'delete', '所选记录包含不可删除的状态。') },
        { label: '批量变更邀请人', onClick: () => request(canChangeSupplier, 'inviter', '请选择已审批且未拉黑的供应商。') },
      ]} />
    {dialog?.kind === 'error' && <Overlay label="批量操作校验" onClose={close}>
      <h2>批量操作校验</h2><p>{dialog.error}</p>
      <div className="m-dialog-actions"><button type="button" onClick={close}>知道了</button></div>
    </Overlay>}
    {dialog?.kind === 'delete' && <Confirm danger text="确认删除所选示例供应商？" onCancel={close}
      onConfirm={() => {
        setRecords(current => current.filter(row => !checked.includes(row.id)));
        finish('已删除所选示例供应商');
      }} />}
    {dialog?.kind === 'inviter' && <OptionSheet title="选择新邀请人" options={['示例新邀请人']}
      mode="confirm" clearable={false} onClose={close} onChange={inviter => {
        setRecords(current => current.map(row => checked.includes(row.id) ? { ...row, inviter } : row));
        finish('示例邀请人已更新为' + inviter);
      }} />}
  </>;
}
