import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, HelpCircle, Search, X } from 'lucide-react';

export function Section({ title, children, className = '', collapsible = true }) {
  const [open, setOpen] = useState(true);
  return <section className={`m-section ${className}`}>
    {title && <h2>{collapsible ? <button type="button" className="m-section-heading" onClick={() => setOpen(!open)} aria-expanded={open}><span className="m-collapse">{open ? <ChevronUp /> : <ChevronDown />}</span>{title}</button> : title}</h2>}
    {open && children}
  </section>;
}

export function Row({ label, children, required = false, compact = false }) {
  return <div className={`m-row ${compact ? 'm-row-compact' : ''}`}><span className="m-label">{required && <em>*</em>}{label}</span><span className="m-value">{children}</span></div>;
}

export function Field({ label, value = '', onChange, required = false, options, onPick, type = 'text', placeholder, maxLength, help, readOnly = false, multiline = false }) {
  const id = useId();
  const [choosing, setChoosing] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  return <><div className={`m-field ${multiline ? 'm-field-block' : ''}`}>
    <label htmlFor={id}>{required && <em>*</em>}{label}{help && <span className="m-help" title={help} tabIndex={0} aria-label={help}><HelpCircle /></span>}</label>
    <div className="m-field-control">
      {onPick ? <button id={id} aria-label={label} type="button" className="m-select-field" onClick={onPick}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || `请选择${label}`}</span><ChevronRight /></button> : options ? <button id={id} role="combobox" aria-label={label} aria-expanded={choosing} aria-haspopup="dialog" type="button" className="m-select-field" onClick={() => setChoosing(true)}><span className={!value ? 'm-placeholder' : ''}>{value || placeholder || `请选择${label}`}</span><ChevronRight /></button> : type === 'date' ? <button id={id} aria-label={label} className="m-select-field" type="button" onClick={() => setDateOpen(true)}><span className={!value ? 'm-placeholder' : ''}>{value || '请选择日期'}</span><ChevronDown /></button> : multiline ? <textarea id={id} aria-label={label} value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder || `请输入${label}`} required={required} readOnly={readOnly} /> : <input id={id} aria-label={label} value={value} onChange={e => onChange?.(e.target.value)} type={type} maxLength={maxLength} placeholder={readOnly ? '' : placeholder || `请输入${label}`} required={required} readOnly={readOnly} />}
      {maxLength && !options && !onPick && <small className="m-counter">{value.length}/{maxLength}</small>}
    </div>
  </div>{choosing && <OptionSheet title={label} options={options} value={value} onChange={onChange} onClose={() => setChoosing(false)} />}{dateOpen && <DateSheet title={label} value={value} onChange={onChange} onClose={() => setDateOpen(false)} />}</>;
}

export function UploadField({ label, required, value, onChange, help }) {
  const id = useId();
  const [preview, setPreview] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <div className="m-field m-upload-field"><label htmlFor={id}>{required && <em>*</em>}{label}{help && <span className="m-help" title={help}><HelpCircle /></span>}</label><div className="m-field-control">
    <label className={`m-upload ${value ? 'has-file' : ''}`} htmlFor={id}>{preview ? <img src={preview} alt={value} /> : value === '营业执照.jpg' ? <span className="m-license-plate"><img src="/mobile-assets/license-source.jpg" alt="营业执照" /></span> : value === '开户证明.png' ? <span className="m-proof-plate"><img src="/mobile-assets/bank-proof-source.jpg" alt="开户证明" /></span> : value ? <span>{value}</span> : <Camera aria-hidden="true" />}<input id={id} type="file" aria-label={label} onChange={e => { const file = e.target.files[0]; if (file) { onChange(file.name); setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : ''); } }} /></label>
    {value && <button type="button" className="m-upload-remove" aria-label={`移除${label}`} onClick={() => { onChange(''); setPreview(''); }}><X /></button>}
  </div></div>;
}

export function SearchBox({ value, onChange, placeholder = '', children }) {
  return <div className="m-search-row"><label className="m-search"><Search /><input aria-label={placeholder || '搜索供应商名称或邀请人'} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button type="button" aria-label="清空搜索" onClick={() => onChange('')}><X /></button>}</label>{children}</div>;
}

export function Actions({ items, flat = false }) {
  return <footer className={`m-actions ${flat ? 'm-actions-flat' : ''}`}>{items.map((item, i) => <button key={`${item.label}-${i}`} type={item.type || 'button'} className={item.secondary ? 'secondary' : item.muted ? 'muted' : ''} disabled={item.disabled} onClick={item.onClick}>{item.label}</button>)}</footer>;
}

export function Empty({ text = '没有查询到相关数据', illustration = false }) {
  return <div className={`m-empty ${illustration ? 'm-empty-illustrated' : ''}`}>{illustration && <span className="m-empty-plate"><img src="/mobile-assets/empty-application-source.jpg" alt="" /></span>}{text}</div>;
}

export function Overlay({ children, label = '选择', onClose, sheet = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const targets = () => [...ref.current.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(x => !x.disabled);
    ref.current.focus({ preventScroll: true });
    const onKey = e => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') { const items = targets(); const first = items[0], last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return <div className="m-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} tabIndex={-1} className={sheet ? 'm-sheet' : 'm-dialog'} role="dialog" aria-modal="true" aria-label={label}>{children}</div></div>;
}

export function Confirm({ text, onCancel, onConfirm }) {
  return <Overlay label="提示" onClose={onCancel}><h2>提示</h2><p>{text}</p><div className="m-dialog-actions"><button onClick={onCancel}>取消</button><button onClick={onConfirm}>确认</button></div></Overlay>;
}

export function ScreenshotTip({ onClose }) {
  return <Overlay label="截屏提示" onClose={onClose}><div className="m-capture-tip"><span className="m-capture-plate"><img src="/mobile-assets/capture-notice-source.jpg" alt="截屏分享提醒" /></span><p>截屏已生效，分享需谨慎</p><button onClick={onClose}>知道了</button></div></Overlay>;
}

export function DateSheet({ title, value, onChange, onClose, allowLong = false }) {
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : [2026, 10, 14];
  const [date, setDate] = useState(parts);
  const days = new Date(date[0], date[1], 0).getDate();
  return <Overlay label={title} onClose={onClose} sheet><div className="m-picker-title"><button onClick={onClose}>取消</button><strong>{title}</strong><div>{allowLong && <button onClick={() => { onChange('长期'); onClose(); }}>长期</button>}<button onClick={() => { onChange(`${date[0]}-${String(date[1]).padStart(2, '0')}-${String(Math.min(date[2], days)).padStart(2, '0')}`); onClose(); }}>确认</button></div></div><div className="m-date-wheels">{[Array.from({ length: 91 }, (_, i) => 1970 + i), Array.from({ length: 12 }, (_, i) => i + 1), Array.from({ length: days }, (_, i) => i + 1)].map((values, i) => <select key={i} aria-label={['年', '月', '日'][i]} size={5} value={Math.min(date[i], i === 2 ? days : date[i])} onChange={e => setDate(date.map((x, n) => n === i ? Number(e.target.value) : x))}>{values.map(x => <option key={x} value={x}>{x}{['年', '月', '日'][i]}</option>)}</select>)}</div></Overlay>;
}

export function OptionSheet({ title, options = [], value, onChange, onClose }) {
  const [selected, setSelected] = useState(value || '');
  const [query, setQuery] = useState('');
  const matches = options.filter(x => x.includes(query.trim()));
  return <Overlay label={title} onClose={onClose} sheet><div className="m-picker-title"><button onClick={onClose}>取消</button><strong>{title}</strong><button onClick={() => { onChange(selected); onClose(); }}>确认</button></div><SearchBox value={query} onChange={setQuery} placeholder={'搜索' + title} /><div className="m-sheet-options">{matches.length ? matches.map(x => <button aria-pressed={x === selected} className={x === selected ? 'selected' : ''} key={x} onClick={() => setSelected(x)}>{x}{x === selected && <Check />}</button>) : <Empty />}</div><button className="m-picker-clear" onClick={() => setSelected('')}>清空选择</button></Overlay>;
}

export function Header({ onBack, title = '供应商管理平台', close }) {
  return <header className="m-header"><button onClick={onBack} aria-label="返回"><ChevronLeft /></button><h1>{title}</h1>{close && <button onClick={close} aria-label="关闭"><X /></button>}</header>;
}
