import React, { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, HelpCircle, Search, X } from 'lucide-react';
import { useBackLayer, rememberAttachment, attachmentFiles, attachmentName } from './mobile-interaction.jsx';

export function Section({ title, children, className = '', collapsible = true, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);
  useEffect(() => { const reveal = e => { if ([...ref.current.querySelectorAll('[data-field-label]')].some(n => e.detail.includes(n.dataset.fieldLabel))) setOpen(true); }; window.addEventListener('mobile-validation', reveal); return () => window.removeEventListener('mobile-validation', reveal); }, []);
  return <section ref={ref} className={`m-section ${className}`}>
    {title && <h2>{collapsible ? <button type="button" className="m-section-heading" onClick={() => setOpen(!open)} aria-expanded={open}><span className="m-collapse">{open ? <ChevronUp /> : <ChevronDown />}</span>{title}</button> : title}</h2>}
    <div className="m-section-content" hidden={!open}>{children}</div>
  </section>;
}

export function Row({ label, children, required = false, compact = false }) {
  return <div className={`m-row ${compact ? 'm-row-compact' : ''}`}><span className="m-label">{required && <em>*</em>}{label}</span><span className="m-value">{children}</span></div>;
}

const statusTone = {
  '草稿': 'neutral', '邀请中': 'info', '注册中': 'info',
  '审批中': 'warning', '待审批': 'warning', '变更中': 'warning',
  '已审批': 'success', '注册驳回': 'danger',
};
export function StatusTag({ value }) {
  return value ? <span className="m-status" data-tone={statusTone[value] || 'neutral'}>{value}</span> : <span>—</span>;
}

export function AppliedFilters({ filters, query, count, onEdit, onClear }) {
  const labels = { type: '供应商类型', status: '供应商状态', start: '邀请时间（起）', end: '邀请时间（止）', recommended: '供应商推荐', inviter: '邀请人' };
  const entries = Object.entries(filters).filter(([key, value]) => labels[key] && value);
  return <section className="m-applied-filters" aria-label="当前查询条件"><div className="m-filter-summary">{entries.length > 0 && <button onClick={onEdit}>已筛选 · {entries.length}项</button>}<span className="m-result-count" role="status">共 {count} 家供应商</span>{entries.length > 0 && <button onClick={onClear}>清除筛选</button>}</div><dl className="m-applied-conditions">{query && <div><dt>关键词</dt><dd>{query}</dd></div>}{entries.map(([key, value]) => <div key={key}><dt>{labels[key]}</dt><dd>{value}</dd></div>)}</dl></section>;
}

export function Field({ label, value = '', onChange, required = false, options, onPick, type = 'text', placeholder, maxLength, help, readOnly = false, multiline = false, error, inputMode, autoComplete, selectionMode = 'confirm', searchable = false, layout }) {
  const id = useId();
  const [validation, setValidation] = useState('');
  useEffect(() => {
    const show = e => { if (e.detail.includes(label) || (/邮箱/.test(label) && /邮箱/.test(e.detail))) setValidation(e.detail); };
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
  return <><div data-field-label={label} className={`m-field ${layout === 'inline' ? 'm-field-force-inline' : ''} ${multiline || label.length > 6 || /邮箱|账号|账户|银行|供应商名称|详细地址|合作事项/.test(label) ? 'm-field-stacked' : 'm-field-inline'} ${error ? 'has-error' : ''} ${multiline ? 'm-field-block' : ''}`}>
    <label htmlFor={id}>{required && <em>*</em>}{label}{help && <button type="button" className="m-help" aria-label={label + "填写说明"} onClick={() => setHelpOpen(true)}><HelpCircle /></button>}</label>
    <div className="m-field-control">
      {onPick ? <button aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} id={id} aria-label={label} type="button" className="m-select-field" onClick={onPick}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || `请选择${label}`}</span><ChevronRight /></button> : options ? <button aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} id={id} role="combobox" aria-label={label} aria-expanded={choosing} aria-haspopup="dialog" type="button" className="m-select-field" onClick={() => setChoosing(true)}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || `请选择${label}`}</span><ChevronRight /></button> : type === 'date' ? <button aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} id={id} aria-label={label} className="m-select-field" type="button" onClick={() => setDateOpen(true)}><span className={!value ? 'm-placeholder' : ''}>{value || '请选择日期'}</span><CalendarDays /></button> : multiline ? <textarea {...attrs} id={id} aria-label={label} value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder || `请输入${label}`} required={required} readOnly={readOnly} /> : <input {...attrs} id={id} aria-label={label} value={value} onChange={e => onChange?.(e.target.value)} type={type === 'password' && visiblePassword ? 'text' : type} maxLength={maxLength} placeholder={readOnly ? '' : placeholder || `请输入${label}`} required={required} readOnly={readOnly} />}
      {onChange && value && !readOnly && !options && !onPick && type !== 'date' && type !== 'password' && <button type="button" className="m-field-clear" aria-label={'清空' + label} onClick={() => { onChange(''); document.getElementById(id)?.focus(); }}><X /></button>}{type === 'password' && <button type="button" className="m-password-toggle" aria-label={visiblePassword ? "隐藏密码" : "显示密码"} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? "隐藏" : "显示"}</button>}{maxLength && !options && !onPick && <small className="m-counter">{value.length}/{maxLength}</small>}
    </div>{error && <p id={id + "-error"} className="m-field-error" role="alert">{error}</p>}
  </div>{helpOpen && <Overlay label={label + "填写说明"} onClose={() => setHelpOpen(false)}><h2>{label}</h2><p>{help}</p><div className="m-dialog-actions"><button onClick={() => setHelpOpen(false)}>知道了</button></div></Overlay>}{choosing && <OptionSheet title={label} options={options} value={value} onChange={onChange} onClose={() => setChoosing(false)} mode={selectionMode} searchable={searchable} />}{dateOpen && <DateSheet title={label} value={value} onChange={onChange} onClose={() => setDateOpen(false)} />}</>;
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
  return <div data-field-label={label} className="m-field m-upload-field"><label htmlFor={id}>{required && <em>*</em>}{label}{help && <button type="button" className="m-help" aria-label={label + "填写说明"} onClick={() => setHelpOpen(true)}><HelpCircle /></button>}</label><div className="m-field-control">
    <label className={`m-upload ${value ? 'has-file' : ''}`} htmlFor={id}>{preview ? <img src={preview} alt={attachmentName(value)} /> : value === '营业执照.jpg' ? <span className="m-license-plate"><img src="/mobile-assets/license-source.jpg" alt="营业执照" /></span> : value === '开户证明.png' ? <span className="m-proof-plate"><img src="/mobile-assets/bank-proof-source.jpg" alt="开户证明" /></span> : value ? <span>{attachmentName(value)}</span> : <Camera aria-hidden="true" />}<input id={id} type="file" aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} aria-label={label} onChange={e => { receiveFile(e.target.files[0]); e.target.value = '';  }} /></label>
    {value && <p className="m-attachment-name"><span>文件名：</span>{attachmentName(value)}</p>}<div className="m-upload-tools"><label htmlFor={id + '-camera'}>拍照<input id={id + '-camera'} type="file" accept="image/*" capture="environment" aria-label={'拍照上传' + label} onChange={e => { receiveFile(e.target.files[0]); e.target.value = ''; }} /></label><label htmlFor={id}>选择照片或文件</label>{preview && <button type="button" onClick={() => setPreviewOpen(true)}>预览</button>}</div>
    {previewOpen && <Overlay label="附件预览" onClose={() => setPreviewOpen(false)}><h2>{attachmentName(value)}</h2><a href={preview} target="_blank" rel="noreferrer"><img className="m-attachment-full" src={preview} alt={attachmentName(value)} /></a><div className="m-dialog-actions"><button onClick={() => setPreviewOpen(false)}>关闭</button></div></Overlay>}
    {value && <button type="button" className="m-upload-remove" aria-label={`移除${label}`} onClick={() => setRemoving(true)}><X /></button>}
  </div>{error && <p id={id + "-error"} className="m-field-error" role="alert">{error}</p>}{helpOpen && <Overlay label={label + "填写说明"} onClose={() => setHelpOpen(false)}><h2>{label}</h2><p>{help}</p><div className="m-dialog-actions"><button onClick={() => setHelpOpen(false)}>知道了</button></div></Overlay>}{removing && <Confirm text={"确认移除" + label + "？"} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setPreview(''); setRemoving(false); }} />}</div>;
}

export function SearchBox({ value, onChange, placeholder = '搜索供应商名称或邀请人', children }) {
  return <div className="m-search-row"><label className="m-search"><Search /><input aria-label={placeholder || '搜索供应商名称或邀请人'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button type="button" aria-label="清空搜索" onClick={() => onChange('')}><X /></button>}</label>{children}</div>;
}

export function Actions({ items, flat = false }) {
  return <footer className={`m-actions ${flat ? 'm-actions-flat' : ''}`}>{items.map((item, i) => <button key={`${item.label}-${i}`} type={item.type || 'button'} className={item.secondary ? 'secondary' : item.muted ? 'muted' : ''} disabled={item.disabled} onClick={item.onClick}>{item.label}</button>)}</footer>;
}

export function Empty({ text = '暂无数据', illustration = false }) {
  return <div className={`m-empty ${illustration ? 'm-empty-illustrated' : ''}`}>{illustration && <span className="m-empty-plate"><img src="/mobile-assets/empty-application-source.jpg" alt="" /></span>}{text}</div>;
}

export function Overlay({ children, label = '选择', onClose, sheet = false }) {
  const ref = useRef(null);
  useBackLayer(true, onClose);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const targets = () => [...ref.current.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(x => !x.disabled);
    const first = targets()[0];
    (first || ref.current).focus({ preventScroll: true });
    const onKey = e => {
      if (ref.current.closest('[inert]')) return;
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') { const items = targets(); const first = items[0], last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div className="m-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} tabIndex={-1} className={sheet ? 'm-sheet' : 'm-dialog'} role="dialog" aria-modal="true" aria-label={label}>{children}</div></div>;
}

export function Confirm({ text, onCancel, onConfirm, cancelLabel = '取消', confirmLabel = '确认', danger = false }) {
  return <Overlay label="提示" onClose={onCancel}><h2>提示</h2><p>{text}</p><div className="m-dialog-actions"><button onClick={onCancel}>{cancelLabel}</button><button className={danger ? 'm-action-danger' : undefined} onClick={onConfirm}>{confirmLabel}</button></div></Overlay>;
}

export function ScreenshotTip({ onClose }) {
  return <Overlay label="截屏提示" onClose={onClose}><div className="m-capture-tip"><span className="m-capture-plate"><img src="/mobile-assets/capture-notice-source.jpg" alt="截屏分享提醒" /></span><p>截屏已生效，分享需谨慎</p><button onClick={onClose}>知道了</button></div></Overlay>;
}

export function DateSheet({ title, value, onChange, onClose, allowLong = false }) {
  const today = new Date();
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  const [date, setDate] = useState(parts);
  const days = new Date(date[0], date[1], 0).getDate();
  const wheels = useRef(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      wheels.current?.querySelectorAll('select').forEach(select => {
        const height = select.options[select.selectedIndex]?.getBoundingClientRect().height;
        if (height) select.scrollTop = Math.max(0, (select.selectedIndex - 2) * height);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [date.join('-')]);
  return <Overlay label={title} onClose={onClose} sheet><div className="m-date-picker"><div className="m-picker-title"><button onClick={onClose}>取消</button><strong>{title}</strong><div>{allowLong && <button onClick={() => { onChange('长期'); onClose(); }}>长期</button>}<button onClick={() => { onChange(`${date[0]}-${String(date[1]).padStart(2, '0')}-${String(Math.min(date[2], days)).padStart(2, '0')}`); onClose(); }}>确认</button></div></div><p className="m-date-selection" aria-live="polite">{date[0]}年{date[1]}月{Math.min(date[2], days)}日</p><div ref={wheels} className="m-date-wheels">{[Array.from({ length: 91 }, (_, i) => 1970 + i), Array.from({ length: 12 }, (_, i) => i + 1), Array.from({ length: days }, (_, i) => i + 1)].map((values, i) => <select key={i} aria-label={['年', '月', '日'][i]} size={5} value={Math.min(date[i], i === 2 ? days : date[i])} onChange={e => setDate(date.map((x, n) => n === i ? Number(e.target.value) : x))}><option disabled value="spacer-start-a" aria-hidden="true"> </option><option disabled value="spacer-start-b" aria-hidden="true"> </option>{values.map(x => <option key={x} value={x}>{x}{['年', '月', '日'][i]}</option>)}<option disabled value="spacer-end-a" aria-hidden="true"> </option><option disabled value="spacer-end-b" aria-hidden="true"> </option></select>)}</div></div></Overlay>;
}

export function OptionSheet({ title, options = [], value, onChange, onClose, mode = 'confirm', searchable = false }) {
  const [selected, setSelected] = useState(value || '');
  const [query, setQuery] = useState('');
  const matches = options.filter(x => x.includes(query.trim()));
  return <Overlay label={title} onClose={onClose} sheet><div className={'m-picker-title ' + (mode === 'immediate' ? 'm-picker-immediate' : '')}><button onClick={onClose}>取消</button><strong>{title}</strong>{mode === 'confirm' && <button onClick={() => { onChange(selected); onClose(); }}>确认</button>}</div>{searchable && <SearchBox value={query} onChange={setQuery} placeholder={'搜索' + title} />}<div className="m-sheet-options">{matches.length ? matches.map(x => <button aria-pressed={x === selected} className={x === selected ? 'selected' : ''} key={x} onClick={() => { if (mode === 'immediate') { onChange(x); onClose(); } else setSelected(x); }}>{x}{x === selected && <Check />}</button>) : <Empty text={query ? '暂无匹配选项' : '暂无可用选项'} />}</div><button className="m-picker-clear" onClick={() => { if (mode === 'immediate') { onChange(''); onClose(); } else setSelected(''); }}>清空选择</button></Overlay>;
}

export function Header({ onBack, title = '供应商管理平台', close }) {
  return <header className="m-header"><button onClick={onBack} aria-label="返回"><ChevronLeft /></button><h1>{title}</h1>{close && <button onClick={close} aria-label="关闭"><X /></button>}</header>;
}


export function RegistrationSteps({ personal, step }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const stages = personal ? [[0, '基本信息'], [2, '银行信息'], [3, '预览提交']] : [[0, '基本信息'], [1, '联系人信息'], [2, '银行信息'], [3, '预览提交']];
  const index = stages.findIndex(([value]) => value === step);
  useEffect(() => setExpanded(false), [step]);
  return <nav className="m-registration-steps" aria-label="注册步骤" data-no-swipe>
    <button type="button" className="m-steps-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
      <span>第 {index + 1} / {stages.length} 步</span><strong>{stages[index][1]}</strong><span className="m-steps-disclosure">{expanded ? '收起步骤' : '全部步骤'}{expanded ? <ChevronUp /> : <ChevronDown />}</span>
    </button>
    <ol id={id} hidden={!expanded}>{stages.map(([value, title], i) => <li key={value} aria-current={value === step ? 'step' : undefined} className={value < step ? 'completed' : value === step ? 'current' : ''}>
      <span className="m-step-number">{value < step ? <Check aria-label="已完成" /> : i + 1}</span><span className="m-step-name">{title}</span><span className="m-step-state">{value < step ? '已完成' : value === step ? '当前步骤' : '待填写'}</span>
    </li>)}</ol>
  </nav>;
}

