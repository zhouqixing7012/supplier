import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { screenshotScenes } from './mobile-data.js';
import { matchScreenshots, screenshotFromFilename } from './mobile-screenshot-match.js';
import './mobile-screenshot-compare.css';

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
  const [files, setFiles] = useState({});
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(100);
  const input = useRef(null);
  const urls = useRef(new Map());
  const scroll = useRef(null);
  const switchRef = useRef(null);
  useEffect(() => () => urls.current.forEach(url => URL.revokeObjectURL(url)), []);
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
  const src = selected ? files[selected.time] || '/mobile-assets/original-screenshots/' + selected.filename : '';
  useEffect(() => { setFailed(false); setZoom(100); if (scroll.current) scroll.current.scrollTop = 0; }, [src]);
  const importImages = event => {
    const chosen = [...event.target.files]; event.target.value = '';
    let count = 0;
    const next = {};
    for (const file of chosen) {
      const shot = screenshotFromFilename(file.name);
      if (!shot || !/^image\/(jpeg|png|webp)$/.test(file.type)) continue;
      const previous = urls.current.get(shot.time);
      if (previous) URL.revokeObjectURL(previous);
      const url = URL.createObjectURL(file);
      urls.current.set(shot.time, url); next[shot.time] = url; count++;
    }
    setFiles(old => ({ ...old, ...next }));
    setMessage(count ? '已载入' + count + '张原图，本次打开期间可用。' : '未匹配到原图，请选择保留原文件名的截图。');
  };
  const close = () => { setEnabled(false); switchRef.current?.focus(); };
  return createPortal(<div data-review-ui className="m-screenshot-tools">
    <button ref={switchRef} type="button" className="m-screenshot-toggle" role="switch" aria-checked={enabled} aria-controls="original-screenshot-panel" onClick={() => setEnabled(value => !value)}>原图对照 <span>{enabled ? '开' : '关'}</span></button>
    {enabled && <aside id="original-screenshot-panel" className="m-screenshot-panel" aria-label="当前页面原始截图">
      <header><strong>原图对照</strong><button type="button" onClick={close} aria-label="关闭原图对照">关闭</button></header>
      <div className="m-screenshot-settings">
        {automatic.length > 0 ? <label>对应截图<select aria-label="选择当前页面对应截图" value={selected?.time || ''} onChange={event => setManual(event.target.value)}>{automatic.map(shot => <option key={shot.time} value={shot.time}>{shot.index}. {shot.title}</option>)}</select></label> : <p>当前页面或状态暂无对应的历史截图。</p>}
        {selected && <><small>{selected.filename}</small><label>缩放<select aria-label="原图缩放" value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[100, 150, 200].map(value => <option key={value} value={value}>{value}%</option>)}</select></label></>}
        <button type="button" onClick={() => input.current?.click()}>批量载入原始截图</button>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={importImages} />
        <small>已载入 {Object.keys(files).length}/47 张。原图用于对照历史页面。</small>
        {message && <p role="status">{message}</p>}
      </div>
      <div ref={scroll} className="m-screenshot-scroll">
        {selected && !failed && <img key={src} src={src} alt={selected.title + '的原始截图'} style={{ width: zoom + '%', maxWidth: 'none' }} onError={() => setFailed(true)} />}
        {selected && failed && <p role="status">尚未载入这张原图。请批量选择47张原始截图，系统会按文件名匹配。</p>}
      </div>
    </aside>}
  </div>, document.body);
}
