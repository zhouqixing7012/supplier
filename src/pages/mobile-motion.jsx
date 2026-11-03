import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { resolveMotion, captureScrollPositions, restoreScrollPositions } from './mobile-motion.js';

let transaction = null;
const scrollCopies = new WeakMap();
const running = new Set();
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function play(node, frames, duration, cleanup = () => {}) {
  const animation = node.animate(frames, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
  const stop = () => { animation.cancel(); cleanup(); running.delete(stop); };
  running.add(stop); animation.onfinish = stop;
  return stop;
}
function ghost(node) {
  if (!node) return null;
  const bounds = node.getBoundingClientRect();
  const frame = document.createElement('div');
  frame.className = 'mobile-page m-motion-ghost'; frame.inert = true; frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, { position: 'fixed', left: bounds.left + 'px', top: '0px', width: bounds.width + 'px', height: '100dvh', minHeight: '0', margin: '0', padding: '0', background: 'transparent', pointerEvents: 'none', zIndex: '55', overflow: 'hidden' });
  const header = node.querySelector('.m-header');
  const footer = [...node.querySelectorAll('.m-actions,.m-bottom-nav,.m-batch-actions')].at(-1);
  const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const bottom = footer ? Math.max(0, innerHeight - footer.getBoundingClientRect().top) : 0;
  frame.style.clipPath = `inset(${top}px 0 ${bottom}px 0)`;
  const copy = node.cloneNode(true);
  frame.dataset.motionHeight = String(bounds.height);
  scrollCopies.set(frame, captureScrollPositions(node, copy));
  copy.classList.remove('m-fullscreen-panel', 'm-overlay');
  copy.removeAttribute('role'); copy.removeAttribute('aria-modal');
  copy.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  copy.removeAttribute('id');
  copy.querySelectorAll('[data-motion-named]').forEach(n => { n.style.viewTransitionName = 'none'; n.removeAttribute('data-motion-named'); });
  copy.querySelectorAll('.m-actions,.m-batch-actions,.m-bottom-nav,.m-fab-group,.m-overlay,.m-fullscreen-panel').forEach(n => n.remove());
  copy.querySelectorAll('.m-header,.m-tab-bar').forEach(n => { n.style.visibility = 'hidden'; });
  Object.assign(copy.style, { position: 'absolute', left: '0', top: bounds.top + 'px', right: 'auto', bottom: 'auto', width: bounds.width + 'px', margin: '0', transform: 'none', translate: 'none', animation: 'none', height: node.matches('.mobile-page') ? 'auto' : bounds.height + 'px', overflowY: node.scrollHeight > bounds.height ? 'auto' : 'visible', background: node.matches('.mobile-page') ? 'transparent' : getComputedStyle(node).backgroundColor });
  const mover = document.createElement('div');
  Object.assign(mover.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  mover.appendChild(copy); frame.appendChild(mover); return frame;
}
const scope = () => [...document.querySelectorAll('.m-fullscreen-panel')].filter(n => !n.closest('[inert]')).at(-1) || document.querySelector('.mobile-page');
const records = () => [...document.querySelectorAll('[data-motion-key]')].filter(node => !node.closest('.m-motion-ghost')).map(node => ({ node, key: node.dataset.motionKey, box: node.getBoundingClientRect() }));
function revealCard(node) {
  const height = node.getBoundingClientRect().height;
  const style = getComputedStyle(node), overflow = node.style.overflow;
  const full = { height: height + 'px', opacity: 1 };
  const small = { height: '0px', opacity: 0 };
  for (const key of ['paddingTop', 'paddingBottom', 'marginTop', 'marginBottom', 'borderTopWidth', 'borderBottomWidth']) { full[key] = style[key]; small[key] = '0px'; }
  node.dataset.motionSeen = '';
  node.style.overflow = 'hidden';
  play(node, [small, full], 200, () => { node.style.overflow = overflow; });
}
function moveRecords(before) {
  const after = records(), keys = new Set(after.map(item => item.key));
  const added = after.filter(item => !before.some(entry => entry.key === item.key));
  for (const item of after) {
    const previous = before.find(entry => entry.key === item.key);
    if (!previous) revealCard(item.node);
    else if (!added.length) {
      const dx = previous.box.left - item.box.left, dy = previous.box.top - item.box.top;
      if (dx || dy) play(item.node, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], 200);
    }
  }
  for (const item of before) if (!keys.has(item.key) && item.snapshot) {
    const frame = item.snapshot, copy = frame.firstElementChild.firstElementChild;
    document.body.appendChild(frame); restoreScrollPositions(scrollCopies.get(frame) || []);
    copy.style.overflow = 'hidden';
    play(copy, [{ height: item.box.height + 'px', opacity: 1 }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', opacity: 0 }], 200, () => frame.remove());
  }
}
// 局部全屏层也使用与页面路由相同的进退，不延迟保存或取消。
export function usePanelState(initial = false) {
  const [value, setValue] = useState(initial);
  const current = useRef(value); current.current = value;
  const change = next => {
    const resolved = typeof next === 'function' ? next(current.current) : next;
    if (Object.is(resolved, current.current)) return;
    runMotion(() => setValue(resolved), resolved === null || resolved === false ? 'back' : 'forward');
  };
  return [value, change];
}
// 直接关闭弹层的旧入口也保留退出效果；事务已经处理时不重复播放。
export function useOverlayExit(ref) {
  useLayoutEffect(() => () => {
    if (transaction || reducedMotion() || !Element.prototype.animate || document.querySelector('.m-shot')) return;
    const node = ref.current, page = node?.closest('.mobile-page');
    const snapshot = ghost(node);
    const shade = document.createElement('div');
    shade.setAttribute('aria-hidden', 'true'); shade.inert = true;
    Object.assign(shade.style, { position: 'fixed', inset: '0', background: node ? getComputedStyle(node.parentElement).backgroundColor : 'transparent', zIndex: '54', pointerEvents: 'none' });
    queueMicrotask(() => {
      if (!snapshot || !page?.isConnected) return;
      document.body.appendChild(shade); play(shade, [{ opacity: 1 }, { opacity: 0 }], 180, () => shade.remove());
      document.body.appendChild(snapshot); restoreScrollPositions(scrollCopies.get(snapshot) || []);
      play(snapshot.firstElementChild, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${snapshot.dataset.motionHeight}px)` }], 180, () => snapshot.remove());
    });
  }, [ref]);
}
export function MotionPresence({ show, children, className = '', compact = false, as: Tag = 'span', ...props }) {
  const [present, setPresent] = useState(show);
  const ref = useRef(null), content = useRef(children);
  if (show) content.current = children;
  useLayoutEffect(() => {
    const node = ref.current;
    if (show) setPresent(true);
    if (!node) return;
    const finish = () => { if (!show) setPresent(false); };
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !node.animate || node.closest('.m-shot')) { finish(); return; }
    const visible = { opacity: 1 }, hidden = { opacity: 0 };
    if (compact) { visible.width = node.scrollWidth + 'px'; hidden.width = '0px'; }
    const animation = node.animate(show ? [hidden, visible] : [visible, hidden], { duration: compact ? 180 : 150, easing: 'cubic-bezier(.2,.8,.2,1)' });
    animation.onfinish = finish;
    const stop = () => { if (preference.matches) { animation.cancel(); finish(); } };
    preference.addEventListener('change', stop);
    return () => { animation.onfinish = null; animation.cancel(); preference.removeEventListener('change', stop); };
  }, [show, compact]);
  if (!show && !present) return null;
  return <Tag ref={ref} {...props} className={className} inert={!show} aria-hidden={!show || undefined}>{content.current}</Tag>;
}
// 先同步更新真实界面，视觉副本仅负责过渡；副本不接受点击、焦点或业务事件。
export function runMotion(update, kind = 'fade') {
  if (transaction) {
    const resolved = resolveMotion(transaction.kind, kind);
    if (resolved !== transaction.kind && !transaction.page) transaction.page = transaction.enabled ? ghost(transaction.scope) : null;
    transaction.kind = resolved;
    return update();
  }
  for (const stop of [...running]) stop();
  document.documentElement.dataset.mobileMotion = kind;
  const enabled = !reducedMotion() && !!Element.prototype.animate && !document.querySelector('.m-shot');
  const oldScope = scope();
  const oldOverlay = [...document.querySelectorAll('.m-overlay')].at(-1);
  const oldPanel = oldOverlay?.firstElementChild;
  const shade = enabled && oldOverlay ? document.createElement('div') : null;
  if (shade) { shade.setAttribute('aria-hidden', 'true'); Object.assign(shade.style, { position: 'fixed', inset: '0', background: getComputedStyle(oldOverlay).backgroundColor, zIndex: '54', pointerEvents: 'none' }); }
  const trackRecords = kind === 'record' || (kind === 'back' && oldScope?.matches('.m-fullscreen-panel'));
  const before = trackRecords && enabled ? records().map(item => ({ ...item, snapshot: item.box.bottom > 0 && item.box.top < innerHeight ? ghost(item.node) : null })) : [];
  const old = enabled && kind !== 'record' ? ghost(kind === 'sheet-close' ? oldPanel : oldScope) : null;
  const removedPanels = enabled && kind === 'record' ? ghost(oldPanel) : null;
  const oldBatch = enabled && kind === 'record' ? ghost(document.querySelector('.m-batch-actions')) : null;
  const current = { kind, enabled, scope: oldScope, page: null };
  transaction = current;
  try { flushSync(update); } finally { transaction = null; }
  const originalKind = kind;
  kind = current.kind;
  document.documentElement.dataset.mobileMotion = kind;
  if (!enabled) return;
  const show = (node, frames, duration) => { if (node) { document.body.appendChild(node); restoreScrollPositions(scrollCopies.get(node) || []); play(node.firstElementChild || node, frames, duration, () => node.remove()); } };
  if (shade) show(shade, [{ opacity: 1 }, { opacity: 0 }], 180);
  if (kind === 'sheet-close') {
    show(old, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${old?.dataset.motionHeight || 0}px)` }], 180); return;
  }
  if (kind === 'record') {
    moveRecords(before);
    show(removedPanels, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(24px)' }], 180);
    if (!document.querySelector('.m-batch-actions')) show(oldBatch, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(60px)' }], 180);
    return;
  }
  const localReturn = kind === 'back' && oldScope?.matches('.m-fullscreen-panel');
  const nextScope = scope(), next = localReturn ? null : ghost(nextScope);
  if (trackRecords) moveRecords(before);
  const width = Math.min(430, innerWidth);
  const backwards = kind === 'back' || kind === 'tab-prev' || kind === 'swipe-prev';
  const tab = kind.startsWith('tab-') || kind.startsWith('swipe-');
  const distance = kind === 'fade' ? 0 : tab ? 32 : width;
  const duration = kind === 'fade' ? 150 : kind.startsWith('swipe-') ? 180 : tab ? 200 : 240;
  // 标题、页签、固定按钮保留真实显示；其余内容的透明度过渡不改变固定定位参照。
  const blocks = localReturn ? [] : [...(nextScope?.querySelectorAll('.m-section,.m-supplier-card,.m-detail-summary,.m-search-row,.m-applied-filters,.m-portal-home-group,.m-portal-home-identity') || [])];
  blocks.filter(n => !n.parentElement.closest('.m-section,.m-supplier-card,.m-detail-summary,.m-portal-home-group')).forEach(node => play(node, [{ opacity: .1 }, { opacity: 1 }], duration));
  if (originalKind === 'sheet-close' || originalKind === 'record') show(originalKind === 'sheet-close' ? old : removedPanels, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(24px)' }], 180);
  show(current.page || old, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${backwards ? distance : -distance * .18}px)` }], duration);
  show(next, [{ opacity: kind === 'fade' ? 0 : .7, transform: `translateX(${backwards ? -distance * .18 : distance}px)` }, { opacity: 1, transform: 'translateX(0)' }], duration);
}
export function useMotionStructure(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => { if (preference.matches) for (const stop of [...running]) stop(); };
    preference.addEventListener('change', stopMotion);
    const observer = new MutationObserver(() => {
      const animate = !preference.matches && Element.prototype.animate && !running.size;
      root.querySelectorAll('.m-bank-card,.m-contact-summary').forEach(node => {
        if (node.hasAttribute('data-motion-seen')) return;
        node.dataset.motionSeen = '';
        if (animate) revealCard(node);
      });
    });
    root.querySelectorAll('.m-bank-card,.m-contact-summary').forEach(node => { node.dataset.motionSeen = ''; });
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); preference.removeEventListener('change', stopMotion); for (const stop of [...running]) stop(); };
  }, [ref]);
}
export function MotionDetails({ children, className = '' }) {
  const ref = useRef(null);
  const animation = useRef(null);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => {
      if (!preference.matches || !ref.current) return;
      animation.current?.cancel(); animation.current = null;
      ref.current.open = ref.current.dataset.expanded === 'true'; ref.current.style.overflow = '';
    };
    preference.addEventListener('change', stop);
    return () => { preference.removeEventListener('change', stop); animation.current?.cancel(); };
  }, []);
  const toggle = event => {
    event.preventDefault();
    const node = ref.current;
    const height = node.getBoundingClientRect().height;
    const closing = node.dataset.expanded === 'true';
    animation.current?.cancel();
    node.dataset.expanded = String(!closing);
    if (reducedMotion() || !node.animate) { node.open = !closing; node.style.overflow = ''; animation.current = null; return; }
    node.open = true;
    const style = getComputedStyle(node);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const target = (closing ? node.querySelector('summary').getBoundingClientRect().height : node.scrollHeight) + border;
    node.style.overflow = 'hidden';
    animation.current = node.animate([{ height: height + 'px' }, { height: target + 'px' }], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
    animation.current.onfinish = () => { node.open = !closing; node.style.overflow = ''; animation.current = null; };
  };
  const [summary, ...body] = React.Children.toArray(children);
  return <details ref={ref} className={className} data-expanded="false">{React.cloneElement(summary, { onClick: toggle })}{body}</details>;
}

