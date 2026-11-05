import React, { useState } from 'react';
import { Actions, CardActions, FilterSummary, Empty, FilterField, FilterButton, Header, Row, SearchBox, Section, StatusTag } from './mobile-ui.jsx';
import { runMotion } from './mobile-motion.jsx';
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
  useBackLayer(open, () => runMotion(() => setOpen(false), 'back'));
  const labels = { company: quote ? '采购单位' : '采购公司', type: '采购类型', start: '开始时间', end: '结束时间' };
  const conditions = Object.entries(filters).filter(([, value]) => !!value?.trim());
  const all = quote ? inquiries : orders;
  const records = all.filter(record => (record.status === '已处理') === handled && matchesPortalTask(record, query, filters));
  store.portalTaskViews = { ...store.portalTaskViews, [tab]: { query, filters } };
  const begin = () => { setDraft({ ...filters }); setErrors({}); runMotion(() => setOpen(true), 'forward'); };
  const change = (key, value) => { setDraft(old => ({ ...old, [key]: value })); setErrors({}); };
  const apply = () => {
    if (draft.start && draft.end && draft.start > draft.end) return setErrors({ end: '结束时间不能早于开始时间' });
    setFilters({ ...draft }); runMotion(() => setOpen(false), 'back');
  };
  const filtered = !!query.trim() || !!conditions.length;
  return <>
    <SearchBox placeholder={quote ? '搜索询价单号' : '搜索订单编号'} value={query} onChange={setQuery}><FilterButton label={quote ? '筛选报价' : '筛选价税拆分'} onClick={begin} /></SearchBox>
    <FilterSummary entries={conditions.map(([key, value]) => [labels[key], value])} count={records.length} onEdit={begin} onClear={() => setFilters({})} label="当前任务查询条件" />
    {records.length ? records.map(item => <Section key={item.number} collapsible={false} className="m-portal-task-card">
      <div className="m-record-heading"><h3>{quote ? item.title : item.number}</h3><StatusTag value={quote ? item.inquiryStatus : item.status} /></div>
      {quote && <p className="m-portal-record-number" aria-label="询价单号">{item.number}</p>}
      {(quote ? [['采购单位', item.unit], ['采购类型', item.type], ['剩余时间', remainingTime(item)], ['创建时间', item.created], ['结束时间', item.end]] : [['采购公司', item.unit], ['采购类型', item.type], ['金额', item.gross], ['创建时间', item.created]]).map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}
      <CardActions><button onClick={() => go((quote ? 'workspace-quote-detail' : 'workspace-tax-' + (handled ? 'detail' : 'split')) + '?record=' + item.number)}>{handled ? '查看' : quote ? '报价' : '价税拆分'}</button></CardActions>
    </Section>) : <Empty search={filtered} text={!quote && handled && !filtered ? '暂无已处理的价税拆分记录' : quote ? '暂无匹配的询价单' : '暂无匹配的订单'} />}

    {open && <div className="m-fullscreen-panel m-portal-task-filter" role="dialog" aria-modal="true" aria-label={quote ? '筛选报价' : '筛选价税拆分'}><Header title={quote ? '筛选报价' : '筛选价税拆分'} onBack={() => runMotion(() => setOpen(false), 'back')} /><div className="m-filter-view">
      <FilterField label={labels.company} value={draft.company || ''} onChange={value => change('company', value)} />
      <FilterField label="采购类型" options={purchaseTypes} value={draft.type || ''} onChange={value => change('type', value)} />
      <FilterField label="开始时间" type="date" layout="inline" allowClearDate value={draft.start || ''} onChange={value => change('start', value)} help="筛选创建时间不早于所选日期的单据" />
      <FilterField label="结束时间" type="date" layout="inline" allowClearDate value={draft.end || ''} error={errors.end} onChange={value => change('end', value)} help="筛选结束时间不晚于所选日期的单据，包含所选日期当天" />
      <Actions flat items={[{ label: '重置', muted: true, onClick: () => { setDraft({}); setErrors({}); } }, { label: '应用筛选', onClick: apply }]} />
    </div></div>}
  </>;
}



