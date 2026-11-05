import { createSessionId, useBackLayer } from './mobile-interaction.jsx';
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Actions, AttachmentLink, Header, CardActions, FilterSummary, Confirm, Empty, FilterButton, Overlay, Field, FilterField, Row, SearchBox, Section, StatusTag, UploadField, SupplierIdentityCard } from './mobile-ui.jsx';
import { cooperation } from './mobile-data.js';
import { useDirtyForm, attachmentName } from './mobile-interaction.jsx';

// 截图中的已评分记录只提供总分，未提供各项分值，不反推或伪造明细。
export const initialRatings = [
  ...cooperation.map(x => ({ ...x, rated: '', status: '未评分', dimensions: [], comment: '' })),
  { id: 'demo-rated', name: '快速创建557348', type: '技术服务', content: '测试PR授权行', person: '陈才慧', department: '', date: '2026-08-14', rated: '2026-10-15 13:53:41', status: '已评分', score: '66', dimensions: [], comment: '' },
];
const types = ['技术服务', '电子产品'];
const dimensionsFor = type => type === '电子产品' ? ['产品外观、质量', '售后质量（退换货及维护等）', '供货/服务及时性', '服务体验', '诚信/合规'] : ['人员/服务质量', '供货/服务及时性', '产品质量', '服务体验', '诚信/合规'];
const time = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });

export function RatingWorkspace({ mine = false, records, onOpen, onAdd, go, filters = {}, savedView = {}, onViewChange }) {
  const [query, setQuery] = useState(savedView.ratingQuery || '');
  const [status, setStatus] = useState(savedView.ratingStatus || '全部');
  useEffect(() => onViewChange?.({ ratingQuery: query, ratingStatus: status }), [query, status]);
  const entries = records.filter(x => (!mine || x.person === '陈才慧') && (!query || [x.name, x.content, x.person].some(v => v?.includes(query))) && (status === '全部' || x.status === status) && (!filters.cooperationType || filters.cooperationType === x.type) && (!filters.person || x.person.includes(filters.person)) && (!filters.department || x.department.includes(filters.department)) && (!filters.start || x.rated.slice(0, 10) >= filters.start) && (!filters.end || x.rated.slice(0, 10) <= filters.end));
  return <><SearchBox value={query} onChange={setQuery} placeholder={mine ? "搜索供应商或合作内容" : "搜索供应商或合作事项"}><FilterButton label="筛选评分" onClick={() => go('rating-filter?' + new URLSearchParams({ ...filters, return: mine ? 'my-ratings' : 'ratings' }).toString())} /></SearchBox><FilterSummary entries={Object.entries(filters).filter(([key, value]) => key !== 'return' && value)} count={entries.length} onEdit={() => go('rating-filter?' + new URLSearchParams({ ...filters, return: mine ? 'my-ratings' : 'ratings' }).toString())} onClear={() => go((mine ? 'my-ratings' : 'ratings') + '?')} showConditions={false} />{mine && <div className="m-status-tabs">{['全部', '未评分', '已评分'].map(x => <button key={x} className={status === x ? 'active' : ''} aria-pressed={status === x} onClick={() => setStatus(x)}>{x}</button>)}</div>}<div className="m-rating-list">{entries.length ? entries.map(x => <article className="m-bank-card" key={x.id}><div className="m-record-heading"><h3>{x.name}</h3><div className="m-rating-card-state">{mine && x.status === '已评分' ? <strong aria-label={'评价得分' + (x.score || '未提供')}>{x.score ? x.score + '分' : '—'}</strong> : <StatusTag value={x.status} />}</div></div><div className="m-card-body">{[['合作类型', x.type], [mine ? '合作内容' : '合作事项', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['评分时间', x.rated], ...(!mine ? [['评价得分', x.score === '未评分' ? '' : x.score]] : [])].map(([label, value]) => <Row compact key={label} label={label}>{value || '—'}</Row>)}<CardActions>{x.status === '未评分' ? <button onClick={() => onOpen(x, false)}>评分</button> : <><button onClick={() => onOpen(x, true)}>评分详情</button>{mine && <button onClick={() => onOpen(x, false)}>修改评分</button>}</>}</CardActions></div></article>) : <Empty search={!!query || Object.entries(filters).some(([key, value]) => key !== 'return' && value)} text={query || Object.entries(filters).some(([key, value]) => key !== 'return' && value) ? '暂无匹配记录' : '暂无评分记录'} />}</div>{!mine && <div className="m-record-actions"><button onClick={onAdd}>新增评分</button></div>}</>;
}

export function RatingEditor({ record, supplier, readOnly, onSave, onCancel, notify }) {
  const [data, setData] = useState(record || { name: supplier.name, supplierId: supplier.id, type: '', content: '', person: '陈才慧', department: '', dimensions: [], comment: '', status: '未评分' });
  const [errors, setErrors] = useState({});
  const guard = useDirtyForm(data, !readOnly);
  const [nextType, setNextType] = useState('');
  const labels = dimensionsFor(data.type);
  const changeDimension = (index, value) => {
    const dimensions = labels.map((_, i) => i === index ? value : data.dimensions[i] || '');
    setData({ ...data, dimensions });
    if (dimensions.every(v => v >= 0.5 && v <= 5 && Number.isInteger(v * 2))) setErrors(old => ({ ...old, dimensions: undefined }));
    notify('');
  };
  const submit = () => {
    const next = {};
    if (!data.type) next.type = '请选择合作类型';
    if (!data.content.trim()) next.content = '请输入合作事项';
    if (labels.some((_, i) => !data.dimensions[i] || data.dimensions[i] > 5 || data.dimensions[i] < 0.5 || !Number.isInteger(data.dimensions[i] * 2))) next.dimensions = '请完成全部评分项';
    setErrors(next);
    if (Object.keys(next).length) return notify(Object.values(next)[0]);
    guard.accept(); onSave({ ...data, id: data.id || createSessionId(), status: '已评分', rated: time(), score: '' });
  };
  return <><SupplierIdentityCard supplier={{ ...supplier, name: data.name }}><div className="m-rating-supplier-meta"><Row label="邀请人">{supplier.inviter || '—'}</Row><Row label="邀请时间">{supplier.date || '—'}</Row></div></SupplierIdentityCard><Section title="评分信息">{readOnly ? <><Row label="合作类型">{data.type}</Row><Row label="合作事项">{data.content}</Row></> : <><Field label="合作类型" required value={data.type} options={types} error={errors.type} onChange={type => { if (type === data.type) return; if (data.dimensions.some(Boolean)) setNextType(type); else { setData({ ...data, type, dimensions: [] }); setErrors({}); } }} /><Field error={errors.content} label="合作事项" required value={data.content} onChange={content => { setData({ ...data, content }); setErrors(old => ({ ...old, content: undefined })); notify(''); }} /></>}
    <div className="m-rating-dimensions" data-no-swipe>{labels.map((label, i) => <div key={label} className="m-rating-dimension"><label htmlFor={'rating-dimension-' + i}>{!readOnly && <em>*</em>}{label}</label>{readOnly ? <span>{data.dimensions[i] ? data.dimensions[i] + ' / 5' : '—'}</span> : <div className="m-star-control"><span id={'rating-dimension-' + i} role="slider" aria-invalid={!!errors.dimensions} aria-label={label} aria-valuemin={0} aria-valuemax={5} aria-valuenow={data.dimensions[i] || 0} aria-valuetext={data.dimensions[i] ? data.dimensions[i] + '分，满分5分' : '未评分'} tabIndex={0} onKeyDown={e => { if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const value = e.key === 'Home' ? 0.5 : e.key === 'End' ? 5 : Math.max(0.5, Math.min(5, Number(data.dimensions[i] || 0) + (['ArrowLeft', 'ArrowDown'].includes(e.key) ? -0.5 : 0.5))); changeDimension(i, value); } }}>{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} tabIndex={-1} aria-pressed={data.dimensions[i] === n || data.dimensions[i] === n - 0.5} aria-label={label + ' ' + n + '星'} title={'左半边' + (n - 0.5) + '分，右半边' + n + '分'} onClick={e => { const rect = e.currentTarget.querySelector('.m-star-slot').getBoundingClientRect(); changeDimension(i, e.detail !== 0 && e.clientX < rect.left + rect.width / 2 ? n - 0.5 : n); }}><span className="m-star-slot"><Star className={n <= data.dimensions[i] ? 'filled' : ''} />{data.dimensions[i] >= n - 0.5 && data.dimensions[i] < n && <span className="m-half-star"><Star className="filled" /></span>}</span></button>)}</span><output className="m-rating-value" aria-live="polite">{data.dimensions[i] ? data.dimensions[i] + ' / 5' : '未评分'}</output></div>}</div>)}</div>{errors.dimensions && <p className="m-field-error">{errors.dimensions}</p>}
    {readOnly ? <><Row label="评价">{data.comment || '—'}</Row><Row label="评价得分">{data.score || '—'}</Row><Row label="评分时间">{data.rated}</Row></> : <Field label="评价" multiline maxLength={500} value={data.comment} onChange={comment => setData({ ...data, comment })} />}</Section><Actions items={[{ label: '返回', secondary: true, onClick: () => guard.leave(onCancel) }, ...(!readOnly ? [{ label: '提交', onClick: submit }] : [])]} />{nextType && <Confirm text="切换合作类型后需要重新填写评分项，是否继续？" onCancel={() => setNextType('')} onConfirm={() => { setData({ ...data, type: nextType, dimensions: [] }); setErrors({}); setNextType(''); }} />}</>;
}

export function RatingOperations({ notify }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState({ start: '', end: '', names: '' });
  const [applied, setApplied] = useState({ start: '', end: '', names: '' });
  const rows = cooperation.map((x, i) => ({ ...x, created: '2026-08-14 18:52:32', id: ['20882171982136639490', '2088217198212136961', '2099345533281612000'][i] }));
  const excluded = applied.names.split(/[\n#]/).map(x => x.trim()).filter(Boolean);
  const visible = rows.filter(x => (!applied.start || x.created.slice(0, 10) >= applied.start) && (!applied.end || x.created.slice(0, 10) <= applied.end) && !excluded.includes(x.person));
  useBackLayer(filterOpen, () => setFilterOpen(false));
  const apply = () => { if (data.start && data.end && data.start > data.end) return notify('开始时间不能晚于结束时间'); setApplied({ ...data }); setFilterOpen(false); };
  const exportRows = () => {
    const safe = v => '"' + (/^[=+@-]/.test(String(v)) ? "'" : '') + String(v).replaceAll('"', '""') + '"';
    const fields = ['id', 'name', 'type', 'content', 'person', 'department', 'date', 'created'];
    const header = ['主键', '供应商名称', '合作类型', '合作内容', '业务线联系人', '所属部门', '合作时间', '创建时间'];
    const csv = '\uFEFF' + [header, ...visible.map(x => fields.map(k => x[k]))].map(r => r.map(safe).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '评分查询-演示数据.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <><div className="m-filter-summary"><FilterButton label="筛选评分运维" onClick={() => { setData({ ...applied }); setFilterOpen(true); }} /><button onClick={exportRows}>导出当前记录</button></div><p className="m-input-note" role="status">共 {visible.length} 条；创建时间：{applied.start || "不限"} 至 {applied.end || "不限"}；排除评分人：{applied.names.trim() || "无"}</p><div className="m-record-actions"><button disabled>批量发起评分</button></div>{filterOpen && <div className="m-fullscreen-panel" role="dialog" aria-modal="true" aria-label="筛选评分运维"><Header title="筛选评分运维" onBack={() => setFilterOpen(false)} /><div className="m-filter-view m-ops-filter"><FilterField label="创建时间（起）" type="date" allowClearDate value={data.start} onChange={start => setData({ ...data, start })} /><FilterField label="创建时间（止）" type="date" allowClearDate value={data.end} onChange={end => setData({ ...data, end })} /><FilterField label="排除评分人" value={data.names} multiline placeholder={'输入排除评分人，每行一项或用“#”分隔'} onChange={names => setData({ ...data, names: names.replaceAll('#', '\n') })} /><p className="m-input-note">日期按记录创建时间查询，结束日期包含当日；名单按评分人姓名排除。</p><Actions flat items={[{ label: '重置', muted: true, onClick: () => setData({ start: '', end: '', names: '' }) }, { label: '应用筛选', onClick: apply }]} /></div></div>}<div className="m-rating-list">{visible.length ? visible.map(x => <article className="m-bank-card" key={x.id}><h3>{x.name}</h3><div className="m-card-body">{[['主键', x.id], ['合作类型', x.type], ['合作内容', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['创建时间', x.created]].map(([label, value]) => <Row label={label} compact key={label}>{value || '—'}</Row>)}</div></article>) : <Empty search={!!applied.start || !!applied.end || !!applied.names.trim()} text="暂无匹配记录" />}</div></>;
}

export function BankApplicationForm({ notify, onCancel, savedApplication, onComplete }) {
  const [data, setData] = useState(savedApplication || { bank: '', code: '', branch: '', country: '', province: '', city: '', explanation: '', attachment: '' });
  const [submitted, setSubmitted] = useState(!!savedApplication);
  const guard = useDirtyForm(data, !submitted);
  const [errors, setErrors] = useState({});
  const change = (key, value) => { setData({ ...data, [key]: value }); setErrors(old => ({ ...old, [key]: undefined })); notify(''); };
  const fields = [['bank', '银行名称', 100, true], ['code', '银行编码', 100, true], ['branch', '开户行(分行)名称', 100, true], ['province', '开户行省', 100, true], ['city', '开户行市', 100, true]];
  if (submitted) return <Section title="银行信息申请"><p className="m-form-result" role="status">申请信息已暂存</p><Row label="银行名称">{data.bank}</Row><Row label="开户行(分行)名称">{data.branch}</Row>{[["code", "银行编码"], ["country", "国家/地区"], ["province", "开户行省"], ["city", "开户行市"], ["explanation", "申请说明"], ["attachment", "附件"]].map(([key, label]) => <Row key={key} label={label}>{key === 'attachment' && data[key] ? <AttachmentLink value={data[key]} /> : attachmentName(data[key]) || "—"}</Row>)}<Actions items={[{ label: '返回', onClick: onCancel }]} /></Section>;
  return <><Section title="申请信息"><Row label="申请人员">陈才慧</Row><Row label="人员部门">集团总部.ERP部.平台技术部</Row><Row label="申请日期">{time().slice(0, 10)}</Row></Section><Section title="银行信息">{fields.map(([key, label, maxLength, required], i) => <React.Fragment key={key}>{i === 3 && <Field error={errors.country} label="国家/地区" required options={['中国']} value={data.country} onChange={v => change('country', v)} />}<Field error={errors[key]} label={label} required={required} maxLength={maxLength} value={data[key]} placeholder={key === 'code' ? 'Swift码或金融机构代码' : undefined} onChange={v => change(key, v)} /></React.Fragment>)}<Field error={errors.explanation} label="申请说明" required multiline maxLength={200} value={data.explanation} onChange={v => change('explanation', v)} /><UploadField label="附件" value={data.attachment} onChange={v => change('attachment', v)} /></Section><Actions items={[{ label: '取消', secondary: true, onClick: () => guard.leave(onCancel) }, { label: '提交', onClick: () => { const next = {}; for (const [key, label, , required] of fields) if (required && !data[key].trim()) next[key] = '请填写' + label; if (!data.country) next.country = '请选择国家/地区'; if (!data.explanation.trim()) next.explanation = '请填写申请说明'; setErrors(next); if (Object.keys(next).length) return notify(Object.values(next)[0]); guard.accept(); onComplete?.(data); setSubmitted(true); window.scrollTo(0, 0); } }]} /></>;
}



