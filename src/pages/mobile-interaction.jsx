import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Confirm } from './mobile-ui.jsx';

const InteractionContext = createContext(null);
export function InteractionProvider({ children }) {
  const forms = useRef(new Map());
  const layers = useRef([]);
  const [pending, setPending] = useState(null);
  const clean = id => { for (const [key, form] of forms.current) if (!id || key === id) form.initial = form.value; };
  const request = (action, id) => {
    const dirty = [...forms.current].some(([key, form]) => (!id || key === id) && form.active && form.value !== form.initial);
    if (dirty) setPending({ action, id }); else action();
  };
  const value = { forms, layers, clean, request };
  useEffect(() => {
    const handler = e => {
      if ([...forms.current.values()].some(f => f.active && f.value !== f.initial)) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => { window.removeEventListener('beforeunload', handler); for (const file of attachmentFiles.values()) URL.revokeObjectURL(file.url); attachmentFiles.clear(); };
  }, []);
  return <InteractionContext.Provider value={value}>{children}{pending && <Confirm unsaved text="本次修改尚未保存，离开后将丢失。" cancelLabel="继续编辑" confirmLabel="放弃修改" onCancel={() => setPending(null)} onConfirm={() => { clean(pending.id); const action = pending.action; setPending(null); action(); }} />}</InteractionContext.Provider>;
}
export const useInteraction = () => useContext(InteractionContext);
export function useDirtyForm(data, active = true) {
  const context = useInteraction();
  const id = useId();
  const serialized = JSON.stringify(data);
  const old = context.forms.current.get(id);
  context.forms.current.set(id, { initial: !old || !old.active ? serialized : old.initial, value: serialized, active });
  useEffect(() => () => context.forms.current.delete(id), [context.forms, id]);
  return { accept: () => context.clean(id), leave: action => context.request(action, id) };
}
export function useBackLayer(active, close) {
  const context = useInteraction();
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active) return;
    const entry = () => closeRef.current();
    context.layers.current.push(entry);
    return () => { context.layers.current = context.layers.current.filter(x => x !== entry); };
  }, [active, context.layers]);
}

// 在内容区判断滑动方向；控件、横向滚动区和屏幕边缘保留原手势。
export function SwipeArea({ active, count, onChange, children, className = '' }) {
  const start = useRef(null);
  const onStart = e => {
    const t = e.touches[0];
    const target = e.target;
    if (e.touches.length !== 1 || t.clientX < 24 || t.clientX > innerWidth - 24 || target.closest('input,textarea,select,button,a,label,[role="dialog"],.m-tabs,.m-table-scroll,[data-no-swipe]')) { start.current = null; return; }
    start.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };
  return <div className={'m-swipe-area ' + className} onTouchStart={onStart} onTouchEnd={e => {
    if (!start.current || e.changedTouches.length !== 1) return;
    const { x, y, time } = start.current; start.current = null;
    const dx = e.changedTouches[0].clientX - x, dy = e.changedTouches[0].clientY - y;
    if (Date.now() - time > 900 || Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const next = active + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < count) { e.stopPropagation(); onChange(next); }
  }} onTouchCancel={() => { start.current = null; }}>{children}</div>;
}
export const attachmentFiles = new Map();
export const attachmentName = key => attachmentFiles.get(key)?.name || key;
export function rememberAttachment(file) {
  const key = 'attachment:' + createSessionId();
  const entry = { key, url: URL.createObjectURL(file), type: file.type, name: file.name };
  attachmentFiles.set(key, entry);
  return entry;
}

// 独立填写页与嵌套弹层共用背景隔离，避免容器改为滑动区后背景仍可操作。
export function usePageIsolation() {
  useEffect(() => {
    let top = null;
    let changed = [];
    const restore = () => { changed.forEach(([node, inert, hidden]) => { node.inert = inert; hidden === null ? node.removeAttribute('aria-hidden') : node.setAttribute('aria-hidden', hidden); }); changed = []; };
    const focusable = root => [...root.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(n => !n.disabled && n.getClientRects().length && !n.closest('[inert]'));
    const update = () => {
      restore();
      const overlays = [...document.querySelectorAll('.m-overlay')];
      const panels = [...document.querySelectorAll('.m-fullscreen-panel')];
      const target = (overlays.length ? overlays : panels).filter(n => n.getClientRects().length).at(-1) || null;
      if (target) {
        let child = target;
        while (child.parentElement && child.parentElement !== document.body) {
          [...child.parentElement.children].filter(n => n !== child && n instanceof HTMLElement).forEach(n => { changed.push([n, n.inert, n.getAttribute('aria-hidden')]); n.inert = true; n.setAttribute('aria-hidden', 'true'); });
          child = child.parentElement;
        }
      }
      if (target !== top && target && !target.contains(document.activeElement)) focusable(target)[0]?.focus({ preventScroll: true });
      top = target;
    };
    const onKey = e => {
      if (!top || e.key !== 'Tab') return;
      const items = focusable(top), first = items[0], last = items.at(-1);
      if (e.shiftKey && (document.activeElement === first || !top.contains(document.activeElement))) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !top.contains(document.activeElement))) { e.preventDefault(); first?.focus(); }
    };
    const observer = new MutationObserver(update);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    update(); window.addEventListener('keydown', onKey);
    return () => { observer.disconnect(); restore(); window.removeEventListener('keydown', onKey); };
  }, []);
}


// 会话样本标识也支持本地HTTP预览，仍使用浏览器随机源。
export function createSessionId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
}
