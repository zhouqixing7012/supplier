import { bankApplicationNotice } from './bank-application.js';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ClipboardList, Edit3, Filter, List, MoreHorizontal, Plus, X } from 'lucide-react';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { Actions, CardActions, RecordCard, RecordCollection, AttachmentLink, ChangeTag, Empty, Field, FilterField, StatusTag, OptionSheet, Overlay, PickerHeading, Row, SearchBox, Section, SupplierIdentityCard } from './mobile-ui.jsx';
import { BankCard, fieldsFor } from './mobile-forms.jsx';
import { cooperation, supplierStates, supplierTypes, supplierIndustries } from './mobile-data.js';
import { SwipeArea, attachmentName } from './mobile-interaction.jsx';
import { ChangeComparison } from './mobile-changes.jsx';
import { canChangeSupplier, canRateSupplier, canReinviteSupplier, canDeleteSupplier } from './mobile-rules.js';

import { MotionDetails, MotionPresence, runMotion } from './mobile-motion.jsx';

export function Tabs({ active, onChange, items, variant = 'line', showDirectory = true, stretch = false }) {
  const ref = useRef(null);
  const [directory, setDirectory] = useState(false);
  useEffect(() => { let cancelled = false; const align = () => { const nav = ref.current; const node = nav?.querySelector('[aria-current="page"]'); if (!cancelled && node) nav.scrollLeft = active === items.length - 1 ? nav.scrollWidth - nav.clientWidth : Math.max(0, node.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft - (nav.clientWidth - node.clientWidth) / 2); }; align(); document.fonts.ready.then(align); return () => { cancelled = true; }; }, [active, items.length]);
  const choose = i => { if (i !== active) runMotion(() => onChange(i), i > active ? 'tab-next' : 'tab-prev'); };
  useLayoutEffect(() => {
    const nav = ref.current;
    const align = () => { const button = nav?.querySelector('[aria-current="page"]'); if (!button) return; nav.style.setProperty('--m-indicator-x', button.offsetLeft + 'px'); nav.style.setProperty('--m-indicator-width', button.offsetWidth + 'px'); };
    align(); const observer = new ResizeObserver(align); observer.observe(nav); return () => observer.disconnect();
  }, [active, items.length]);
  return <><div className={'m-tab-bar m-tab-motion ' + (variant === 'pill' ? 'm-tab-bar-pill' : '') + (stretch ? ' m-tab-bar-stretch' : '')}><nav ref={ref} className="m-tabs" data-active={active} aria-label="功能模块">{items.map((label, i) => <button className={active === i ? 'active' : ''} aria-current={active === i ? 'page' : undefined} key={label} onClick={() => choose(i)}><span className="m-tab-label">{label}</span></button>)}<span className="m-tab-indicator" aria-hidden="true" /></nav>{showDirectory && <button className="m-tab-directory" aria-label="全部标签" onClick={() => setDirectory(true)}><ChevronDown /></button>}</div>{showDirectory && directory && <OptionSheet title="全部标签" options={items} value={items[active]} clearable={false} onClose={() => setDirectory(false)} onChange={label => { const index = items.indexOf(label); if (index >= 0) choose(index); }} />}</>;
}

export function SupplierList({ suppliers, mine = false, batch = false, checked, setChecked, onDetail, onBank, onMore, onInviter, onReinvite, onEdit, onEditAll, onDelete, onScore, admin = false, filtered = false, batchKind = 'delete' }) {
  return <div className="m-supplier-list">{suppliers.length ? suppliers.map(s => <SupplierSummary key={s.id} {...{ s, mine, batch, checked, setChecked, onDetail, onBank, onMore, onInviter, onReinvite, onEdit, onEditAll, onDelete, onScore, admin, batchKind }} />) : <Empty search={filtered} text={filtered ? '暂无匹配结果，请调整搜索或筛选条件' : '暂无供应商记录'} />}</div>;
}
function SupplierSummary({ s, mine, batch, checked, setChecked, onDetail, onBank, onMore, onInviter, onReinvite, onEdit, onEditAll, onDelete, onScore, admin, batchKind }) {
  const [menu, setMenu] = useState(false);
  const historical = window.location.hash.startsWith('#/mobile/shot/');
  const canChangeInviter = canChangeSupplier(s);
  const hasMore = canChangeSupplier(s) || (!mine && canRateSupplier(s)) || canReinviteSupplier(s) || canDeleteSupplier(s, mine) || !['草稿', '邀请中', '注册中', '注册驳回'].includes(s.status);
  const selectable = batchKind === 'all' ? true : batchKind === 'delete' ? canDeleteSupplier(s, mine) : canChangeInviter;
  const fields = mine ? [['证件号码', s.code], ['联系人姓名', s.contact], ['联系人邮箱', s.email], ['联系人电话', s.phone], ['邀请时间', s.date], ['更新时间', s.updated]] : [['注册方式', s.mode], ['更新时间', s.updated]];
  return <article data-motion-key={"supplier-" + s.id} className={'m-supplier-card' + (mine ? ' m-supplier-card-mine' : '')}>
    <div className="m-supplier-heading"><h3><MotionPresence show={batch} compact className="m-checkbox-presence"><label className="m-checkbox"><input type="checkbox" disabled={!selectable} aria-label={`选择${s.name}`} checked={checked.includes(s.id)} onChange={e => setChecked(e.target.checked ? [...checked, s.id] : checked.filter(x => x !== s.id))} /><span>{checked.includes(s.id) && <Check />}</span></label></MotionPresence><i className="m-blue-mark" aria-hidden="true" /><span>{s.name}</span></h3>{!historical && <StatusTag value={s.status} />}</div>
    {!historical && <p className="m-supplier-kind">{s.type}<span>·</span>{s.mode}</p>}
    <dl>{(historical ? [['供应商类型', s.type], ['审批状态', s.status], ...(!mine ? [['邀请人', s.inviter], ['邀请时间', s.date]] : []), ...fields, ...(!mine ? [['评分', s.score]] : [])] : [...(!mine ? [['邀请人', s.inviter], ['邀请时间', s.date]] : []), ...fields.filter(([label]) => label !== '注册方式'), ...(!mine ? [['评分', s.score]] : [])]).map(([label, value]) => <div className={/时间|邮箱|证件|评分/.test(label) ? 'm-supplier-wide' : ''} key={label}><dt>{label}{historical ? '：' : ''}</dt><dd>{label === '审批状态' ? <StatusTag value={value} /> : value || '—'}</dd></div>)}</dl>

    {!batch && <CardActions split><button onClick={() => onDetail(s)}>详情</button>{s.status === '草稿' ? <button onClick={() => onEdit(s)}>修改</button> : canChangeSupplier(s) ? mine ? <button onClick={() => onEditAll(s)}>修改全部信息</button> : <button onClick={() => onBank(s)}>修改银行</button> : null}{hasMore && <button onClick={() => setMenu(true)}>更多操作</button>}</CardActions>}
    {menu && <Overlay sheet label="更多操作" onClose={() => setMenu(false)}><div className="m-action-sheet"><PickerHeading title="更多操作" />
      {canChangeSupplier(s) && <>{mine ? <><button onClick={() => { setMenu(false); onInviter(s); }}>变更邀请人</button><button onClick={() => { setMenu(false); onEditAll(s); }}>修改全部信息</button></> : <><button onClick={() => { setMenu(false); onBank(s); }}>修改银行</button><button onClick={() => { setMenu(false); onMore(s, 'permissions'); }}>分配权限</button><button onClick={() => { setMenu(false); onInviter(s); }}>变更邀请人</button></>}</>}
      {!mine && canRateSupplier(s) && <button onClick={() => { setMenu(false); onScore(s); }}>评分</button>}
      {canReinviteSupplier(s) && <button onClick={() => { setMenu(false); onReinvite(s); }}>重新邀请</button>}
      {s.status === '草稿' && <button onClick={() => { setMenu(false); onEdit(s); }}>修改</button>}
      {canDeleteSupplier(s, mine) && <button className="m-action-danger" onClick={() => { setMenu(false); onDelete(s); }}>删除</button>}
      {!['草稿', '邀请中', '注册中', '注册驳回'].includes(s.status) && <button onClick={() => { setMenu(false); onMore(s, true); }}>审批记录</button>}
      <button className="cancel" onClick={() => setMenu(false)}>取消</button>
    </div></Overlay>}
  </article>;
}

export function FilterView({ rating = false, mine = false, initial = {}, onApply, onCancel }) {
  const [data, setData] = useState(() => rating && mine ? Object.fromEntries(Object.entries(initial).filter(([key]) => !['person', 'department'].includes(key))) : initial);
  const update = (key, value) => setData({ ...data, [key]: value });
  const fields = rating ? [['cooperationType', '合作类型', ['技术服务', '电子产品']], ...(!mine ? [['person', '业务线联系人'], ['department', '所属部门']] : []), ['start', '评分开始时间', 'date'], ['end', '评分结束时间', 'date']] : [['type', '供应商类型', supplierTypes], ['status', '供应商状态', supplierStates], ['start', '邀请时间（起）', 'date'], ['end', '邀请时间（止）', 'date'], ['recommended', '供应商推荐', supplierIndustries], ['inviter', '邀请人']];
  return <div className="m-filter-view">{fields.map(([key, label, kind]) => <FilterField key={key} label={label} allowClearDate={kind === 'date'} layout={kind === 'date' ? 'inline' : undefined} selectionMode="immediate" searchable={key === 'recommended'} value={data[key] || ''} type={kind === 'date' ? 'date' : 'text'} options={Array.isArray(kind) ? kind : undefined} onChange={v => update(key, v)} placeholder={rating && ['person', 'department'].includes(key) ? '请输入' + label : undefined} />)}<Actions flat items={[{ label: '重置', muted: true, onClick: () => setData({}) }, { label: '应用筛选', onClick: () => onApply(data) }]} /></div>;
}

function ApprovalTimeline({ nodes = [] }) {
  return nodes.length ? <ol className="m-approval-timeline">{nodes.map((entry, i) => <li key={entry.id || i} className={entry.status === '已审批' ? 'is-complete' : 'is-pending'}><h3 className="m-approval-heading">{entry.name || '—'}<StatusTag value={entry.status} /></h3><div className="m-approval-node"><Row label="审批时间">{entry.time ? <time dateTime={entry.time}>{entry.time}</time> : '—'}</Row><Row label="审批人">{entry.person || '—'}</Row><Row label="代理人">{entry.agent || '—'}</Row><Row label="审批意见">{entry.opinion || '—'}</Row></div></li>)}</ol> : <Empty text="暂无审批节点" />;
}

function ApprovalHistory({ records }) {
  // 同一审批单号归为一张卡片；缺少单号的占位记录彼此独立。
  const groups = new Map();
  records.forEach((record, i) => {
    const key = record.number || 'missing-' + i;
    const existing = groups.get(key);
    if (existing) existing.nodes.push(...(record.nodes || []));
    else groups.set(key, { ...record, key, nodes: [...(record.nodes || [])] });
  });
  return groups.size ? <div className="m-approval-history">{[...groups.values()].map(record => <MotionDetails className="m-approval-history-card" key={record.key}><summary><span className="m-history-title"><strong>{record.type || '—'}</strong><span className="m-history-number">审批单号：{record.number || '—'}</span></span><StatusTag value={record.status} /><ChevronDown className="m-history-chevron" aria-hidden="true" /></summary><div className="m-history-content"><Row label="发起时间">{record.startedAt || '—'}</Row><Row label="发起人">{record.initiator || '—'}</Row></div></MotionDetails>)}</div> : <Empty text="无数据" />;
}

export function Approval({ supplier, populated = true, history = false, showSupplier = true, number = 'SUP202610140004', type = '注册', onPreview }) {
  const currentNodes = populated ? (supplier.approvalNodes || [['陈才慧(208660)', '开始'], ['陈才慧(208660)', '业务审批'], ['史小曼(110933)', '部门领导审批'], ['许丽(111505)', '财务审批']].map(([person, name], i) => ({ person, name, status: i === 3 ? '待审批' : '已审批', time: '2026-10-14' }))) : [];
  const records = supplier.approvalHistory || (history ? [{ number: '', nodes: [] }] : []);
  return <div className="m-approval">{supplier.pendingInformation && supplier.status === '变更中' && <ChangeComparison before={supplier} after={supplier.pendingInformation} onPreview={onPreview} />}{showSupplier && <Row label="供应商名称">{supplier.name}</Row>}<Section title="当前审批进度" collapsible={false}><Row label="审批类型">{supplier.currentApprovalType || type}</Row><Row label="审批单号">{populated ? supplier.approvalNumber || number : ''}</Row><ApprovalTimeline nodes={currentNodes} /></Section><Section title="审批历史" collapsible={false}><ApprovalHistory records={records} /></Section></div>;
}

export function SupplierDetail({ supplier, initialTab = 0, approvalEmpty = false, onPreview, ratings = [], onScore, onRatingOpen }) {
  const [tab, setTab] = useState(initialTab);
  const registration = [['供应商账号', supplier.supplierAccount || supplier.userCode || supplier.account], ['邀请人', supplier.inviter], ['邀请时间', supplier.date], ['曾用名', supplier.supplierFormerName || supplier.formerName], ['注册邮箱', supplier.email]];
  const basic = { ...supplier.basic, type: supplier.type, supplierName: supplier.name, creditCode: supplier.basic?.creditCode || supplier.code, businessAdvantage: supplier.basic?.businessAdvantage || supplier.businessAdvantage };
  const basicRows = fieldsFor(supplier.type).filter(([key]) => key !== 'supplierName' || supplier.type === supplierTypes[1]);
  return <div className="m-detail"><SupplierIdentityCard supplier={supplier} /><Tabs variant="pill" items={['注册信息', '基本信息', '联系人信息', '银行信息', '分配权限', '财务OU', '黑名单操作记录', '审批记录', '合作信息及评分']} active={tab} onChange={setTab} /><SwipeArea active={tab} count={9} onChange={setTab}>
    {tab === 0 && <Section title="注册信息" collapsible={false}>{registration.map(([label, value]) => <Row key={label} label={label}>{value || '—'}</Row>)}</Section>}
    {tab === 1 && <><Section title="基本信息" collapsible={false}>{basicRows.map(([key, label]) => <Row key={key} label={label}>{basic[key] === '' ? '—' : basic[key] ?? '—'}</Row>)}<Row label="证照附件">{basic.proof ? <AttachmentLink value={basic.proof} onPreview={onPreview} /> : '—'}</Row></Section><QualificationInfo records={basic.qualifications} onPreview={onPreview} /></>}
    {tab === 2 && <RecordCollection showTitle={false} title="联系人信息" count={supplier.contacts?.length || (supplier.contact ? 1 : 0)} emptyText="暂无联系人信息">{(supplier.contacts?.length ? supplier.contacts : supplier.contact ? [{ id: 'legacy', name: supplier.contact, phone: supplier.phone, email: supplier.email }] : []).map(contact => <RecordCard key={contact.id} title={contact.name || '—'}>{[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{contact[key] || '—'}</Row>)}</RecordCard>)}</RecordCollection>}
    {tab === 3 && <RecordCollection showTitle={false} title="银行信息" count={supplier.banks.length} emptyText="暂无银行信息">{supplier.banks.map(bank => <BankCard fileProof key={bank.id} bank={bank} onPreview={() => onPreview(bank.proof)} />)}</RecordCollection>}
    {tab === 4 && <RecordCollection showTitle={false} title="分配权限" count={supplier.permissions.length} emptyText="暂无权限记录">{supplier.permissions.map(p => <PermissionCard key={p.id} data={p} />)}</RecordCollection>}
    {tab === 5 && <RecordCollection showTitle={false} title="财务OU" count={supplier.financeOus?.length || 0} emptyText="暂无财务OU">{supplier.financeOus?.map(record => <RecordCard key={record.id} title={record.orgName || '—'}>{[['负债账户', record.liabilityAccount], ['预付款账户', record.prepayAccount], ['地址', record.address]].map(([label, value]) => <Row key={label} label={label}><span className="m-finance-value">{value || '—'}</span></Row>)}</RecordCard>)}</RecordCollection>}
    {tab === 6 && <RecordCollection showTitle={false} title="黑名单操作记录" count={supplier.blacklistRecords?.length || 0} emptyText="暂无黑名单操作记录">{supplier.blacklistRecords?.map((record, index) => <RecordCard key={record.id} title={'黑名单记录 ' + (index + 1)} status={<StatusTag value={record.status} />}>{[['拉黑操作人', record.applyUser], ['拉黑操作时间', record.applyTime], ['拉黑原因', record.applyReason], ['移除操作人', record.removeUser], ['移除操作时间', record.removeTime], ['移除原因', record.removeReason]].map(([label, value]) => <Row key={label} label={label}>{value || '—'}</Row>)}</RecordCard>)}</RecordCollection>}
    {tab === 7 && <Approval supplier={supplier} populated={!approvalEmpty} showSupplier={false} onPreview={onPreview} />}
    {tab === 8 && <>{canRateSupplier(supplier) && <div className="m-record-actions"><button onClick={onScore}>新增评分</button></div>}<RatingList entries={ratings.filter(x => x.name === supplier.name)} onOpen={record => onRatingOpen(record, true)} onEdit={record => onRatingOpen(record, false)} /></>}
  </SwipeArea></div>;
}

export function RatingList({ entries = cooperation, onOpen, onEdit }) {
  return <div className="m-rating-list">{entries.length ? entries.map(x => <article className="m-bank-card" key={x.id}><h3>{x.name}</h3><div className="m-card-body">{[['记录编号', x.id], ['供应商名称', x.name], ['合作类型', x.type], ['合作内容', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['评分时间', x.rated], ['评分', x.score]].map(([label, value]) => <Row compact key={label} label={label}>{value}</Row>)}{onOpen && <CardActions>{x.status === '未评分' ? <button onClick={() => onEdit(x)}>评分</button> : <><button onClick={() => onOpen(x)}>评分详情</button>{x.person === '陈才慧' && <button onClick={() => onEdit(x)}>修改评分</button>}</>}</CardActions>}</div></article>) : <Empty />}</div>;
}

export function PermissionCard({ data, onEdit, onDelete }) {
  return <article className="m-bank-card" data-change={data.change || undefined}><div className="m-record-heading"><h3>{data.group || '供应商权限'}</h3><ChangeTag value={data.change} /></div><div className="m-card-body"><Row compact label="权限分类">{data.category}</Row><Row compact label="备注">{data.note}</Row>{(onEdit || onDelete) && <CardActions>{onEdit && <button type="button" onClick={onEdit}>修改</button>}{onDelete && <button className="m-action-danger" onClick={onDelete}>删除</button>}</CardActions>}</div></article>;
}

export function BankApplication({ onApply }) {
  return <div className="m-bank-application"><h2>申请须知</h2><p>{bankApplicationNotice}</p><button onClick={onApply}>确认申请</button></div>;
}




