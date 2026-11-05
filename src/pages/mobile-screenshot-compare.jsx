import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { screenshotScenes } from './mobile-data.js';
import { matchScreenshots } from './mobile-screenshot-match.js';
import './mobile-screenshot-compare.css';

// 由 Vite 打包仓库内的原始截图，开发和生产环境共用同一资源映射。
const originalScreenshots = Object.fromEntries(
  Object.entries(import.meta.glob('../../docs/screenshot/*.jpg', {
    eager: true, query: '?url', import: 'default',
  })).map(([path, url]) => [path.split('/').pop(), url])
);

const visible = element => element && element.getClientRects().length > 0 && !element.closest('[inert], [hidden], [data-review-ui], [data-motion-clone]');

// 组件内部选择器、详情页签没有独立路由，读取当前可见层补足上下文。
function visibleScene() {
  const root = document.querySelector('#root .mobile-page');
  if (!root) return null;
  const dialogs = [...root.querySelectorAll('[role="dialog"], .m-fullscreen-panel')].filter(visible);
  const layer = dialogs.at(-1);
  const label = layer?.getAttribute('aria-label') || layer?.querySelector('h1, .m-picker-title')?.textContent.trim();
  if (label === '开户银行') return ['bank-select'];
  if (label === '银行分行') return ['branch-select'];
  if (label === '所属部门') return ['department'];
  if (layer?.querySelector('.m-reference-confirm')) {
    const query = layer.querySelector('input[type="search"], .m-search input')?.value || '';
    return [query ? 'people' : 'people-empty'];
  }
  if ([...root.querySelectorAll('.m-region-panel')].some(visible)) return ['region'];
  const detail = root.querySelector('.m-detail');
  if (visible(detail)) {
    const active = detail.querySelector('[aria-selected="true"], [aria-current="page"], .m-tabs .active');
    if (active?.textContent.includes('银行')) return ['detail-bank'];
    if (active?.textContent.includes('审批')) return ['detail-approval-empty'];
    return []; // 新增详情页签没有对应历史截图。
  }
  return null;
}

export function ScreenshotCompare({ state }) {
  const [enabled, setEnabled] = useState(false);
  const [layerScenes, setLayerScenes] = useState(null);
  const [manual, setManual] = useState('');
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState('fit');
  const scroll = useRef(null);
  const switchRef = useRef(null);
  useLayoutEffect(() => {
    document.body.classList.toggle('m-screenshot-comparing', enabled);
    return () => document.body.classList.remove('m-screenshot-comparing');
  }, [enabled]);
  useLayoutEffect(() => {
    if (!enabled) return;
    let frame;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = visibleScene();
        setLayerScenes(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
      });
    };
    refresh();
    const root = document.querySelector('#root .mobile-page');
    const observer = new MutationObserver(refresh);
    if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'aria-current', 'inert', 'hidden'] });
    root?.addEventListener('input', refresh);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); root?.removeEventListener('input', refresh); };
  }, [enabled, state]);
  const automatic = useMemo(() => layerScenes === null ? matchScreenshots(state)
    : screenshotScenes.filter(shot => layerScenes.includes(shot.scene)), [state, layerScenes]);
  const key = automatic.map(shot => shot.time).join(',');
  useEffect(() => { setManual(''); }, [key]);
  const selected = automatic.find(shot => shot.time === manual) || automatic[0];
  const src = selected ? originalScreenshots[selected.filename] : '';
  useEffect(() => { setFailed(false); if (scroll.current) scroll.current.scrollTop = 0; }, [src]);
  const close = () => { setEnabled(false); switchRef.current?.focus(); };
  return createPortal(<div data-review-ui className="m-screenshot-tools">
    <button ref={switchRef} type="button" className="m-screenshot-toggle" role="switch" aria-checked={enabled} aria-controls="original-screenshot-panel" onClick={() => setEnabled(value => !value)}>原图对照 <span>{enabled ? '开' : '关'}</span></button>
    {enabled && <>
      <div className="m-screenshot-settings">
        {automatic.length > 0 ? <label>对应截图<select aria-label="选择当前页面对应截图" value={selected?.time || ''} onChange={event => setManual(event.target.value)}>{automatic.map(shot => <option key={shot.time} value={shot.time}>{shot.index}. {shot.title}</option>)}</select></label> : <p>当前页面或状态暂无对应的历史截图。</p>}
        {selected && <><small className="m-screenshot-filename">{selected.filename}</small><label>缩放<select aria-label="原图缩放" value={zoom} onChange={event => setZoom(event.target.value === 'fit' ? 'fit' : Number(event.target.value))}><option value="fit">与原型等宽</option>{[10, 25, 33, 50, 75, 100, 150, 200].map(value => <option key={value} value={value}>{value}%</option>)}</select></label></>}
        <small className="m-screenshot-source-note">已接入 {Object.keys(originalScreenshots).length}/47 张原图</small>
      </div>
      <div className="m-prototype-caption" aria-hidden="true">当前原型</div>
      <aside id="original-screenshot-panel" className="m-screenshot-panel" aria-label="当前页面原始截图">
      <header><strong>原始截图</strong><button type="button" onClick={close} aria-label="关闭原图对照">关闭</button></header>
      <div ref={scroll} className="m-screenshot-scroll">
        {selected && src && !failed && <img key={src} src={src} alt={selected.title + '的原始截图'} style={{ width: zoom === 'fit' ? '100%' : zoom + '%', maxWidth: 'none' }} onError={() => setFailed(true)} />}
        {selected && (failed || !src) && <p role="status">原图加载失败，请刷新页面重试。</p>}
      </div>
    </aside></>}
  </div>, document.body);
}
