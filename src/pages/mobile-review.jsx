import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, Download, MapPin, MessageSquarePlus, Pencil, Upload, X } from 'lucide-react';
import { Confirm, Field, Overlay, PickerHeading } from './mobile-ui.jsx';
import { createSessionId } from './mobile-interaction.jsx';
import { REVIEW_STORAGE_KEY, REVIEW_VERSION, reviewDefinitions, reviewSelectors, validateReviewImport } from './mobile-review-data.js';
import './mobile-review.css';

const visible = element => !!element?.isConnected && !element.closest('[inert], [hidden], [data-review-ui]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
function clippedBox(element) {
  const box = element.getBoundingClientRect();
  let top = Math.max(0, box.top), bottom = Math.min(innerHeight, box.bottom);
  let left = Math.max(0, box.left), right = Math.min(innerWidth, box.right);
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
    if (/auto|scroll|hidden|clip/.test(style.overflowY)) { top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom); }
    if (/auto|scroll|hidden|clip/.test(style.overflowX)) { left = Math.max(left, bounds.left); right = Math.min(right, bounds.right); }
  }
  return bottom > top && right > left ? { top, bottom, left, right } : null;
}
function activeLayer(root) {
  return [...root.querySelectorAll('.m-fullscreen-panel, .m-overlay [role="dialog"]')].filter(element => visible(element) && !element.querySelector('[data-review-ui]')).at(-1) || root;
}
function contextOf(element) {
  const card = element.closest('article, .m-bank-card, .m-supplier-card, .m-record-card');
  return card?.querySelector('h3')?.textContent.trim() || '';
}
function elementTarget(element) {
  const field = element.closest('[data-field-label]');
  if (field) return { kind: 'element', type: 'field', label: field.dataset.fieldLabel, context: contextOf(field) };
  const action = element.closest('button');
  if (action) return { kind: 'element', type: 'action', label: action.getAttribute('aria-label') || action.textContent.trim(), context: contextOf(action) };
  const group = element.closest('article, section, .m-reference-card, .m-field');
  const title = group?.querySelector('h2,h3')?.textContent.trim();
  return title ? { kind: 'element', type: 'group', label: title, context: contextOf(group) } : null;
}
function resolve(root, target) {
  const layer = activeLayer(root);
  if (target.kind === 'component') { const matches = [...layer.querySelectorAll(reviewSelectors[target.key])].filter(element => visible(element) && !(target.key === 'empty' && element.closest('.m-record-collection'))); return matches.find(element => clippedBox(element)) || matches[0] || null; }
  const selector = target.type === 'field' ? '[data-field-label]' : target.type === 'action' ? 'button' : 'article, section, .m-reference-card, .m-field';
  const matches = [...layer.querySelectorAll(selector)].filter(element => {
    if (!visible(element) || contextOf(element) !== target.context) return false;
    const label = target.type === 'field' ? element.dataset.fieldLabel : target.type === 'action' ? element.getAttribute('aria-label') || element.textContent.trim() : element.querySelector('h2,h3')?.textContent.trim();
    return label === target.label;
  });
  // 无法唯一定位时不把标注悄悄贴到另一条记录上。
  return matches.length === 1 ? matches[0] : null;
}
function readLocal() {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    return { notes: raw ? validateReviewImport(JSON.parse(raw)) : [], error: '' };
  } catch { return { notes: [], error: '本机标注读取失败。原数据未覆盖，可导入有效标注文件后恢复。' }; }
}
export function PrototypeReview({ route, scope }) {
  const [stored] = useState(readLocal);
  const [custom, setCustom] = useState(stored.notes);
  const [error, setError] = useState(stored.error);
  const [notice, setNotice] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [picking, setPicking] = useState(false);
  const [panel, setPanel] = useState(null);
  const [activeId, setActiveId] = useState('');
  const [positions, setPositions] = useState([]);
  const [draft, setDraft] = useState(null);
  const [initialDraft, setInitialDraft] = useState('');
  const [leaving, setLeaving] = useState(false);
  const leaveAction = useRef(null);
  const importInput = useRef(null);
  const anchors = useRef(new Map());
  const root = () => document.querySelector('#root .mobile-page');
  const notes = useMemo(() => {
    const base = reviewDefinitions.map(([key, , title, body, doc]) => ({ id: scope + ':base:' + key, scope, title, body, target: { kind: 'component', key }, source: '已确认', doc }));
    const map = new Map(base.map(note => [note.id, note]));
    custom.filter(note => note.scope === scope).forEach(note => map.set(note.id, note));
    return [...map.values()];
  }, [scope, custom]);
  const selected = notes.find(note => note.id === activeId) || notes.find(note => positions.some(position => position.id === note.id));
  const selectedPosition = positions.find(position => position.id === selected?.id);
  const dirty = panel === 'edit' && JSON.stringify(draft) !== initialDraft;
  const leave = action => { if (dirty) { leaveAction.current = action; setLeaving(true); } else action(); };
  const closePanel = () => leave(() => setPanel(null));
  useEffect(() => { setPanel(null); setPicking(false); setActiveId(''); setNotice(''); }, [route]);
  useEffect(() => {
    if (!enabled) { setPositions([]); anchors.current.clear(); return; }
    // 详情面板会隔离底层业务页，保留打开前的锚点，不把隔离误判成需求消失。
    if (panel) return;
    const page = root();
    if (!page) return;
    let frame = null;
    let settleUntil = 0;
    const update = () => {
      frame = null;
      const pageBox = page.getBoundingClientRect();
      anchors.current.clear();
      const next = notes.flatMap(note => {
        const element = resolve(page, note.target);
        if (!element) return [];
        anchors.current.set(note.id, element);
        const box = clippedBox(element);
        if (!box) return [];
        const { top, bottom } = box;
        return [{ id: note.id, x: Math.max(0, Math.min(innerWidth - 44, innerWidth >= 1050 ? pageBox.right + 2 : Math.min(box.right - 22, pageBox.right - 44))), y: Math.max(48, Math.min(innerHeight - 132, top + 4)), anchorX: box.right - 4, anchorY: top + Math.min(24, (bottom - top) / 2), pageRight: pageBox.right }];
      });
      const order = [...anchors.current.entries()].sort(([, a], [, b]) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      next.forEach(position => { position.number = order.findIndex(([id]) => id === position.id) + 1; });
      next.sort((a, b) => a.y - b.y);
      let previous = -44;
      next.forEach(position => { position.y = Math.max(position.y, previous + 44); previous = position.y; });
      setPositions(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
      // WAAPI入场只改变几何，不触发DOM变更；短时间跟随到动效结束，避免首次打开没有标注点。
      if (performance.now() < settleUntil) frame = requestAnimationFrame(update);
    };
    const schedule = () => { settleUntil = performance.now() + 300; if (frame === null) frame = requestAnimationFrame(update); };
    schedule();
    const observer = new MutationObserver(mutations => { if (mutations.some(mutation => !mutation.target.closest?.('[data-review-ui]'))) schedule(); });
    observer.observe(page, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'aria-expanded'] });
    const resize = new ResizeObserver(schedule); resize.observe(page);
    window.addEventListener('scroll', schedule, true); window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); resize.disconnect(); window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule); if (frame !== null) cancelAnimationFrame(frame); };
  }, [enabled, notes, route, panel]);
  useEffect(() => {
    if (!enabled || !picking) return;
    const page = root();
    const pick = event => {
      if (event.target.closest('[data-review-ui]')) return;
      event.preventDefault(); event.stopPropagation();
      const target = elementTarget(event.target);
      if (!target || !resolve(page, target)) { setError('该位置无法唯一定位，请点击具体字段、按钮或有标题的卡片。'); return; }
      const note = { id: scope + ':note:' + createSessionId(), scope, title: target.label, body: '', target, source: '评审批注', doc: '' };
      anchors.current.set(note.id, resolve(page, target));
      setDraft(note); setInitialDraft(JSON.stringify(note)); setPicking(false); setPanel('edit'); setError('');
    };
    page.addEventListener('click', pick, true);
    return () => page.removeEventListener('click', pick, true);
  }, [enabled, picking, scope]);
  const persist = next => {
    try { localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({ version: REVIEW_VERSION, notes: next })); }
    catch { setError('标注未保存：浏览器存储不可用或空间不足。请先导出当前标注。'); return false; }
    setCustom(next); setError(''); return true;
  };
  const edit = note => { setDraft({ ...note }); setInitialDraft(JSON.stringify(note)); setPanel('edit'); };
  const save = () => {
    let entry;
    try { [entry] = validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...draft, source: '评审批注', updatedAt: new Date().toISOString() }] }); }
    catch (exception) { setError(exception.message); return; }
    if (persist([...custom.filter(note => note.id !== entry.id), entry])) { setActiveId(entry.id); setPanel('list'); }
  };
  const locate = note => {
    const element = anchors.current.get(note.id)?.isConnected ? anchors.current.get(note.id) : root() && resolve(root(), note.target);
    if (!element) return setError('当前页面未显示该位置，请先打开对应页签或弹层。');
    setActiveId(note.id); setPanel(null); element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  };
  const exportNotes = () => {
    const map = new Map(custom.map(note => [note.id, note]));
    notes.filter(note => root() && resolve(root(), note.target)).forEach(note => map.set(note.id, note));
    const blob = new Blob([JSON.stringify({ version: REVIEW_VERSION, notes: [...map.values()] }, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'supplier-review.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importNotes = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setNotice('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('标注文件不能超过2MB');
      const imported = validateReviewImport(JSON.parse(await file.text()));
      const map = new Map(custom.map(note => [note.id, note])); imported.forEach(note => map.set(note.id, note)); if (persist([...map.values()])) setNotice('已导入' + imported.length + '条标注，按对应页面展示。');
    } catch (exception) { setError('导入失败：' + exception.message); }
  };
  const shown = enabled ? notes.filter(note => panel ? anchors.current.get(note.id)?.isConnected : root() && resolve(root(), note.target)) : [];
  const locals = custom.filter(note => note.scope === scope && !shown.some(item => item.id === note.id));
  const calloutLeft = selectedPosition ? Math.min(innerWidth - 300, selectedPosition.pageRight + 72) : 0;
  const calloutTop = selectedPosition ? Math.max(170, Math.min(innerHeight - 300, selectedPosition.y)) : 0;
  return <>
    {createPortal(<div data-review-ui data-panel={!!panel} className="m-review-controls"><button type="button" className={'m-review-switch ' + (enabled ? 'is-on' : '')} role="switch" aria-checked={enabled} aria-label="需求评审" onClick={() => leave(() => { setEnabled(!enabled); setPanel(null); setPicking(false); })}><ClipboardList aria-hidden="true" /><span>需求评审</span><i aria-hidden="true" /></button>{enabled && <div className="m-review-tools"><button type="button" onClick={() => { setPicking(false); setPanel('list'); }}><MapPin />查看标注</button><button type="button" aria-pressed={picking} onClick={() => { setPanel(null); setPicking(!picking); }}><MessageSquarePlus />{picking ? '取消选点' : '新增标注'}</button><button type="button" onClick={exportNotes}><Download />导出</button><button type="button" onClick={() => importInput.current?.click()}><Upload />导入</button><input ref={importInput} hidden type="file" accept="application/json,.json" onChange={importNotes} /></div>}{enabled && picking && <p className="m-review-pick-hint" role="status">点击字段、按钮或卡片添加标注</p>}{enabled && notice && !panel && <p className="m-review-pick-hint" role="status">{notice}</p>}{enabled && error && !panel && <p className="m-review-error" role="alert">{error}</p>}</div>, document.body)}
    {enabled && !panel && !picking && createPortal(<div data-review-ui className="m-review-marks">{positions.filter(position => position.y < innerHeight - 100).map(position => <button key={position.id} type="button" className={'m-review-pin ' + (selected?.id === position.id ? 'active' : '')} style={{ left: position.x, top: position.y }} aria-label={'需求标注：' + notes.find(note => note.id === position.id)?.title} onClick={() => { setActiveId(position.id); setPanel('list'); }}><span>{position.number}</span></button>)}{selected && selectedPosition && <><svg className="m-review-connector" aria-hidden="true"><defs><marker id="review-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#f50000" /></marker></defs><path d={`M${calloutLeft},${calloutTop + 18} L${selectedPosition.anchorX + 30},${calloutTop + 18} L${selectedPosition.anchorX},${selectedPosition.anchorY}`} fill="none" stroke="#f50000" strokeWidth="1.5" markerEnd="url(#review-arrow)" /></svg><aside className="m-review-callout" style={{ left: calloutLeft, top: calloutTop }}><strong>{selected.title}</strong><p>{selected.body}</p><button type="button" onClick={() => edit(selected)}>编辑标注</button></aside></>}</div>, document.body)}
    {enabled && panel && <Overlay sheet label={panel === 'edit' ? '编辑需求标注' : '需求标注'} onClose={closePanel}><div data-review-ui className="m-review-panel"><div className="m-review-panel-heading"><PickerHeading title={panel === 'edit' ? '编辑需求标注' : '需求标注'} /><button type="button" aria-label="关闭需求标注" onClick={closePanel}><X /></button></div>{error && <p className="m-review-error" role="alert">{error}</p>}{panel === 'edit' ? <><Field label="标注标题" required value={draft.title} maxLength={100} onChange={title => setDraft({ ...draft, title })} /><Field label="需求详情" required multiline maxLength={4000} value={draft.body} onChange={body => setDraft({ ...draft, body })} /><p className="m-review-storage-note">保存至此浏览器。导出标注文件可交给其他评审人；修改不会写入正式PRD。</p><div className="m-picker-actions"><button type="button" onClick={() => leave(() => setPanel('list'))}>返回标注列表</button><button type="button" className="primary" onClick={save}>保存标注</button></div></> : <><p className="m-review-scope">当前页面 · {shown.length} 条可定位标注</p><div className="m-review-note-list">{[...shown, ...locals].map(note => <button key={note.id} type="button" aria-pressed={selected?.id === note.id} onClick={() => setActiveId(note.id)}><span>{note.title}</span><small>{shown.some(item => item.id === note.id) ? note.source : '当前页面未显示'}</small></button>)}</div>{selected && <article className="m-review-note-detail"><h3>{selected.title}</h3><p>{selected.body}</p><small>{selected.source}</small>{selected.doc && <a href={'https://github.com/zhouqixing7012/supplier/blob/main/' + selected.doc} target="_blank" rel="noreferrer">查看对应文档</a>}<div className="m-picker-actions"><button type="button" onClick={() => locate(selected)}><MapPin />定位到原型</button><button type="button" className="primary" onClick={() => edit(selected)}><Pencil />编辑详情</button></div></article>}{!shown.length && !locals.length && <p className="m-review-storage-note">当前页面暂无标注，可关闭面板后使用新增标注。</p>}</>}</div></Overlay>}
    {leaving && <Confirm unsaved confirmLabel="放弃修改" cancelLabel="继续编辑" text="本次标注尚未保存，是否放弃修改？" onCancel={() => setLeaving(false)} onConfirm={() => { setLeaving(false); leaveAction.current?.(); leaveAction.current = null; }} />}
  </>;
}
