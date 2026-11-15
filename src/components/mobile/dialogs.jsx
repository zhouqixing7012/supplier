import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { useBackLayer } from '../../pages/mobile-context.js';
import { runMotion, useOverlayExit } from '../../pages/mobile-motion.jsx';

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

export function Confirm({ text, onCancel: cancelOriginal, onConfirm: confirmOriginal, cancelLabel = '取消', confirmLabel = '确认', danger = false, unsaved = false, title, className = '' }) {
  const onCancel = () => runMotion(cancelOriginal, 'sheet-close');
  const onConfirm = () => runMotion(confirmOriginal, 'record');
  const heading = title || (unsaved ? '离开编辑？' : '提示');
  const primaryCancel = unsaved;
  return <Overlay label={heading} onClose={onCancel}><div className={'m-decision-confirm ' + className}><h2>{heading}</h2><p>{text}</p><div className="m-decision-actions">
    <button type="button" className="m-discard-button" data-initial-focus={danger ? true : undefined} onClick={primaryCancel ? onConfirm : onCancel}>{primaryCancel ? confirmLabel : cancelLabel}</button>
    <button type="button" className={'m-continue-button' + (danger ? ' m-action-danger' : '')} data-initial-focus={primaryCancel || !danger ? true : undefined} onClick={primaryCancel ? onCancel : onConfirm}>{primaryCancel ? cancelLabel : confirmLabel}</button>
  </div></div></Overlay>;
}

export function PickerHeading({ title }) {
  return <div className="m-picker-title m-common-picker-heading"><strong>{title}</strong></div>;
}

export function SelectionMark({ selected }) {
  return <span className="m-option-radio" data-selected={selected || undefined} aria-hidden="true">{selected && <Check />}</span>;
}
