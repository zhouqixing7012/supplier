import React, { useState } from 'react';
import { Actions, CardActions, DateRange, FilterSummary, Empty, FilterButton, FullscreenPanel, Row, Section } from '../components/mobile/index.js';
import { FilterField, SearchBox, StatusTag } from './mobile-ui.jsx';
import { runMotion } from './mobile-motion.jsx';
import { useBackLayer } from './mobile-interaction.jsx';
import { remainingTime } from './mobile-portal-pricing.js';
import { matchesPortalTask, purchaseTypes } from './mobile-portal-filters.js';

export function PortalTaskList({ tab, inquiries, orders, store, go, initialFilterOpen = false }) {
  const quote = tab < 2;
  const handled = tab % 2 === 1;
  const saved = store.portalTaskViews?.[tab] || {};
  const [query, setQuery] = useState(saved.query || '');
  const [filters, setFilters] = useState(saved.filters || {});
  const [draft, setDraft] = useState(initialFilterOpen ? filters : {});
  const [open, setOpen] = useState(initialFilterOpen);
  const [dateError, setDateError] = useState('');
  useBackLayer(open, () => runMotion(() => setOpen(false), 'back'));
  const companyLabel = quote ? '采购单位' : '采购公司';
  const all = quote ? inquiries : orders;
  const records = all.filter(record => (record.status === '已处理') === handled && matchesPortalTask(record, query, filters));
  store.portalTaskViews = { ...store.portalTaskViews, [tab]: { query, filters } };
  const begin = () => { setDraft({ ...filters }); setDateError(''); runMotion(() => setOpen(true), 'forward'); };
  const change = (key, value) => setDraft(old => ({ ...old, [key]: value }));
  const apply = () => {
    if (draft.start && draft.end && draft.start > draft.end) return setDateError('结束日期不能早于开始日期');
    setFilters({ ...draft }); runMotion(() => setOpen(false), 'back');
  };
  const filtered = !!query.trim() || Object.values(filters).some(value => value?.trim());
  return <>
    <SearchBox placeholder={quote ? '搜索询价单号' : '搜索订单编号'} value={query} onChange={setQuery}><FilterButton label={quote ? '筛选报价' : '筛选价税拆分'} onClick={begin} /></SearchBox>
    <FilterSummary count={records.length} label="查询结果" />
    {records.length ? records.map(item => <Section key={item.number} collapsible={false} className="m-portal-task-card">
      <div className="m-record-heading"><h3>{quote ? item.title : item.number}</h3><StatusTag value={quote ? item.inquiryStatus : item.status} /></div>
      {quote && <p className="m-portal-record-number" aria-label="询价单号">{item.number}</p>}
      {(quote ? [['采购单位', item.unit], ['采购类型', item.type], ['剩余时间', remainingTime(item)], ['创建时间', item.created], ['结束时间', item.end]] : [['采购公司', item.unit], ['采购类型', item.type], ['金额', item.gross], ['创建时间', item.created]]).map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}
      <CardActions><button onClick={() => go((quote ? 'workspace-quote-detail' : 'workspace-tax-' + (handled ? 'detail' : 'split')) + '?record=' + item.number)}>{handled ? '查看' : quote ? '报价' : '价税拆分'}</button></CardActions>
    </Section>) : <Empty search={filtered} text={!quote && handled && !filtered ? '暂无已处理的价税拆分记录' : quote ? '暂无匹配的询价单' : '暂无匹配的订单'} />}

    {open && <FullscreenPanel className="m-portal-task-filter" title={quote ? '筛选报价' : '筛选价税拆分'} onBack={() => runMotion(() => setOpen(false), 'back')}><div className="m-filter-view">
      <FilterField label={companyLabel} value={draft.company || ''} onChange={value => change('company', value)} />
      <FilterField label="采购类型" options={purchaseTypes} value={draft.type || ''} onChange={value => change('type', value)} />
      <DateRange label="单据日期" startLabel="创建日期起" endLabel="结束日期止" value={[draft.start || '', draft.end || '']} endError={dateError}
        onChange={([start, end]) => { setDraft(old => ({ ...old, start, end })); setDateError(''); }} />
      <Actions flat items={[{ label: '重置', muted: true, onClick: () => { setDraft({}); setDateError(''); } }, { label: '应用筛选', onClick: apply }]} />
    </div></FullscreenPanel>}
  </>;
}



