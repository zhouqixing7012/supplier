import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import { Confirm } from '../components/mobile/dialogs.jsx';
import { attachmentFiles } from '../components/mobile/attachment-session.js';

import { runMotion, reducedMotion } from './mobile-motion.jsx';
import { swipeTarget, captureScrollPositions, restoreScrollPositions } from './mobile-motion.js';

import { InteractionContext } from './mobile-context.js';
export { useBackLayer } from './mobile-context.js';
export { attachmentFiles, attachmentName, createSessionId, rememberAttachment } from '../components/mobile/attachment-session.js';
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

// 在内容区判断滑动方向；控件、横向滚动区和屏幕边缘保留原手势。
export function SwipeArea({ active, count, onChange, children, className = '' }) {
  const ref = useRef(null);
  const config = useRef({ active, count, onChange });
  config.current = { active, count, onChange };
  useEffect(() => {
    const node = ref.current;
    let start = null, visual = null, dragNode = null, nav = null, bounce = null;
    const restore = () => { if (bounce) { bounce.onfinish = null; bounce.cancel(); bounce = null; } visual?.remove(); visual = null; dragNode?.classList.remove('m-swipe-dragging'); dragNode = null; if (nav) { nav.style.removeProperty('--m-gesture-x'); nav.style.removeProperty('--m-gesture-width'); nav.classList.remove('m-gesture-tabs'); nav = null; } };
    const begin = event => {
      restore(); start = null;
      const point = event.touches[0], box = node.closest('.mobile-page').getBoundingClientRect();
      if (event.touches.length !== 1 || point.clientX < box.left + 24 || point.clientX > box.right - 24 || event.target.closest('input,textarea,select,button,a,label,[role="dialog"],.m-tabs,.m-table-scroll,[data-no-swipe]')) return;
      if (event.target.closest('.m-swipe-area') !== node) return;
      start = { x: point.clientX, y: point.clientY, time: Date.now(), horizontal: false };
    };
    const move = event => {
      if (event.touches.length !== 1) { start = null; restore(); return; }
      if (!start) return;
      const dx = event.touches[0].clientX - start.x, dy = event.touches[0].clientY - start.y;
      if (!start.horizontal && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { start = null; restore(); return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
      start.horizontal = true; event.preventDefault();
      if (reducedMotion()) return;
      if (!visual) {
        const box = node.getBoundingClientRect();
        visual = node.cloneNode(true); visual.classList.add('m-swipe-visual'); visual.setAttribute('aria-hidden', 'true'); visual.inert = true;
        const scrollPositions = captureScrollPositions(node, visual);
        visual.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
        visual.querySelectorAll('[data-motion-named]').forEach(n => { n.style.viewTransitionName = 'none'; n.removeAttribute('data-motion-named'); });
        visual.querySelectorAll('.m-actions,.m-batch-actions,.m-bottom-nav,.m-fab-group,.m-overlay,.m-fullscreen-panel').forEach(n => n.remove());
        visual.querySelectorAll('.m-tab-bar').forEach(n => { n.style.visibility = 'hidden'; });
        Object.assign(visual.style, { position: 'fixed', left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', margin: '0', pointerEvents: 'none', zIndex: '40' });
        node.closest('.mobile-page').appendChild(visual); restoreScrollPositions(scrollPositions); dragNode = node; node.classList.add('m-swipe-dragging');
        nav = [...node.closest('.mobile-page').querySelectorAll('.m-tabs')].at(-1);
      }
      const { active, count } = config.current;
      const edge = (dx > 0 && active === 0) || (dx < 0 && active === count - 1);
      visual.style.transform = `translateX(${Math.max(-node.clientWidth * .6, Math.min(node.clientWidth * .6, dx * (edge ? .18 : 1)))}px)`;
      if (nav) {
        const buttons = [...nav.querySelectorAll('button')], current = buttons[active], next = buttons[active + (dx < 0 ? 1 : -1)];
        if (current && next) { const progress = Math.min(Math.abs(dx) / node.clientWidth, 1); nav.classList.add('m-gesture-tabs'); nav.style.setProperty('--m-gesture-x', current.offsetLeft + (next.offsetLeft - current.offsetLeft) * progress + 'px'); nav.style.setProperty('--m-gesture-width', current.offsetWidth + (next.offsetWidth - current.offsetWidth) * progress + 'px'); }
      }
    };
    const end = event => {
      if (!start) return;
      const origin = start; start = null;
      const point = event.changedTouches[0];
      const { active, count, onChange } = config.current;
      const next = point ? swipeTarget(active, count, point.clientX - origin.x, point.clientY - origin.y, Date.now() - origin.time) : active;
      if (next !== active) { event.stopPropagation(); restore(); runMotion(() => onChange(next), next > active ? 'swipe-next' : 'swipe-prev'); }
      else if (visual && !reducedMotion() && visual.animate) { const current = visual; bounce = current.animate([{ transform: current.style.transform }, { transform: 'translateX(0)' }], { duration: 180, easing: 'ease-out' }); bounce.onfinish = () => { if (visual === current) restore(); }; }
      else restore();
    };
    const cancel = () => { start = null; restore(); };
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => { if (preference.matches) cancel(); };
    preference.addEventListener('change', stopMotion);
    node.addEventListener('touchstart', begin, { passive: true }); node.addEventListener('touchmove', move, { passive: false }); node.addEventListener('touchend', end); node.addEventListener('touchcancel', cancel);
    return () => { cancel(); preference.removeEventListener('change', stopMotion); node.removeEventListener('touchstart', begin); node.removeEventListener('touchmove', move); node.removeEventListener('touchend', end); node.removeEventListener('touchcancel', cancel); };
  }, [active]);
  return <div ref={ref} className={'m-swipe-area ' + className}>{children}</div>;
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
