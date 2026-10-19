import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Actions, Confirm, Empty, Overlay, Field, Row, SearchBox, Section, UploadField } from './mobile-ui.jsx';
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
  return <><SearchBox value={query} onChange={setQuery} placeholder="搜索供应商或合作事项"><button className="m-filter-link" onClick={() => go('rating-filter?' + new URLSearchParams({ ...filters, return: mine ? 'my-ratings' : 'ratings' }).toString())}>筛选</button></SearchBox>{Object.entries(filters).filter(([key, value]) => key !== 'return' && value).length > 0 && <div className="m-filter-summary"><span>已筛选 · {Object.entries(filters).filter(([key, value]) => key !== 'return' && value).length}项</span><button onClick={() => go((mine ? 'my-ratings' : 'ratings') + '?')}>清除筛选</button></div>}{mine && <div className="m-status-tabs">{['全部', '未评分', '已评分'].map(x => <button key={x} className={status === x ? 'active' : ''} aria-pressed={status === x} onClick={() => setStatus(x)}>{x}</button>)}</div>}<div className="m-rating-list">{entries.length ? entries.map(x => <article className="m-bank-card" key={x.id}><h3>{x.name}</h3><div className="m-card-body">{[['合作类型', x.type], ['合作事项', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['评分状态', x.status], ['评分时间', x.rated], ['评价得分', x.score === '未评分' ? '' : x.score]].map(([label, value]) => <Row compact key={label} label={label}>{value || '—'}</Row>)}<div className="m-record-actions">{x.status === '未评分' ? <button onClick={() => onOpen(x, false)}>评分</button> : <><button onClick={() => onOpen(x, true)}>评分详情</button>{mine && <button onClick={() => onOpen(x, false)}>修改评分</button>}</>}</div></div></article>) : <Empty />}</div>{!mine && <div className="m-record-actions"><button onClick={onAdd}>新增评分</button></div>}</>;
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
    guard.accept(); onSave({ ...data, id: data.id || crypto.randomUUID(), status: '已评分', rated: time(), score: '' });
  };
  return <><Section title="基本信息"><Row label="供应商名称">{data.name}</Row><Row label="供应商类型">{supplier.type || '—'}</Row><Row label="供应商状态">{supplier.status || '—'}</Row><Row label="邀请人">{supplier.inviter || '—'}</Row><Row label="邀请时间">{supplier.date || '—'}</Row><Row label="注册方式">{supplier.mode || '—'}</Row></Section><Section title="评分信息">{readOnly ? <><Row label="合作类型">{data.type}</Row><Row label="合作事项">{data.content}</Row></> : <><Field label="合作类型" required value={data.type} options={types} error={errors.type} onChange={type => { if (type === data.type) return; if (data.dimensions.some(Boolean)) setNextType(type); else { setData({ ...data, type, dimensions: [] }); setErrors({}); } }} /><Field error={errors.content} label="合作事项" required value={data.content} onChange={content => { setData({ ...data, content }); setErrors(old => ({ ...old, content: undefined })); notify(''); }} />{errors.type && <p className="m-field-error">{errors.type}</p>}{errors.content && <p className="m-field-error">{errors.content}</p>}</>}
    {!readOnly && <p className="m-input-note">每项0.5–5分，可按0.5分调整。</p>}<div className="m-rating-dimensions" data-no-swipe>{labels.map((label, i) => <div key={label} className="m-rating-dimension"><label htmlFor={'rating-dimension-' + i}>{!readOnly && <em>*</em>}{label}</label>{readOnly ? <span>{data.dimensions[i] ? data.dimensions[i] + ' / 5' : '—'}</span> : <div className="m-star-control"><span>{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-pressed={data.dimensions[i] === n} aria-label={label + ' ' + n + '星'} onClick={() => changeDimension(i, n)}><span className="m-star-slot"><Star className={n <= data.dimensions[i] ? 'filled' : ''} />{data.dimensions[i] >= n - 0.5 && data.dimensions[i] < n && <span className="m-half-star"><Star className="filled" /></span>}</span></button>)}</span><input id={'rating-dimension-' + i} aria-label={label} type="number" inputMode="decimal" aria-invalid={!!errors.dimensions} min="0.5" max="5" step="0.5" value={data.dimensions[i] || ''} placeholder="0.5–5" onChange={e => { const value = e.target.value === '' ? '' : Number(e.target.value); changeDimension(i, value); }} /><span>/ 5</span><div className="m-score-stepper"><button aria-label={label + "减0.5分"} disabled={!data.dimensions[i] || data.dimensions[i] <= 0.5} onClick={() => changeDimension(i, Number((data.dimensions[i] - 0.5).toFixed(1)))}>减0.5</button><button aria-label={label + "加0.5分"} disabled={data.dimensions[i] >= 5} onClick={() => changeDimension(i, Number(((data.dimensions[i] || 0) + 0.5).toFixed(1)))}>加0.5</button></div></div>}</div>)}</div>{errors.dimensions && <p className="m-field-error">{errors.dimensions}</p>}
    {readOnly ? <><Row label="评价">{data.comment || '—'}</Row><Row label="评价得分">{data.score || '—'}</Row><Row label="评分时间">{data.rated}</Row></> : <Field label="评价" multiline maxLength={500} value={data.comment} onChange={comment => setData({ ...data, comment })} />}</Section><Actions items={[{ label: '返回', secondary: true, onClick: () => guard.leave(onCancel) }, ...(!readOnly ? [{ label: '提交', onClick: submit }] : [])]} />{nextType && <Confirm text="切换合作类型后需要重新填写评分项，是否继续？" onCancel={() => setNextType('')} onConfirm={() => { setData({ ...data, type: nextType, dimensions: [] }); setErrors({}); setNextType(''); }} />}</>;
}

export function RatingOperations({ notify }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState({ start: '', end: '', names: '' });
  const rows = cooperation.map((x, i) => ({ ...x, created: '2026-08-14 18:52:32', id: ['20882171982136639490', '2088217198212136961', '2099345533281612000'][i] }));
  const visible = rows;
  const apply = () => { if (data.start && data.end && data.start > data.end) return notify('开始时间不能晚于结束时间'); if (data.start || data.end || data.names.trim()) return notify('日期及过滤名单口径待确认，未应用这些条件'); notify('已显示可用演示记录'); };
  const exportRows = () => {
    const safe = v => '"' + (/^[=+@-]/.test(String(v)) ? "'" : '') + String(v).replaceAll('"', '""') + '"';
    const fields = ['id', 'name', 'type', 'content', 'person', 'department', 'date', 'created'];
    const header = ['主键', '供应商名称', '合作类型', '合作内容', '业务线联系人', '所属部门', '合作时间', '创建时间'];
    const csv = '\uFEFF' + [header, ...visible.map(x => fields.map(k => x[k]))].map(r => r.map(safe).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '评分查询-演示数据.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <><div className="m-filter-summary"><button onClick={() => setFilterOpen(true)}>查询条件</button><button onClick={exportRows}>导出当前记录</button></div><p className="m-input-note">日期及过滤名单口径待确认，当前仅展示演示记录。批量发起评分暂不可用。</p><div className="m-record-actions"><button disabled>批量发起评分</button></div>{filterOpen && <Overlay sheet label="评分查询条件" onClose={() => setFilterOpen(false)}><div className="m-picker-title"><strong>查询条件</strong><button onClick={() => setFilterOpen(false)}>关闭</button></div><Section title="评分查询"><Field label="开始时间" type="date" value={data.start} onChange={start => setData({ ...data, start })} /><Field label="结束时间" type="date" value={data.end} onChange={end => setData({ ...data, end })} /><Field label="过滤名单" value={data.names} multiline placeholder={'每行一项，也可粘贴用“#”分隔的名单'} onChange={names => setData({ ...data, names: names.replaceAll('#', '\n') })} /><div className="m-record-actions"><button onClick={apply}>检查查询条件</button></div></Section><p className="m-input-note">规则待确认，填写的条件不会改变当前结果。</p></Overlay>}<div className="m-rating-list">{visible.length ? visible.map(x => <article className="m-bank-card" key={x.id}><h3>{x.name}</h3><div className="m-card-body">{[['主键', x.id], ['合作类型', x.type], ['合作内容', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['创建时间', x.created]].map(([label, value]) => <Row label={label} compact key={label}>{value || '—'}</Row>)}</div></article>) : <Empty />}</div></>;
}

export function BankApplicationForm({ notify, onCancel, savedApplication, onComplete }) {
  const [data, setData] = useState(savedApplication || { bank: '', code: '', branch: '', country: '', province: '', city: '', explanation: '', attachment: '' });
  const [submitted, setSubmitted] = useState(!!savedApplication);
  const guard = useDirtyForm(data, !submitted);
  const [errors, setErrors] = useState({});
  const change = (key, value) => { setData({ ...data, [key]: value }); setErrors(old => ({ ...old, [key]: undefined })); notify(''); };
  const fields = [['bank', '银行名称', 100, true], ['code', '银行编码', 100, false], ['branch', '开户行(分行)名称', 100, true], ['province', '开户行省', 100, true], ['city', '开户行市', 100, true]];
  if (submitted) return <Section title="银行信息申请"><p className="m-form-result" role="status">申请信息已在原型中保存</p><Row label="银行名称">{data.bank}</Row><Row label="开户行(分行)名称">{data.branch}</Row>{[["code", "银行编码"], ["country", "国家/地区"], ["province", "开户行省"], ["city", "开户行市"], ["explanation", "申请说明"], ["attachment", "附件"]].map(([key, label]) => <Row key={key} label={label}>{attachmentName(data[key]) || "—"}</Row>)}<p className="m-inviter-note">未提交至真实审批服务，银行目录未更新。</p><Actions items={[{ label: '返回', onClick: onCancel }]} /></Section>;
  return <><Section title="申请信息"><Row label="申请人员">陈才慧</Row><Row label="人员部门">集团总部.ERP部.平台技术部</Row><Row label="申请日期">{time().slice(0, 10)}</Row></Section><Section title="银行信息">{fields.map(([key, label, maxLength, required], i) => <React.Fragment key={key}>{i === 3 && <Field error={errors.country} label="国家/地区" required options={['中国']} value={data.country} onChange={v => change('country', v)} />}<Field error={errors[key]} label={label} required={required} maxLength={maxLength} value={data[key]} placeholder={key === 'code' ? 'Swift码或金融机构代码' : undefined} onChange={v => change(key, v)} />{errors[key] && <p className="m-field-error">{errors[key]}</p>}</React.Fragment>)}<Field error={errors.explanation} label="申请说明" required multiline maxLength={200} value={data.explanation} onChange={v => change('explanation', v)} /><UploadField label="附件" value={data.attachment} onChange={v => change('attachment', v)} /></Section><Actions items={[{ label: '取消', secondary: true, onClick: () => guard.leave(onCancel) }, { label: '提交', onClick: () => { const next = {}; for (const [key, label, , required] of fields) if (required && !data[key].trim()) next[key] = '请填写' + label; if (!data.country) next.country = '请选择国家/地区'; if (!data.explanation.trim()) next.explanation = '请填写申请说明'; setErrors(next); if (Object.keys(next).length) return notify(Object.values(next)[0]); guard.accept(); onComplete?.(data); setSubmitted(true); window.scrollTo(0, 0); } }]} /></>;
}

