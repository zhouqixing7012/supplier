import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronUp, Plus, X } from 'lucide-react';
import { Empty } from './feedback.jsx';
import { Checkbox } from './fields.jsx';

export function Section({ title, children, className = '', collapsible = true, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);
  useEffect(() => {
    const reveal = ({ detail }) => { if (ref.current?.contains(detail.target)) setOpen(true); };
    window.addEventListener('mobile-validation', reveal);
    return () => window.removeEventListener('mobile-validation', reveal);
  }, []);
  return <section ref={ref} className={`m-section ${className}`}>
    {title && <h2>{collapsible ? <button type="button" className="m-section-heading" onClick={() => setOpen(!open)} aria-expanded={open}><span className="m-collapse">{open ? <ChevronUp /> : <ChevronDown />}</span>{title}</button> : title}</h2>}
    {collapsible ? <div className="m-section-reveal" data-open={open} inert={!open ? true : undefined}><div className="m-section-content">{children}</div></div> : <div className="m-section-content">{children}</div>}
  </section>;
}

export function Row({ label, children, required = false, compact = false }) {
  return <div className={`m-row ${compact ? 'm-row-compact' : ''}`}><span className="m-label">{required && <em>*</em>}{label}</span><span className="m-value">{children}</span></div>;
}

export function Header({ onBack, title, close, hideBack = false, right }) {
  return <header className="m-header">{!hideBack && <button type="button" onClick={onBack} aria-label="返回"><ChevronLeft /></button>}<h1>{title}</h1>{right || (close && <button type="button" onClick={close} aria-label="关闭"><X /></button>)}</header>;
}

export function RecordCollection({ title, count = 0, emptyText, addLabel, onAdd, children, className = '', showTitle = true }) {
  return <section className={'m-record-collection ' + className} aria-label={showTitle ? undefined : title}>
    {(showTitle || onAdd) && <div className="m-record-collection-header">
      {showTitle && <h2 className="m-record-collection-title">{title}</h2>}
      {onAdd && <button type="button" className="m-record-add" data-field-label={addLabel || '添加' + title} aria-label={addLabel || '添加' + title} onClick={onAdd}><Plus aria-hidden="true" /><span>添加</span></button>}
    </div>}
    {count ? children : <div className="m-record-empty-card"><Empty text={emptyText || '暂无' + title} /></div>}
  </section>;
}

export function RecordCard({ title, children, motionKey, status }) {
  return <article className="m-record-card" data-motion-key={motionKey}><div className="m-record-card-heading"><h3>{title}</h3>{status}</div><div className="m-record-card-body">{children}</div></article>;
}

export function CardActions({ children, split = false }) {
  return <div className={'m-card-actions' + (split ? ' m-card-actions-split' : '')}>{children}</div>;
}

export function BatchActions({ selectedCount, selectableCount, onSelectAll, items, className = '' }) {
  return <footer className={`m-batch-actions ${className}`}>
    {onSelectAll && <Checkbox label="全选当前结果" disabled={!selectableCount}
      checked={selectableCount > 0 && selectedCount === selectableCount} onChange={onSelectAll}>全选</Checkbox>}
    <span aria-live="polite">已选 {selectedCount} 项</span>
    <div className="m-batch-buttons">
      {items.map(({ label, onClick, danger }) => <button key={label} type="button" disabled={!selectedCount}
        className={danger ? 'm-action-danger' : undefined} onClick={onClick}>{label}</button>)}
    </div>
  </footer>;
}

export function Actions({ items, flat = false, className = '' }) {
  const primary = items.reduce((index, item, i) => !item.secondary && !item.muted && (items.length === 1 || !/^(取消|返回|关闭|上一步|重置|保存草稿|继续修改)/.test(item.label)) ? i : index, -1);
  return <footer className={`m-actions ${flat ? 'm-actions-flat' : ''} ${className}`}>{items.map((item, i) => <button key={`${item.label}-${i}`} type={item.type || 'button'} className={item.secondary ? 'secondary' : item.muted ? 'muted' : item.primary || i === primary ? 'primary' : 'secondary'} disabled={item.disabled} onClick={item.onClick}>{item.icon}{item.label}</button>)}</footer>;
}

export function FullscreenPanel({ title, label = title, onBack, className, children }) {
  return <div className={className ? 'm-fullscreen-panel ' + className : 'm-fullscreen-panel'}
    role="dialog" aria-modal="true" aria-label={label}>
    {title && <Header title={title} onBack={onBack} />}
    {children}
  </div>;
}
