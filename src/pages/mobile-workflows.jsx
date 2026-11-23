import { focusFormError } from '../components/mobile/validation.js';
import { bankApplicationFields, bankApplicationRequired } from './bank-application.js';
import { Actions, AppliedFilters, AttachmentLink, CardActions, CountTabs, FilterSummary, Confirm, DateRange, Empty, FilterButton, FullscreenPanel, QueryList, Row, Section, UploadField } from '../components/mobile/index.js';
import { createSessionId, useBackLayer } from './mobile-interaction.jsx';
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Field, FilterField, SearchBox, StatusTag, SupplierIdentityCard } from './mobile-ui.jsx';
import { queryRatingOperations, queryRatings } from '../api/mobile/mock-management.js';
import { useDirtyForm, attachmentName } from './mobile-interaction.jsx';

export { initialRatings, ratingDetailDemo } from '../api/mobile/mock-management.js';
export const ratingTypes = ['技术服务', '电子产品'];
export const dimensionsFor = type => type === '电子产品' ? ['产品外观、质量', '售后质量（退换货及维护等）', '供货/服务及时性', '服务体验', '诚信/合规'] : ['人员/服务质量', '供货/服务及时性', '产品质量', '服务体验', '诚信/合规'];
const time = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });

export function RatingWorkspace({ mine = false, historical = false, records = [], queryRatings: loadRatings, onOpen, onAdd, go, filters = {}, savedView = {}, listView, onViewChange }) {
  const [query, setQuery] = useState(savedView.ratingQuery || '');
  const [status, setStatus] = useState(savedView.ratingStatus || '全部');
  useEffect(() => onViewChange?.({ ratingQuery: query, ratingStatus: status }), [query, status]);
  const criteria = { mine, query, status, filters };
  const { records: entries, activeFilters, statusItems } = loadRatings ? loadRatings(criteria) : queryRatings(records, criteria);
  const filterCount = historical ? 0 : Object.keys(activeFilters).length;
  const scene = mine ? 'my-ratings' : 'ratings';
  const openFilters = () => go('rating-filter?' + new URLSearchParams({ ...activeFilters, return: scene }));
  return <>
    <QueryList records={entries} queryKey={JSON.stringify([query, status, activeFilters])} view={listView} enabled={!historical} header={
      <SearchBox value={query} onChange={setQuery} placeholder="搜索供应商或合作事项">
        <FilterButton label="筛选评分" active={filterCount > 0} onClick={openFilters} />
      </SearchBox>
    }>
      {visible => <>
        <AppliedFilters count={filterCount} onClear={() => go(scene + '?')} />
        {!mine && <FilterSummary count={entries.length} />}
        {mine && <CountTabs label="评分状态" items={statusItems} active={status} onChange={setStatus} />}
        <div className="m-rating-list">{visible.length ? visible.map(x => <article className="m-bank-card" key={x.id}><div className="m-record-heading"><h3 className="m-supplier-card-name">{x.name}</h3><div className="m-rating-card-state">{mine && x.status === '已评分' ? <strong aria-label={'评价得分' + (x.score || '未提供')}>{x.score ? x.score + '分' : '—'}</strong> : <StatusTag value={x.status} />}</div></div><div className="m-card-body">{[['合作类型', x.type], ['合作事项', x.content], ...(!mine ? [['业务线联系人', x.person], ['所属部门', x.department]] : []), ['合作时间', x.date], ['评分时间', x.rated], ...(!mine ? [['评价得分', x.score === '未评分' ? '' : x.score]] : [])].map(([label, value]) => <Row compact key={label} label={label}>{value || '—'}</Row>)}<CardActions split={mine && x.status !== '未评分'}>{x.status === '未评分' ? <button onClick={() => onOpen(x, false)}>评分</button> : <><button onClick={() => onOpen(x, true)}>评分详情</button>{mine && <button onClick={() => onOpen(x, false)}>修改评分</button>}</>}</CardActions></div></article>) : <Empty search={!!query || Object.keys(activeFilters).length > 0} text={query || Object.entries(activeFilters).some(([key, value]) => key !== 'return' && value) ? '暂无匹配记录' : '暂无评分记录'} />}</div>
      </>}
    </QueryList>
    {!mine && <div className="m-record-actions"><button onClick={onAdd}>新增评分</button></div>}
  </>;
}

const starPositions = [1, 2, 3, 4, 5];

function RatingStar({ position, value }) {
  return <span className="m-star-slot" aria-hidden="true">
    <Star className={position <= value ? 'filled' : ''} />
    {value >= position - 0.5 && value < position && <span className="m-half-star"><Star className="filled" /></span>}
  </span>;
}

const validRating = value => value >= 0.5 && value <= 5 && Number.isInteger(value * 2);

function RatingDimension({ label, index, value, readOnly, error, onChange }) {
  const id = 'rating-dimension-' + index;
  if (readOnly) return <div className="m-rating-dimension">
    <span className="m-rating-dimension-title">{label}</span>
    {value ? <div className="m-star-control">
      <span className="m-rating-stars" aria-hidden="true">{starPositions.map(position => <RatingStar key={position} position={position} value={value} />)}</span>
      <span className="m-rating-value">{value} / 5</span>
    </div> : <span>—</span>}
  </div>;

  const onKeyDown = event => {
    if (!['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const step = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -0.5 : 0.5;
    const next = event.key === 'Home' ? 0.5 : event.key === 'End' ? 5 : Math.max(0.5, Math.min(5, Number(value || 0) + step));
    onChange(next);
  };
  return <div className="m-rating-dimension">
    <span className="m-rating-dimension-title"><em aria-hidden="true">*</em>{label}</span>
    <div className="m-star-control">
      <span id={id} role="slider" aria-invalid={!!error} aria-label={label} aria-valuemin={0}
        aria-valuemax={5} aria-valuenow={value || 0} aria-valuetext={value ? value + '分，满分5分' : '未评分'} tabIndex={0} onKeyDown={onKeyDown}>
        {starPositions.map(position => <button type="button" key={position} tabIndex={-1}
          aria-pressed={value === position || value === position - 0.5} aria-label={label + ' ' + position + '星'}
          title={'左半边' + (position - 0.5) + '分，右半边' + position + '分'} onClick={event => {
            const rect = event.currentTarget.querySelector('.m-star-slot').getBoundingClientRect();
            onChange(event.detail !== 0 && event.clientX < rect.left + rect.width / 2 ? position - 0.5 : position);
          }}><RatingStar position={position} value={value} /></button>)}
      </span>
      <output className="m-rating-value" aria-live="polite">{value ? value + ' / 5' : '未评分'}</output>
    </div>
  </div>;
}

export function RatingEditor({ record, supplier, readOnly, onCancel, onSave, notify }) {
  const [data, setData] = useState(record || { name: supplier.name, supplierId: supplier.id, type: '', content: '', person: '陈才慧', department: '', date: '', dimensions: [], comment: '', status: '未评分' });
  const [errors, setErrors] = useState({});
  const guard = useDirtyForm(data, !readOnly);
  const [nextType, setNextType] = useState('');
  const labels = dimensionsFor(data.type);
  const changeDimension = (index, value) => {
    const dimensions = labels.map((_, i) => i === index ? value : data.dimensions[i] || '');
    setData({ ...data, dimensions });
    if (dimensions.every(validRating)) setErrors(old => ({ ...old, dimensions: undefined }));
    notify('');
  };
  const submit = () => {
    const next = {};
    if (!data.type) next.type = '请选择合作类型';
    if (!data.content.trim()) next.content = '请输入合作事项';
    if (labels.some((_, i) => !validRating(data.dimensions[i]))) next.dimensions = '请完成全部评分项';
    setErrors(next);
    if (Object.keys(next).length) { notify(Object.values(next)[0], false); return focusFormError(); }
    guard.accept(); onSave({ ...data, id: data.id || createSessionId(), status: '已评分', rated: time(), score: '' });
  };
  return <><SupplierIdentityCard supplier={{ ...supplier, name: data.name }}><div className="m-rating-supplier-meta"><Row label="邀请人">{supplier.inviter || '—'}</Row><Row label="邀请时间">{supplier.date || '—'}</Row></div></SupplierIdentityCard><Section title="评分信息" className={readOnly ? undefined : "m-supplier-form-fields"}>{readOnly ? <><Row label="合作类型">{data.type}</Row><Row label="合作事项">{data.content}</Row></> : <><Field label="合作类型" required value={data.type} options={ratingTypes} error={errors.type} onChange={type => { if (type === data.type) return; if (data.dimensions.some(Boolean)) setNextType(type); else { setData({ ...data, type, dimensions: [] }); setErrors({}); } }} /><Field error={errors.content} label="合作事项" required value={data.content} onChange={content => { setData({ ...data, content }); setErrors(old => ({ ...old, content: undefined })); notify(''); }} /></>}
    {readOnly ? <Row label="合作时间">{data.date || '—'}</Row> :
      <Field label="合作时间" type="date" allowClearDate value={data.date || ''} onChange={date => setData({ ...data, date })} />}
    <div className="m-rating-dimensions" data-no-swipe>{labels.map((label, index) => <RatingDimension key={label}
      label={label} index={index} value={data.dimensions?.[index]} readOnly={readOnly} error={!validRating(data.dimensions?.[index]) && errors.dimensions}
      onChange={value => changeDimension(index, value)} />)}</div>{errors.dimensions && <p className="m-field-error">{errors.dimensions}</p>}
    {readOnly ? <><Row label="评价">{data.comment || '—'}</Row><Row label="评价得分">{data.score || '—'}</Row><Row label="评分时间">{data.rated}</Row></> : <Field label="评价" multiline maxLength={500} value={data.comment} onChange={comment => setData({ ...data, comment })} />}</Section>{!readOnly && <Actions items={[{ label: '取消', secondary: true, onClick: onCancel }, { label: '提交', onClick: submit }]} />}{nextType && <Confirm text="切换合作类型后需要重新填写评分项，是否继续？" onCancel={() => setNextType('')} onConfirm={() => { setData({ ...data, type: nextType, dimensions: [] }); setErrors({}); setNextType(''); }} />}</>;
}

const emptyRatingFilters = { start: '', end: '', names: '' };

export function RatingOperations({ historical, queryRecords = queryRatingOperations }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState(emptyRatingFilters);
  const [applied, setApplied] = useState(emptyRatingFilters);
  const [dateError, setDateError] = useState('');
  const visible = queryRecords(applied);
  const filterCount = historical ? 0 : Object.values(applied).filter(value => value.trim()).length;
  useBackLayer(filterOpen, () => setFilterOpen(false));
  const apply = () => { if (data.start && data.end && data.start > data.end) return setDateError('结束日期不能早于开始日期'); setApplied({ ...data }); setFilterOpen(false); };
  const exportRows = () => {
    const safe = v => '"' + (/^[=+@-]/.test(String(v)) ? "'" : '') + String(v).replaceAll('"', '""') + '"';
    const fields = ['id', 'name', 'type', 'content', 'person', 'department', 'date', 'created'];
    const header = ['主键', '供应商名称', '合作类型', '合作内容', '业务线联系人', '所属部门', '合作时间', '创建时间'];
    const csv = '\uFEFF' + [header, ...visible.map(x => fields.map(k => x[k]))].map(r => r.map(safe).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '评分查询-演示数据.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <>
    <QueryList records={visible} queryKey={JSON.stringify(applied)} enabled={!historical} header={
      <div className="m-filter-summary">
        <FilterButton label="筛选评分运维" active={filterCount > 0}
          onClick={() => { setData({ ...applied }); setDateError(''); setFilterOpen(true); }} />
        {historical && <button onClick={exportRows}>导出当前记录</button>}
      </div>
    }>
      {records => <>
        <AppliedFilters count={filterCount} onClear={() => setApplied(emptyRatingFilters)} />
        <p className="m-input-note" role="status">共 {visible.length} 条；创建时间：{applied.start || '不限'} 至 {applied.end || '不限'}；排除评分人：{applied.names.trim() || '无'}</p>
        <div className="m-record-actions"><button disabled>批量发起评分</button></div>
        <div className="m-rating-list">{records.length ? records.map(x => <article className="m-bank-card" key={x.id}><h3>{x.name}</h3><div className="m-card-body">{[['主键', x.id], ['合作类型', x.type], ['合作内容', x.content], ['业务线联系人', x.person], ['所属部门', x.department], ['合作时间', x.date], ['创建时间', x.created]].map(([label, value]) => <Row label={label} compact key={label}>{value || '—'}</Row>)}</div></article>) : <Empty search={!!applied.start || !!applied.end || !!applied.names.trim()} text="暂无匹配记录" />}</div>
      </>}
    </QueryList>
    {filterOpen && <FullscreenPanel title="筛选评分运维" onBack={() => setFilterOpen(false)}><div className="m-filter-view"><DateRange label="创建时间" value={[data.start, data.end]} endError={dateError}
    onChange={([start, end]) => { setData({ ...data, start, end }); setDateError(''); }} /><FilterField label="排除评分人" value={data.names} multiline placeholder={'输入排除评分人，每行一项或用“#”分隔'} onChange={names => setData({ ...data, names: names.replaceAll('#', '\n') })} /><p className="m-input-note">日期按记录创建时间查询，结束日期包含当日；名单按评分人姓名排除。</p><Actions flat items={[{ label: '重置', muted: true, onClick: () => { setData(emptyRatingFilters); setDateError(''); } }, { label: '应用筛选', onClick: apply }]} /></div></FullscreenPanel>}
  </>;
}

export function BankApplicationForm({ notify, onCancel, savedApplication, onComplete }) {
  const [data, setData] = useState(savedApplication || { bank: '', code: '', branch: '', country: '', province: '', city: '', explanation: '', attachment: '' });
  const [submitted, setSubmitted] = useState(!!savedApplication);
  const guard = useDirtyForm(data, !submitted);
  const [errors, setErrors] = useState({});
  const change = (key, value) => { setData({ ...data, [key]: value }); setErrors(old => ({ ...old, [key]: undefined })); notify(''); };
  if (submitted) return <Section title="银行信息申请"><p className="m-form-result" role="status">申请信息已暂存</p><Row label="银行名称">{data.bank}</Row><Row label="开户行(分行)名称">{data.branch}</Row>{[["code", "银行编码"], ["country", "国家/地区"], ["province", "开户行省"], ["city", "开户行市"], ["explanation", "申请说明"], ["attachment", "附件"]].map(([key, label]) => <Row key={key} label={label}>{key === 'attachment' && data[key] ? <AttachmentLink value={data[key]} /> : attachmentName(data[key]) || "—"}</Row>)}</Section>;
  return <><Section title="申请信息"><Row label="申请人员">陈才慧</Row><Row label="人员部门">集团总部.ERP部.平台技术部</Row><Row label="申请日期">{time().slice(0, 10)}</Row></Section><Section title="银行信息" className="m-supplier-form-fields">{bankApplicationFields.map(({ key, label, maxLength, options, placeholder, multiline }) =>
    <Field key={key} error={errors[key]} label={label} required maxLength={maxLength} options={options}
      placeholder={placeholder} multiline={multiline} value={data[key]} onChange={value => change(key, value)} />)}<UploadField label="附件" value={data.attachment} onChange={v => change('attachment', v)} /></Section><Actions items={[{ label: '取消', secondary: true, onClick: () => guard.leave(onCancel) }, { label: '提交', onClick: () => { const next = {}; for (const field of bankApplicationFields) if (!data[field.key]?.trim()) next[field.key] = bankApplicationRequired(field); setErrors(next); if (Object.keys(next).length) { notify(Object.values(next)[0], false); return focusFormError(); } guard.accept(); onComplete?.(data); setSubmitted(true); window.scrollTo(0, 0); } }]} /></>;
}




