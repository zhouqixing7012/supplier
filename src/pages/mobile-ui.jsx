import { middleEllipsis } from './mobile-edit-rules.js';
import { createPortal } from 'react-dom';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, CalendarDays, FileText, Paperclip, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, HelpCircle, Eye, EyeOff, X, Plus } from 'lucide-react';
import { useBackLayer, rememberAttachment, attachmentFiles, attachmentName } from './mobile-interaction.jsx';

import { useOverlayExit, runMotion } from './mobile-motion.jsx';

export function Section({ title, children, className = '', collapsible = true, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);
  useEffect(() => { const reveal = e => { if ([...ref.current.querySelectorAll('[data-field-label]')].some(n => e.detail.includes(n.dataset.fieldLabel))) setOpen(true); }; window.addEventListener('mobile-validation', reveal); return () => window.removeEventListener('mobile-validation', reveal); }, []);
  return <section ref={ref} className={`m-section ${className}`}>
    {title && <h2>{collapsible ? <button type="button" className="m-section-heading" onClick={() => setOpen(!open)} aria-expanded={open}><span className="m-collapse">{open ? <ChevronUp /> : <ChevronDown />}</span>{title}</button> : title}</h2>}
    {collapsible ? <div className="m-section-reveal" data-open={open} inert={!open ? true : undefined}><div className="m-section-content">{children}</div></div> : <div className="m-section-content">{children}</div>}
  </section>;
}

export function Row({ label, children, required = false, compact = false }) {
  return <div className={`m-row ${compact ? 'm-row-compact' : ''}`}><span className="m-label">{required && <em>*</em>}{label}</span><span className="m-value">{children}</span></div>;
}

export function FilterButton({ onClick, label = '筛选' }) {
  return <button type="button" className="m-icon-button" aria-label={label} title={label} onClick={onClick}><img src="/mobile-assets/workbench/filter.svg" alt="" /></button>;
}

export function ChangeTag({ value }) {
  if (!value) return null;
  const tone = value.includes('删除') ? 'danger' : /修改|变更/.test(value) ? 'warning' : 'info';
  return <span className="m-status" data-tone={tone} aria-label={'变更状态：' + value}>{value}</span>;
}

const statusTone = { '已拉黑': 'danger', '已移除': 'neutral',
  '草稿': 'neutral', '邀请中': 'info', '注册中': 'info',
  '审批中': 'warning', '待审批': 'warning', '变更中': 'warning',
  '已审批': 'success', '注册驳回': 'danger',
};
export function StatusTag({ value }) {
  return value ? <span className="m-status" data-tone={statusTone[value] || 'neutral'}>{value}</span> : <span>—</span>;
}

// 查询摘要只展示数量与筛选项，搜索词由搜索框自身承载。
export function FilterSummary({ entries = [], count, unit = '条', onEdit, onClear, label = '当前查询条件', showConditions = true }) {
  return <section className="m-applied-filters" aria-label={label}><div className="m-filter-summary">{entries.length > 0 && <button type="button" onClick={onEdit}>已筛选 · {entries.length}项</button>}{count !== undefined && <span className="m-result-count" role="status">共 {count} {unit}</span>}{entries.length > 0 && <button type="button" onClick={onClear}>清除筛选</button>}</div>{showConditions && entries.length > 0 && <dl className="m-applied-conditions">{entries.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}</section>;
}
export function AppliedFilters({ filters, count, onEdit, onClear }) {
  const labels = { type: '供应商类型', status: '供应商状态', start: '邀请时间（起）', end: '邀请时间（止）', recommended: '供应商推荐', inviter: '邀请人' };
  const entries = Object.entries(filters).filter(([key, value]) => labels[key] && value).map(([key, value]) => [labels[key], value]);
  return <FilterSummary entries={entries} count={count} unit="家供应商" onEdit={onEdit} onClear={onClear} />;
}

export function Field({ label, value = '', onChange, required = false, options, onPick, type = 'text', placeholder, maxLength, help, readOnly = false, multiline = false, error, inputMode, autoComplete, selectionMode = 'immediate', searchable = false, layout, allowClearDate = false, trailing, hideLabel = false }) {
  const id = useId();
  const [validation, setValidation] = useState('');
  useEffect(() => {
    const show = e => { if (e.detail.includes(label)) setValidation(e.detail); };
    window.addEventListener('mobile-validation', show);
    return () => window.removeEventListener('mobile-validation', show);
  }, [label]);
  useEffect(() => setValidation(''), [value]);
  error = error || validation;
  const [choosing, setChoosing] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const numeric = /邮箱验证码|注册资金|QQ/.test(label);
  const attrs = { 'aria-invalid': !!error, 'aria-describedby': error ? id + '-error' : undefined, inputMode: inputMode || (numeric ? 'numeric' : /电话|手机/.test(label) ? 'tel' : /邮箱/.test(label) ? 'email' : undefined), autoComplete: autoComplete || (type === 'password' ? (/新/.test(label) ? 'new-password' : 'current-password') : /邮箱/.test(label) ? 'email' : /邮箱验证码/.test(label) ? 'one-time-code' : /账号/.test(label) ? 'username' : /电话|手机/.test(label) ? 'tel' : 'off'), enterKeyHint: 'next' };
  return <><div data-field-label={label} className={`m-field ${hideLabel ? 'm-field-placeholder-only' : ''} ${layout === 'inline' ? 'm-field-force-inline' : ''} ${multiline ? 'm-field-stacked' : 'm-field-inline'} ${error ? 'has-error' : ''} ${multiline ? 'm-field-block' : ''}`}>
    <label htmlFor={id}>{required && <em>*</em>}<span className="m-field-name">{label}</span>{help && !hideLabel && <button type="button" className="m-help" aria-label={label + "填写说明"} onClick={() => setHelpOpen(true)}><HelpCircle /></button>}</label>
    <div className={"m-field-control" + (trailing ? " m-control-trailing" : "")}>
      {onPick ? <button aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} id={id} aria-label={label} type="button" className="m-select-field" onClick={onPick}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || `请选择${label}`}</span>{type === 'date' ? <><CalendarDays className="m-date-icon" /><ChevronRight className="m-date-shot-icon" /></> : <ChevronRight />}</button> : options ? <button aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} id={id} role="combobox" aria-label={label} aria-expanded={choosing} aria-haspopup="dialog" type="button" className="m-select-field" onClick={() => setChoosing(true)}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || `请选择${label}`}</span><ChevronDown /></button> : type === 'date' ? <button aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} id={id} aria-label={label} className="m-select-field" type="button" onClick={() => setDateOpen(true)}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || '请选择日期'}</span><CalendarDays className="m-date-icon" /><ChevronDown className="m-date-shot-icon" /></button> : multiline ? <textarea {...attrs} id={id} aria-label={label} value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder || `请输入${label}`} required={required} readOnly={readOnly} /> : <input {...attrs} id={id} aria-label={label} value={value} onChange={e => onChange?.(e.target.value)} type={type === 'password' && visiblePassword ? 'text' : type} maxLength={maxLength} placeholder={readOnly ? '—' : placeholder || `请输入${label}`} required={required} readOnly={readOnly} />}
      {trailing}{hideLabel && help && <button type="button" className="m-help m-filter-help" aria-label={label + '填写说明'} onClick={() => setHelpOpen(true)}><HelpCircle /></button>}{onChange && value && !readOnly && !options && !onPick && type !== 'date' && type !== 'password' && <button type="button" className="m-field-clear" aria-label={'清空' + label} onClick={() => { onChange(''); document.getElementById(id)?.focus(); }}><X /></button>}{type === 'password' && <button type="button" className="m-password-toggle" aria-label={visiblePassword ? "隐藏密码" : "显示密码"} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>}{maxLength && !options && !onPick && <small className="m-counter">{value.length}/{maxLength}</small>}
    </div>{error && <p id={id + "-error"} className="m-field-error" role="alert">{error}</p>}
  </div>{helpOpen && <Overlay label={label + "填写说明"} onClose={() => setHelpOpen(false)}><h2>{label}</h2><p>{help}</p><div className="m-dialog-actions"><button onClick={() => setHelpOpen(false)}>知道了</button></div></Overlay>}{choosing && <OptionSheet title={label} options={options} value={value} onChange={onChange} onClose={() => setChoosing(false)} mode={selectionMode} searchable={searchable} />}{dateOpen && <DateSheet allowClear={allowClearDate} title={label} value={value} onChange={onChange} onClose={() => setDateOpen(false)} />}</>;
}

// 筛选项以提示文案表达字段名，关联标签及 aria-label 继续保留。
export function FilterField(props) {
  const name = props.label.replace('（起）', '开始').replace('（止）', '结束');
  const placeholder = props.placeholder || (props.type === 'date' ? '选择' + name : props.options || props.onPick ? name : '输入' + name);
  return <Field {...props} hideLabel placeholder={placeholder} />;
}

export function UploadField({ label, required, value, onChange, help }) {
  const id = useId();
  const [error, setError] = useState('');
  useEffect(() => { const show = e => { if (e.detail.includes(label)) setError(e.detail); }; window.addEventListener('mobile-validation', show); return () => window.removeEventListener('mobile-validation', show); }, [label]);
  useEffect(() => setError(''), [value]);
  const [preview, setPreview] = useState(attachmentFiles.get(value)?.url || '');
  const [helpOpen, setHelpOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const receiveFile = file => { if (file) { const entry = rememberAttachment(file); onChange(entry.key); setPreview(file.type.startsWith('image/') ? entry.url : ''); } };
  return <div data-field-label={label} className="m-field m-upload-field"><label htmlFor={id}>{required && <em>*</em>}<span className="m-field-name">{label}</span>{help && <button type="button" className="m-help" aria-label={label + "填写说明"} onClick={() => setHelpOpen(true)}><HelpCircle /></button>}</label><div className="m-field-control">
    {value ? <div className="m-uploaded-document"><AttachmentLink value={value} onPreview={() => setPreviewOpen(true)} /><button type="button" className="m-file-remove" aria-label={'移除' + label} onClick={() => setRemoving(true)}><X aria-hidden="true" /></button></div> : <div className="m-upload"><button type="button" className="m-upload-preview" aria-label={'选择' + label} onClick={() => document.getElementById(id)?.click()}><Camera aria-hidden="true" /></button></div>}
    <input className="m-file-input" tabIndex={-1} id={id} type="file" aria-invalid={!!error} aria-describedby={error ? id + '-error' : undefined} aria-label={label} onChange={e => { receiveFile(e.target.files[0]); e.target.value = ''; }} />
    <div className="m-upload-tools"><label htmlFor={id + '-camera'}>拍照<input id={id + '-camera'} type="file" accept="image/*" capture="environment" aria-label={'拍照上传' + label} onChange={e => { receiveFile(e.target.files[0]); e.target.value = ''; }} /></label><button type="button" onClick={() => document.getElementById(id)?.click()}>{value ? '替换照片或文件' : '选择照片或文件'}</button></div>
    {previewOpen && <AttachmentViewer value={value} title={label} onClose={() => setPreviewOpen(false)} />}
  </div>{error && <p id={id + "-error"} className="m-field-error" role="alert">{error}</p>}{helpOpen && <Overlay label={label + "填写说明"} onClose={() => setHelpOpen(false)}><h2>{label}</h2><p>{help}</p><div className="m-dialog-actions"><button onClick={() => setHelpOpen(false)}>知道了</button></div></Overlay>}{removing && <Confirm danger text={"确认移除" + label + "？"} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setPreview(''); setRemoving(false); }} />}</div>;
}

// 通用文件上传保留实际文件名，不以拍照缩略图代替附件。
export function FileUploadField({ label, value, onChange }) {
  const input = useRef(null);
  const [removing, setRemoving] = useState(false);
  return <div className="m-file-upload-field"><span className="m-file-upload-label">{label}</span>
    <input ref={input} type="file" className="m-file-input" tabIndex={-1} aria-label={label} onChange={e => { const file = e.target.files[0]; if (file) onChange(rememberAttachment(file).key); e.target.value = ''; }} />
    {value && <div className="m-file-upload-entry"><AttachmentLink value={value} onPreview={() => setRemoving('preview')} /><button type="button" className="m-file-remove" aria-label={'移除' + label} onClick={() => setRemoving(true)}><X aria-hidden="true" /></button></div>}
    <button type="button" className="m-file-select" onClick={() => input.current.click()}><Paperclip aria-hidden="true" />{value ? '替换文件' : '选择文件'}</button>
    {removing === 'preview' && <AttachmentViewer value={value} title={label} onClose={() => setRemoving(false)} />}
    {removing === true && <Confirm danger text={'确认移除' + label + '？'} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setRemoving(false); }} />}
  </div>;
}

export function SearchBox({ value, onChange, placeholder = '搜索供应商名称或邀请人', children }) {
  return <div className="m-search-row"><label className="m-search"><img src="/mobile-assets/workbench/search.svg" alt="" /><input type="search" autoComplete="off" enterKeyHint="search" aria-label={placeholder || '搜索供应商名称或邀请人'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button type="button" aria-label="清空搜索" onClick={() => onChange('')}><img src="/mobile-assets/workbench/search-clear.svg" alt="" /></button>}</label>{children}</div>;
}

export function Actions({ items, flat = false, className = '' }) {
  const primary = items.reduce((index, item, i) => !item.secondary && !item.muted && (items.length === 1 || !/^(取消|返回|关闭|上一步|重置|保存草稿|继续修改)/.test(item.label)) ? i : index, -1);
  return <footer className={`m-actions ${flat ? 'm-actions-flat' : ''} ${className}`}>{items.map((item, i) => <button key={`${item.label}-${i}`} type={item.type || 'button'} className={item.secondary ? 'secondary' : item.muted ? 'muted' : item.primary || i === primary ? 'primary' : 'secondary'} disabled={item.disabled} onClick={item.onClick}>{item.label}</button>)}</footer>;
}

// 搜索与业务空态共用工作台原始插画资产。
function SearchEmptyArt({ search = false }) {
  const base = '/mobile-assets/workbench/';
  return <span className={search ? "m-search-empty-art" : "m-search-empty-art m-record-empty-art"} aria-hidden="true"><span className="m-empty-art-group"><span className="m-empty-art-board" /><span className="m-empty-art-mask"><span /></span>{search && <img className="m-empty-art-warning" src={base + 'empty-warning.svg'} alt="" />}<img className="m-empty-art-clip" src={base + 'empty-clip.svg'} alt="" />{search && <><span className="m-empty-art-bar" /><img className="m-empty-art-dots" src={base + 'empty-dots.svg'} alt="" /></>}<img className="m-empty-art-detail" src={base + 'empty-detail.png'} width="34.909" height="46.545" alt="" /></span><span className="m-empty-art-decoration"><img src={base + 'empty-decoration.svg'} alt="" /></span></span>;
}

export function Empty({ text = '暂无数据', illustration = false, search = false, variant = 'bare' }) {
  return <div className={`m-empty m-empty-${variant} ${illustration ? 'm-empty-illustrated' : ''} ${search ? 'm-empty-search' : !illustration ? 'm-empty-neutral' : ''}`} role="status">{search || !illustration ? <span className="m-empty-art-frame"><SearchEmptyArt search={search} /></span> : illustration && <span className="m-empty-plate"><img src="/mobile-assets/empty-application-source.jpg" alt="" /></span>}<span>{text}</span></div>;
}

export function AttachmentLink({ value, onPreview }) {
  const [opened, setOpened] = useState(false);
  const name = attachmentName(value);
  const [displayName, setDisplayName] = useState(name);
  const ref = useRef(null);
  useEffect(() => {
    let active = true;
    const fit = () => {
      const node = ref.current;
      if (!node || !active) return;
      const style = getComputedStyle(node);
      const width = node.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0) - 20;
      if (width <= 0) return;
      const context = document.createElement('canvas').getContext('2d');
      context.font = getComputedStyle(node.querySelector('span')).font;
      let low = 5, high = Array.from(name).length;
      if (context.measureText(name).width <= width) { setDisplayName(name); return; }
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (context.measureText(middleEllipsis(name, middle)).width <= width) low = middle;
        else high = middle - 1;
      }
      setDisplayName(middleEllipsis(name, low));
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(ref.current);
    document.fonts.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, [name]);
  return <><button ref={ref} type="button" className="m-attachment-reference" title={name} aria-label={'查看附件：' + name} onClick={() => onPreview ? onPreview(value) : setOpened(true)}><span>{displayName}</span><img className="m-attachment-link-icon" src="/mobile-assets/workbench/attachment-link.svg" alt="" width="16" height="16" /></button>{opened && <AttachmentViewer value={value} onClose={() => setOpened(false)} />}</>;
}

export function AttachmentViewer({ value, title = '查看附件', onClose }) {
  const [opened, setOpened] = useState(false);
  const file = attachmentFiles.get(value);
  const name = attachmentName(value);
  const isImage = file?.type.startsWith('image/');
  return <Overlay label="查看附件" onClose={onClose} sheet><div className="m-attachment-viewer"><div className="m-picker-title"><strong>{opened ? name : title}</strong><button type="button" aria-label="关闭附件" onClick={onClose}><X /></button></div>{!opened ? <><p className="m-attachment-count">共 1 个附件</p><div className="m-attachment-list"><button type="button" className="m-attachment-file selected" aria-label={'预览' + name} disabled={!file} onClick={() => setOpened(true)}><span className="m-file-icon"><img src="/mobile-assets/workbench/file.svg" alt="" /></span><span><strong>{name}</strong><small>{file ? isImage ? '图片附件' : '文件附件' : '附件暂不可用'}</small></span></button></div>{!file && <p className="m-attachment-unavailable">附件暂不可用，请联系提供方补充。</p>}<div className="m-picker-actions"><button type="button" onClick={onClose}>返回</button><button type="button" className="primary" disabled={!file} onClick={() => setOpened(true)}>打开附件</button></div></> : <><div className="m-attachment-content">{isImage ? <a href={file.url} target="_blank" rel="noreferrer" aria-label="打开原图"><img className="m-attachment-full" src={file.url} alt={name} /></a> : <p>此文件不支持图片预览。<a href={file.url} target="_blank" rel="noreferrer">打开文件</a></p>}</div><div className="m-picker-actions"><button type="button" onClick={() => setOpened(false)}>返回附件列表</button><button type="button" className="primary" onClick={onClose}>关闭</button></div></>}</div></Overlay>;
}

export function Overlay({ children, label = '选择', onClose: closeOriginal, sheet = false }) {
  const onClose = () => runMotion(closeOriginal, 'sheet-close');
  const ref = useRef(null);
  useOverlayExit(ref);
  useBackLayer(true, onClose);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const targets = () => [...ref.current.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(x => !x.disabled && x.tabIndex >= 0 && x.getClientRects().length > 0);
    const first = ref.current.querySelector('[data-initial-focus]') || targets()[0];
    (first || ref.current).focus({ preventScroll: true });
    const onKey = e => {
      if (ref.current.closest('[inert]')) return;
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') { const items = targets(); const first = items[0], last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  const overlay = <div className="m-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} tabIndex={-1} className={sheet ? 'm-sheet' : 'm-dialog'} role="dialog" aria-modal="true" aria-label={label}>{children}</div></div>;
  const host = document.querySelector('#root .mobile-page');
  return host ? createPortal(overlay, host) : overlay;
}

// 重复记录共用分组标题、顶部添加入口及空态，避免各页面另画容器。
// 搜索及信息目录按需使用右侧选中标记，整行保持可点。
export function SelectionMark({ selected }) {
  return <span className="m-option-radio" data-selected={selected || undefined} aria-hidden="true">{selected && <Check />}</span>;
}

export function PickerHeading({ title }) {
  return <div className="m-picker-title m-common-picker-heading"><strong>{title}</strong></div>;
}

export function RecordCollection({ title, count = 0, emptyText, addLabel, onAdd, children, className = '' }) {
  return <section className={'m-record-collection ' + className}>
    <div className="m-record-collection-header"><h2 className="m-record-collection-title">{title}</h2>{onAdd && <button type="button" className="m-record-add" aria-label={addLabel || '添加' + title} onClick={onAdd}><Plus aria-hidden="true" /><span>添加</span></button>}</div>
    {count ? children : <div className="m-record-empty-card"><Empty text={emptyText || '暂无' + title} /></div>}
  </section>;
}
export function RecordCard({ title, children, motionKey, status }) {
  return <article className="m-record-card" data-motion-key={motionKey}><div className="m-record-card-heading"><h3>{title}</h3>{status}</div><div className="m-record-card-body">{children}</div></article>;
}

// 卡片内操作栏统一留白与触控范围，split仅用于列表主次布局。
export function CardActions({ children, split = false }) {
  return <div className={'m-card-actions' + (split ? ' m-card-actions-split' : '')}>{children}</div>;
}

export function SupplierIdentityCard({ supplier, children, showMeta = true }) {
  return <div className="m-detail-summary"><div className="m-supplier-heading"><h2>{supplier.name}</h2>{supplier.status && <StatusTag value={supplier.status} />}</div>{showMeta && <p className="m-summary-meta"><span>{supplier.type || '—'} · {supplier.mode || '—'}</span></p>}{children}</div>;
}

export function Confirm({ text, onCancel: cancelOriginal, onConfirm: confirmOriginal, cancelLabel = '取消', confirmLabel = '确认', danger = false, unsaved = false, decision = false, title, className = '' }) {
  const onCancel = () => runMotion(cancelOriginal, 'sheet-close');
  const onConfirm = () => runMotion(confirmOriginal, 'record');
  const heading = title || (unsaved ? '离开编辑？' : decision ? '退出登录？' : '提示');
  const primaryCancel = unsaved;
  return <Overlay label={heading} onClose={onCancel}><div className={'m-decision-confirm ' + className}><h2>{heading}</h2><p>{text}</p><div className="m-decision-actions">
    <button type="button" className="m-discard-button" data-initial-focus={danger ? true : undefined} onClick={primaryCancel ? onConfirm : onCancel}>{primaryCancel ? confirmLabel : cancelLabel}</button>
    <button type="button" className={'m-continue-button' + (danger ? ' m-action-danger' : '')} data-initial-focus={primaryCancel || !danger ? true : undefined} onClick={primaryCancel ? onCancel : onConfirm}>{primaryCancel ? cancelLabel : confirmLabel}</button>
  </div></div></Overlay>;
}

export function ScreenshotTip({ onClose }) {
  return <Overlay label="截屏提示" onClose={onClose}><div className="m-capture-tip"><span className="m-capture-plate"><img src="/mobile-assets/capture-notice-source.jpg" alt="截屏分享提醒" /></span><p>截屏已生效，分享需谨慎</p><button onClick={onClose}>知道了</button></div></Overlay>;
}

function DateWheel({ label, values, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const id = useId();
  useEffect(() => {
    const node = ref.current;
    const top = Math.max(0, values.indexOf(value)) * 44;
    if (Math.abs(node.scrollTop - top) > 1) node.scrollTop = top;
  }, [value, values.length]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const chooseAt = index => onChange(values[Math.max(0, Math.min(values.length - 1, index))]);
  return <div ref={ref} className="m-date-wheel" role="listbox" aria-label={label} aria-activedescendant={id + '-' + value} tabIndex={0}
    onScroll={e => { const index = Math.round(e.currentTarget.scrollTop / 44); clearTimeout(timer.current); timer.current = setTimeout(() => chooseAt(index), 100); }}
    onKeyDown={e => { const index = values.indexOf(value); if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); chooseAt(e.key === 'Home' ? 0 : e.key === 'End' ? values.length - 1 : index + (e.key === 'ArrowDown' ? 1 : -1)); } }}>
    {values.map(x => <button type="button" role="option" id={id + '-' + x} key={x} tabIndex={-1} aria-selected={x === value} onClick={() => { clearTimeout(timer.current); onChange(x); }}>{x}{label}</button>)}
  </div>;
}

export function DateSheet({ title, value, onChange: changeOriginal, onClose: closeOriginal, allowLong = false, allowClear = false }) {
  const onClose = () => runMotion(closeOriginal, 'sheet-close');
  const onChange = value => changeOriginal(value);
  const today = new Date();
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  const [date, setDate] = useState(parts);
  const days = new Date(date[0], date[1], 0).getDate();
  const wheels = useRef(null);
  const values = [Array.from({ length: 91 }, (_, i) => 1970 + i), Array.from({ length: 12 }, (_, i) => i + 1), Array.from({ length: days }, (_, i) => i + 1)];
  const confirm = () => {
    // 确认时读取可见滚动位置，避免快速滚动后立即确认取到上一次日期。
    const current = [...wheels.current.querySelectorAll('.m-date-wheel')].map((node, i) => values[i][Math.max(0, Math.min(values[i].length - 1, Math.round(node.scrollTop / 44)))]);
    current[2] = Math.min(current[2], new Date(current[0], current[1], 0).getDate());
    runMotion(() => { onChange(`${current[0]}-${String(current[1]).padStart(2, '0')}-${String(current[2]).padStart(2, '0')}`); closeOriginal(); }, 'sheet-close');
  };
  return <Overlay label={title} onClose={onClose} sheet><div className="m-date-picker"><PickerHeading title={title} /><p className="m-date-selection" aria-live="polite">{date[0]}年{date[1]}月{Math.min(date[2], days)}日</p><div className="m-date-columns" aria-hidden="true"><span>年</span><span>月</span><span>日</span></div><div ref={wheels} className="m-date-wheels" data-no-swipe>{values.map((items, i) => <DateWheel key={i} label={['年', '月', '日'][i]} values={items} value={Math.min(date[i], i === 2 ? days : date[i])} onChange={v => setDate(old => { const next = old.map((x, n) => n === i ? v : x); next[2] = Math.min(next[2], new Date(next[0], next[1], 0).getDate()); return next; })} />)}</div>{(allowLong || allowClear) && <div className="m-date-shortcuts">{allowLong && <button onClick={() => { onChange('长期'); onClose(); }}>长期</button>}{allowClear && <button onClick={() => { onChange(''); onClose(); }}>清空日期</button>}</div>}<div className="m-picker-actions"><button type="button" onClick={onClose}>取消</button><button type="button" className="primary" onClick={confirm}>确认</button></div></div></Overlay>;
}

export function OptionSheet({ title, options = [], value, onChange, onClose: closeOriginal, mode = 'immediate', searchable = false, clearable = true }) {
  const onClose = () => runMotion(closeOriginal, 'sheet-close');
  const choose = value => runMotion(() => { onChange(value); closeOriginal(); }, 'sheet-close');
  const [selected, setSelected] = useState(value || '');
  const [query, setQuery] = useState('');
  const matches = options.filter(x => x.includes(query.trim()));
  // 简单动作列表无需圆形标记；搜索目录或暂选确认式选择保留标记。
  const showSelection = searchable || mode === 'confirm';
  const clear = () => { if (mode === 'immediate') { choose(''); } else setSelected(''); };
  return <Overlay label={title} onClose={onClose} sheet><div className={'m-option-picker ' + (showSelection ? 'has-selection-marks' : 'is-simple') + (searchable ? ' is-searchable' : '')}><PickerHeading title={title} />{searchable && <SearchBox value={query} onChange={setQuery} placeholder={'搜索' + title} />}<div className="m-sheet-options">{matches.length ? matches.map(x => <button type="button" aria-pressed={x === selected} className={x === selected ? 'selected' : ''} key={x} onClick={() => { if (mode === 'immediate') { choose(x); } else setSelected(x); }}><span>{x}</span>{showSelection && <SelectionMark selected={x === selected} />}</button>) : <Empty search={!!query} text={query ? '暂无匹配选项' : '暂无可用选项'} />}</div><div className="m-picker-actions">{clearable && <button type="button" onClick={clear}>清空选择</button>}<button type="button" onClick={onClose}>取消</button>{mode === 'confirm' && <button type="button" className="primary" onClick={() => choose(selected)}>确认</button>}</div></div></Overlay>;
}

export function Header({ onBack, title = '供应商管理平台', close, hideBack = false, right }) {
  return <header className="m-header">{!hideBack && <button onClick={onBack} aria-label="返回"><ChevronLeft /></button>}<h1>{title}</h1>{right || (close && <button onClick={close} aria-label="关闭"><X /></button>)}</header>;
}


export function RegistrationSteps({ personal, step, expanded, onExpandedChange }) {
  const id = useId();
  const stages = personal ? [[0, '基本信息'], [2, '银行信息'], [3, '预览提交']] : [[0, '基本信息'], [1, '联系人信息'], [2, '银行信息'], [3, '预览提交']];
  const index = stages.findIndex(([value]) => value === step);
  return <nav className="m-registration-steps" aria-label="注册步骤" data-no-swipe>
    <button type="button" className="m-steps-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => onExpandedChange(!expanded)}>
      <span>第 {index + 1} / {stages.length} 步</span><strong>{stages[index][1]}</strong><span className="m-steps-disclosure">{expanded ? '收起步骤' : '全部步骤'}{expanded ? <ChevronUp /> : <ChevronDown />}</span>
    </button>
    <div id={id} className="m-registration-step-list" data-open={expanded} aria-hidden={!expanded} inert={!expanded ? true : undefined}>
      <div className="m-registration-step-list-inner"><ol>{stages.map(([value, title], i) => <li key={value} aria-current={value === step ? 'step' : undefined} className={value < step ? 'completed' : value === step ? 'current' : ''}>
        <span className="m-step-number">{value < step ? <Check aria-label="已完成" /> : i + 1}</span><span className="m-step-name">{title}</span><span className="m-step-state">{value < step ? '已完成' : value === step ? '当前步骤' : '待填写'}</span>
      </li>)}</ol></div>
    </div>
  </nav>;
}







