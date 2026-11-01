import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ClipboardList, Edit3, Filter, List, MoreHorizontal, Plus, X } from 'lucide-react';
import { Actions, ChangeTag, Empty, Field, StatusTag, OptionSheet, Overlay, Row, SearchBox, Section } from './mobile-ui.jsx';
import { BankCard } from './mobile-forms.jsx';
import { cooperation, supplierStates, supplierTypes, supplierIndustries } from './mobile-data.js';
import { SwipeArea } from './mobile-interaction.jsx';
import { ChangeComparison } from './mobile-changes.jsx';

export const mobileTabs = ['供应商查询', '我的邀请', '我的评分', '供应商评分', '供应商运维-评分查询', '银行信息申请'];
export function Tabs({ active, onChange, items = mobileTabs, variant = 'line' }) {
  const ref = useRef(null);
  const [directory, setDirectory] = useState(false);
  useEffect(() => { let cancelled = false; const align = () => { const nav = ref.current; const node = nav?.querySelector('[aria-current="page"]'); if (!cancelled && node) nav.scrollLeft = active === items.length - 1 ? nav.scrollWidth - nav.clientWidth : Math.max(0, node.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft - (nav.clientWidth - node.clientWidth) / 2); }; align(); document.fonts.ready.then(align); return () => { cancelled = true; }; }, [active, items.length]);
  return <div className={'m-tab-bar ' + (variant === 'pill' ? 'm-tab-bar-pill' : '')}><nav ref={ref} className="m-tabs" aria-label="功能模块">{items.map((label, i) => <button className={active === i ? 'active' : ''} aria-current={active === i ? 'page' : undefined} key={label} onClick={() => onChange(i)}>{label}</button>)}</nav><button className="m-tab-directory" aria-label="全部标签" onClick={() => setDirectory(true)}><ChevronDown /></button>{directory && <Overlay sheet label="全部标签" onClose={() => setDirectory(false)}><div className="m-picker-title"><strong>全部标签</strong><button onClick={() => setDirectory(false)}>关闭</button></div><div className="m-module-directory">{items.map((label, i) => <button key={label} aria-current={i === active ? "page" : undefined} onClick={() => { onChange(i); setDirectory(false); }}>{label}{i === active && <Check />}</button>)}</div></Overlay>}</div>;
}

export function SupplierList({ suppliers, mine = false, batch = false, checked, setChecked, onDetail, onBank, onMore, onInviter, onReinvite, onEdit, onEditAll, onDelete, admin = false, filtered = false }) {
  return <div className="m-supplier-list">{suppliers.length ? suppliers.map(s => <SupplierSummary key={s.id} {...{ s, mine, batch, checked, setChecked, onDetail, onBank, onMore, onInviter, onReinvite, onEdit, onEditAll, onDelete, admin }} />) : <Empty text={filtered ? '暂无匹配结果，请调整搜索或筛选条件' : '暂无供应商记录'} />}</div>;
}
function SupplierSummary({ s, mine, batch, checked, setChecked, onDetail, onBank, onMore, onInviter, onReinvite, onEdit, onEditAll, onDelete, admin }) {
  const [menu, setMenu] = useState(false);
  const historical = window.location.hash.startsWith('#/mobile/shot/');
  const selectable = mine || !admin || s.status === '草稿';
  const fields = mine ? [['证件号码', s.code], ['联系人姓名', s.contact], ['联系人邮箱', s.email], ['联系人电话', s.phone], ['更新时间', s.updated]] : [['注册方式', s.mode], ['更新时间', s.updated]];
  return <article className="m-supplier-card">
    <div className="m-supplier-heading"><h3>{batch && <label className="m-checkbox"><input type="checkbox" disabled={!selectable} aria-label={`选择${s.name}`} checked={checked.includes(s.id)} onChange={e => setChecked(e.target.checked ? [...checked, s.id] : checked.filter(x => x !== s.id))} /><span>{checked.includes(s.id) && <Check />}</span></label>}<i className="m-blue-mark" aria-hidden="true" /><span>{s.name}</span></h3>{!historical && <StatusTag value={s.status} />}</div>
    {!historical && <p className="m-supplier-kind">{s.type}<span>·</span>{s.mode}</p>}
    <dl>{(historical ? [['供应商类型', s.type], ['审批状态', s.status], ['邀请人', s.inviter], ['邀请时间', s.date], ...(!mine ? [['评分', s.score]] : []), ...fields] : [['邀请人', s.inviter], ...(!mine ? [['评分', s.score]] : []), ['邀请时间', s.date], ...fields.filter(([label]) => label !== '注册方式')]).map(([label, value]) => <div className={/时间|邮箱|证件/.test(label) ? 'm-supplier-wide' : ''} key={label}><dt>{label}{historical ? '：' : ''}</dt><dd>{label === '审批状态' ? <StatusTag value={value} /> : value || '—'}</dd></div>)}</dl>

    {batch && !selectable && <p className="m-input-note">仅草稿可删除</p>}
    {!batch && <div className="m-supplier-buttons"><button onClick={() => onDetail(s)}>详情</button>{s.status === '草稿' ? <button onClick={() => onEdit(s)}>修改</button> : s.status === '已审批' ? mine ? <button onClick={() => onEditAll(s)}>修改全部信息</button> : <button onClick={() => onBank(s)}>修改银行</button> : null}<button onClick={() => setMenu(true)}>更多操作</button></div>}
    {menu && <Overlay sheet label={s.name + '操作'} onClose={() => setMenu(false)}><div className="m-action-sheet"><h2>{s.name}</h2>
      {s.status === '已审批' && <>{mine ? <><button onClick={() => { setMenu(false); onInviter(s); }}>变更邀请人</button><button onClick={() => { setMenu(false); onEditAll(s); }}>修改全部信息</button></> : <><button onClick={() => { setMenu(false); onBank(s); }}>修改银行</button><button onClick={() => { setMenu(false); onMore(s, 'permissions'); }}>分配权限</button><button onClick={() => { setMenu(false); onInviter(s); }}>变更邀请人</button></>}</>}
      {mine && ['草稿', '邀请中'].includes(s.status) && <button onClick={() => { setMenu(false); onReinvite(s); }}>重新邀请</button>}
      {s.status === '草稿' && <button onClick={() => { setMenu(false); onEdit(s); }}>修改</button>}
      {s.status === '草稿' && (mine || admin) && <button className="m-action-danger" onClick={() => { setMenu(false); onDelete(s); }}>删除</button>}
      {!['草稿', '邀请中', '注册中', '注册驳回'].includes(s.status) && <button onClick={() => { setMenu(false); onMore(s, true); }}>审批记录</button>}
      <button className="cancel" onClick={() => setMenu(false)}>取消</button>
    </div></Overlay>}
  </article>;
}

export function FilterView({ rating = false, initial = {}, onApply, onCancel, initialDepartment = false }) {
  const [data, setData] = useState(initial);
  const [department, setDepartment] = useState(false);
  const update = (key, value) => setData({ ...data, [key]: value });
  const fields = rating ? [['cooperationType', '合作类型', ['技术服务', '电子产品']], ['person', '业务线联系人'], ['department', '所属部门'], ['start', '评分开始时间', 'date'], ['end', '评分结束时间', 'date']] : [['type', '供应商类型', supplierTypes], ['status', '供应商状态', supplierStates], ['start', '邀请时间（起）', 'date'], ['end', '邀请时间（止）', 'date'], ['recommended', '供应商推荐', supplierIndustries], ['inviter', '邀请人']];
  return <div className="m-filter-view">{fields.map(([key, label, kind]) => <Field key={key} label={label} allowClearDate={kind === 'date'} layout={kind === 'date' ? 'inline' : undefined} selectionMode="immediate" searchable={key === 'recommended'} value={data[key] || ''} type={kind === 'date' ? 'date' : 'text'} options={Array.isArray(kind) ? kind : undefined} onChange={v => update(key, v)} onPick={kind === 'department' ? () => setDepartment(true) : undefined} />)}<Actions flat items={[{ label: '取消', muted: true, onClick: onCancel }, { label: '重置', muted: true, onClick: () => setData({}) }, { label: '应用筛选', onClick: () => onApply(data) }]} />{department && <OptionSheet title="所属部门" value={data.department} options={[]} onChange={v => update('department', v)} onClose={() => setDepartment(false)} />}</div>;
}

export function Approval({ supplier, populated = true, history = false, showSupplier = true, number = 'SUP202610140004', type = '注册' }) {
  return <div className="m-approval">{supplier.pendingInformation && supplier.status === '变更中' && <ChangeComparison before={supplier} after={supplier.pendingInformation} />}{showSupplier && <Row label="供应商名称">{supplier.name}</Row>}<Section title="当前审批进度" collapsible={false}><Row label="审批类型">{type}</Row><div className="m-field-divider" /><Row label="审批单号">{populated ? number : ''}</Row>{populated ? <ol className="m-approval-timeline">{[['陈才慧(208660)', '开始'], ['陈才慧(208660)', '业务审批'], ['史小曼(110933)', '部门领导审批'], ['许丽(111505)', '财务审批']].map(([person, node], i) => <li key={node}><h3>{node}<StatusTag value={i === 3 ? '待审批' : '已审批'} /></h3><Row label="审批人">{person}</Row><Row label="代理人">—</Row><Row label="审批时间">2026-10-14</Row><Row label="审批意见">—</Row></li>)}</ol> : <Empty text="暂无审批节点" />}</Section><Section title="审批历史" collapsible={false}>{history ? ['审批单号', '审批类型', '审批状态', '发起时间', '发起人'].map(x => <Row key={x} label={x} />) : <Empty text="无数据" />}</Section></div>;
}

export function SupplierDetail({ supplier, initialTab = 0, approvalEmpty = false, onPreview, ratings = [], onScore, onRatingOpen }) {
  const [tab, setTab] = useState(initialTab);
  const basic = [['供应商名称', supplier.name], ['供应商类型', supplier.type], ['供应商编码', supplier.id], ['证件类型', supplier.type === supplierTypes[1] ? '身份证' : '三证合一'], ['证件号码', supplier.type === supplierTypes[1] ? '12******34' : supplier.code], ...(supplier.type === supplierTypes[1] ? [['姓名', supplier.name], ['性别', '男']] : [['邀请人', supplier.inviter], ['邀请时间', supplier.date], ['注册方式', supplier.mode], ['曾用名', ''], ['注册邮箱', supplier.email]])];
  return <div className="m-detail"><div className="m-detail-summary"><h2>{supplier.name}</h2><p className="m-summary-meta"><span>{supplier.type}</span><StatusTag value={supplier.status} /></p></div><Tabs variant="pill" items={['基本信息', '联系人信息', '银行信息', '分配权限', '财务OU', '黑名单操作记录', '审批记录', '合作信息及评分']} active={tab} onChange={setTab} /><SwipeArea active={tab} count={8} onChange={setTab}>
    {tab === 0 && <Section title="基本信息" collapsible={false}>{basic.map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}</Section>}
    {tab === 1 && <Section title="联系人信息" collapsible={false}>{supplier.contact ? <><Row label="姓名">{supplier.contact}</Row><Row label="电话">{supplier.phone}</Row><Row label="邮箱">{supplier.email}</Row></> : <Empty text="无数据" />}</Section>}
    {tab === 2 && <Section title="银行信息" collapsible={false}>{supplier.banks.length ? supplier.banks.map(b => <div key={b.id}><h3 className="m-account-heading">{b.accountType} · {b.bank} · 尾号{b.number?.slice(-4)}</h3>{[['账户类型', b.accountType], ['开户银行', b.bank], ['银行分行', b.branch], ['账户名称', b.name], ['银行账户', b.number], ['开户行所在国家（地区）', b.country], ['所在省', b.province], ['所在市', b.city], ['币种', b.currency], ['备注', b.note]].map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}</div>) : <Empty text="无数据" />}</Section>}
    {tab === 3 && <Section title="分配权限" collapsible={false}>{supplier.permissions.length ? supplier.permissions.map(p => <div key={p.id}><Row label="所属权限">{p.group}</Row><Row label="权限分类">{p.category}</Row><Row label="备注">{p.note}</Row></div>) : <Empty text="无数据" />}</Section>}
    {[4, 5].includes(tab) && <Section title={tab === 4 ? '财务OU' : '黑名单操作记录'} collapsible={false}><Empty text="无数据" /></Section>}
    {tab === 6 && <Approval supplier={supplier} populated={!approvalEmpty} showSupplier={false} />}
    {tab === 7 && <><div className="m-record-actions"><button onClick={onScore}>新增评分</button></div><RatingList entries={ratings.filter(x => x.name === supplier.name)} onOpen={record => onRatingOpen(record, true)} onEdit={record => onRatingOpen(record, false)} /></>}
  </SwipeArea></div>;
}

export function RatingList({ entries = cooperation, onOpen, onEdit }) {
  return <div className="m-rating-list">{entries.length ? entries.map(x => <article className="m-bank-card" key={x.id}><h3>{x.name}</h3><div className="m-card-body">{[['记录编号', x.id], ['供应商名称', x.name], ['合作类型', x.type], ['合作内容', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['评分时间', x.rated], ['评分', x.score]].map(([label, value]) => <Row compact key={label} label={label}>{value}</Row>)}{onOpen && <div className="m-record-actions">{x.status === '未评分' ? <button onClick={() => onEdit(x)}>评分</button> : <><button onClick={() => onOpen(x)}>评分详情</button>{x.person === '陈才慧' && <button onClick={() => onEdit(x)}>修改评分</button>}</>}</div>}</div></article>) : <Empty />}</div>;
}

export function PermissionCard({ data, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false);
  return <article className="m-bank-card" data-change={data.change || undefined}><div className="m-record-heading"><h3>{data.group || '供应商权限'}</h3><ChangeTag value={data.change} /></div><div className="m-card-body"><Row compact label="所属权限">{data.group}</Row><Row compact label="权限分类">{data.category}</Row><Row compact label="备注">{data.note}</Row>{(onEdit || onDelete) && <div className="m-record-actions">{onEdit && <button onClick={onEdit}>修改</button>}{onDelete && <button className="m-action-danger" onClick={onDelete}>删除</button>}</div>}</div></article>;
}

export function BankApplication({ onApply }) {
  return <div className="m-bank-application"><h2>申请须知</h2><p>若邀请注册供应商反馈添加银行信息时，未查询到目标开户银行或分行，可通过本功能补充未收录银行。</p><button onClick={onApply}>确认申请</button></div>;
}




