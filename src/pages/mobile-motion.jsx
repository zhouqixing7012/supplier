import React, { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

let committing = false;
const running = new Set();
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function play(node, frames, duration, cleanup = () => {}) {
  const animation = node.animate(frames, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
  const stop = () => { animation.cancel(); cleanup(); running.delete(stop); };
  running.add(stop); animation.onfinish = stop;
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
  frame.dataset.motionScroll = String(node.scrollTop);
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
// 先同步更新真实界面，视觉副本仅负责过渡；副本不接受点击、焦点或业务事件。
export function runMotion(update, kind = 'fade') {
  if (committing) return update();
  for (const stop of [...running]) stop();
  document.documentElement.dataset.mobileMotion = kind;
  const enabled = !reducedMotion() && !!Element.prototype.animate && !document.querySelector('.m-shot');
  const oldScope = scope();
  const oldOverlay = [...document.querySelectorAll('.m-overlay')].at(-1);
  const oldPanel = oldOverlay?.firstElementChild;
  const shade = enabled && oldOverlay ? document.createElement('div') : null;
  if (shade) { shade.setAttribute('aria-hidden', 'true'); Object.assign(shade.style, { position: 'fixed', inset: '0', background: getComputedStyle(oldOverlay).backgroundColor, zIndex: '54', pointerEvents: 'none' }); }
  const before = kind === 'record' && enabled ? records().map(item => ({ ...item, snapshot: item.box.bottom > 0 && item.box.top < innerHeight ? ghost(item.node) : null })) : [];
  const old = enabled && kind !== 'record' ? ghost(kind === 'sheet-close' ? oldPanel : oldScope) : null;
  const removedPanels = enabled && kind === 'record' ? ghost(oldPanel) : null;
  const oldBatch = enabled && kind === 'record' ? ghost(document.querySelector('.m-batch-actions')) : null;
  committing = true;
  try { flushSync(update); } finally { committing = false; }
  if (!enabled) return;
  const show = (node, frames, duration) => { if (node) { document.body.appendChild(node); if (node.firstElementChild?.firstElementChild) node.firstElementChild.firstElementChild.scrollTop = Number(node.dataset.motionScroll || 0); play(node.firstElementChild || node, frames, duration, () => node.remove()); } };
  if (shade) show(shade, [{ opacity: 1 }, { opacity: 0 }], 180);
  if (kind === 'sheet-close') {
    show(old, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${old?.dataset.motionHeight || 0}px)` }], 180); return;
  }
  if (kind === 'record') {
    const after = records(); const keys = new Set(after.map(item => item.key));
    for (const item of after) {
      const previous = before.find(entry => entry.key === item.key);
      if (previous) {
        const dx = previous.box.left - item.box.left, dy = previous.box.top - item.box.top;
        if (dx || dy) play(item.node, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], 200);
      } else play(item.node, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], 200);
    }
    for (const item of before) if (!keys.has(item.key) && item.box.bottom > 0 && item.box.top < innerHeight) show(item.snapshot, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], 200);
    show(removedPanels, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(24px)' }], 180);
    if (!document.querySelector('.m-batch-actions')) show(oldBatch, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(60px)' }], 180);
    return;
  }
  const nextScope = scope(), next = ghost(nextScope);
  const width = Math.min(430, innerWidth);
  const backwards = kind === 'back' || kind === 'tab-prev';
  const tab = kind.startsWith('tab-');
  const distance = kind === 'fade' ? 0 : tab ? 32 : width;
  const duration = kind === 'fade' ? 150 : tab ? 200 : 240;
  // 标题、页签、固定按钮保留真实显示；其余内容的透明度过渡不改变固定定位参照。
  const blocks = [...(nextScope?.querySelectorAll('.m-section,.m-supplier-card,.m-detail-summary,.m-search-row,.m-applied-filters,.m-portal-home-group,.m-portal-home-identity') || [])];
  blocks.filter(n => !n.parentElement.closest('.m-section,.m-supplier-card,.m-detail-summary,.m-portal-home-group')).forEach(node => play(node, [{ opacity: .1 }, { opacity: 1 }], duration));
  show(old, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${backwards ? distance : -distance * .18}px)` }], duration);
  show(next, [{ opacity: kind === 'fade' ? 0 : .7, transform: `translateX(${backwards ? -distance * .18 : distance}px)` }, { opacity: 1, transform: 'translateX(0)' }], duration);
}
export function useMotionStructure(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const observer = new MutationObserver(records => {
      if (reducedMotion() || !Element.prototype.animate || running.size) return;
      const hasAdded = records.some(record => [...record.addedNodes].some(n => n.nodeType === 1 && n.matches?.('.m-bank-card,.m-contact-summary')));
      if (hasAdded) root.querySelectorAll('.m-bank-card,.m-contact-summary').forEach(node => {
        if (!node.dataset.motionSeen) { node.dataset.motionSeen = ''; node.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
      });
    });
    root.querySelectorAll('.m-bank-card,.m-contact-summary').forEach(node => { node.dataset.motionSeen = ''; });
    observer.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); for (const stop of [...running]) stop(); };
  }, [ref]);
}
export function MotionDetails({ children, className = '' }) {
  const ref = useRef(null);
  const animation = useRef(null);
  useEffect(() => () => animation.current?.cancel(), []);
  const toggle = event => {
    event.preventDefault();
    const node = ref.current;
    const height = node.getBoundingClientRect().height;
    const closing = node.dataset.expanded === 'true';
    animation.current?.cancel();
    node.dataset.expanded = String(!closing);
    if (reducedMotion() || !node.animate) { node.open = !closing; return; }
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
