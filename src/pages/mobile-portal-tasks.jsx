import React, { useState } from 'react';
import { Actions, Empty, Field, FilterButton, Header, Row, SearchBox, Section, StatusTag } from './mobile-ui.jsx';
import { useBackLayer } from './mobile-interaction.jsx';
import { remainingTime } from './mobile-portal-pricing.js';
import { matchesPortalTask, purchaseTypes } from './mobile-portal-filters.js';

export function PortalTaskList({ tab, inquiries, orders, store, go }) {
  const quote = tab < 2;
  const handled = tab % 2 === 1;
  const saved = store.portalTaskViews?.[tab] || {};
  const [query, setQuery] = useState(saved.query || '');
  const [filters, setFilters] = useState(saved.filters || {});
  const [draft, setDraft] = useState({});
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  useBackLayer(open, () => setOpen(false));
  const labels = { company: quote ? '采购单位' : '采购公司', type: '采购类型', start: '开始时间', end: '结束时间' };
  const conditions = Object.entries(filters).filter(([, value]) => !!value?.trim());
  const all = quote ? inquiries : orders;
  const records = all.filter(record => (record.status === '已处理') === handled && matchesPortalTask(record, query, filters));
  store.portalTaskViews = { ...store.portalTaskViews, [tab]: { query, filters } };
  const begin = () => { setDraft({ ...filters }); setErrors({}); setOpen(true); };
  const change = (key, value) => { setDraft(old => ({ ...old, [key]: value })); setErrors({}); };
  const apply = () => {
    if (draft.start && draft.end && draft.start > draft.end) return setErrors({ end: '结束时间不能早于开始时间' });
    setFilters({ ...draft }); setOpen(false);
  };
  const filtered = !!query.trim() || !!conditions.length;
  return <>
    <SearchBox placeholder={quote ? '搜索询价单号' : '搜索订单编号'} value={query} onChange={setQuery}><FilterButton label={quote ? '筛选报价' : '筛选价税拆分'} onClick={begin} /></SearchBox>
    <section className="m-applied-filters" aria-label="当前任务查询条件"><div className="m-filter-summary">{conditions.length > 0 && <button onClick={begin}>已筛选 · {conditions.length}项</button>}<span role="status">共 {records.length} 条</span>{conditions.length > 0 && <button onClick={() => setFilters({})}>清除筛选</button>}</div>{conditions.length > 0 && <dl className="m-applied-conditions">{conditions.map(([key, value]) => <div key={key}><dt>{labels[key]}</dt><dd>{value}</dd></div>)}</dl>}</section>
    {records.length ? records.map(item => quote ? <Section key={item.number} collapsible={false} title={item.title}><div className="m-record-heading"><h3>{item.number}</h3><StatusTag value={item.inquiryStatus} /></div>{[['采购单位', item.unit], ['采购类型', item.type], ['剩余时间', remainingTime(item)], ['创建时间', item.created], ['结束时间', item.end]].map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}<div className="m-record-actions"><button onClick={() => go('workspace-quote-detail?record=' + item.number)}>{handled ? '查看' : '报价'}</button></div></Section> : <Section key={item.number} collapsible={false} title={item.number}><div className="m-record-heading"><h3>采购订单</h3><StatusTag value={item.status} /></div><Row label="采购公司">{item.unit}</Row><Row label="采购类型">{item.type}</Row><Row label="金额">{item.gross}</Row><Row label="创建时间">{item.created}</Row><div className="m-record-actions"><button onClick={() => go('workspace-tax-' + (handled ? 'detail' : 'split') + '?record=' + item.number)}>{handled ? '查看' : '价税拆分'}</button></div></Section>) : <Empty search={filtered} text={!quote && handled && !filtered ? '暂无已处理的价税拆分记录' : quote ? '暂无匹配的询价单' : '暂无匹配的订单'} />}
    {open && <div className="m-fullscreen-panel m-portal-task-filter" role="dialog" aria-modal="true" aria-label={quote ? '筛选报价' : '筛选价税拆分'}><Header title={quote ? '筛选报价' : '筛选价税拆分'} onBack={() => setOpen(false)} /><div className="m-filter-view">
      <Field label={labels.company} value={draft.company || ''} onChange={value => change('company', value)} />
      <Field label="采购类型" options={purchaseTypes} value={draft.type || ''} onChange={value => change('type', value)} />
      <Field label="开始时间" type="date" layout="inline" allowClearDate value={draft.start || ''} onChange={value => change('start', value)} help="筛选创建时间不早于所选日期的单据" />
      <Field label="结束时间" type="date" layout="inline" allowClearDate value={draft.end || ''} error={errors.end} onChange={value => change('end', value)} help="筛选结束时间不晚于所选日期的单据，包含所选日期当天" />
      <Actions flat items={[{ label: '取消', muted: true, onClick: () => setOpen(false) }, { label: '重置', muted: true, onClick: () => { setDraft({}); setErrors({}); } }, { label: '应用筛选', onClick: apply }]} />
    </div></div>}
  </>;
}
