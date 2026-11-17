import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Maximize2, Minus, Network, Plus, Scan } from 'lucide-react';
import mobilePrdUrl from '../../docs/supplier-mobile-prd.md?url';
import './mobile-page-map.css';

import { pageMap, previewSize } from './mobile-page-map-data.js';
import { offlinePrototype, readMobileSearch } from './mobile-prototype-runtime.js';
import { MobileMapPrint } from './mobile-page-map-print.jsx';

export function readPageMapParams(route) {
  const params = new URLSearchParams((route ? route.split('?')[1] : readMobileSearch()));
  return params.get('map') === '1' ? Object.fromEntries(params) : {};
}

const NODE_WIDTH = previewSize.width + 16;
const NODE_HEIGHT = previewSize.height + 72;
const LEVEL_GAP = NODE_WIDTH + 80;
const ROW_GAP = NODE_HEIGHT + 44;
const MIN_SCALE = 0.04;
const MAX_SCALE = 2;
const clampScale = value => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
const initialExpanded = () => new Set(['0', '1']);

function layoutMap(expanded) {
  const nodes = [];
  const edges = [];
  pageMap.forEach((root, index) => {
    const side = index === 0 ? -1 : 1;
    const start = nodes.length;
    let row = 0;
    function place(item, id, depth) {
      const x = side * (334 + depth * LEVEL_GAP);
      const children = expanded.has(id) ? item.children.map((child, i) => place(child, id + '.' + i, depth + 1)) : [];
      const y = children.length ? (children[0].y + children.at(-1).y) / 2 : row++ * ROW_GAP;
      const placed = { item, id, x, y, side, depth };
      nodes.push(placed);
      children.forEach(child => edges.push({ from: placed, to: child, side }));
      return placed;
    }
    const parent = place(root, String(index), 0);
    const offset = parent.y;
    nodes.slice(start).forEach(node => { node.y -= offset; });
    edges.push({ from: { x: 0, y: 0, width: 164 }, to: parent, side });
  });
  return { nodes, edges };
}

function edgePath({ from, to, side }) {
  const x1 = from.x + side * (from.width ?? NODE_WIDTH) / 2;
  const x2 = to.x - side * NODE_WIDTH / 2;
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${from.y} H ${mid} V ${to.y} H ${x2}`;
}

function fitCamera(viewport, nodes, overview = false) {
  const left = Math.min(...nodes.map(node => node.x)) - NODE_WIDTH / 2;
  const right = Math.max(...nodes.map(node => node.x)) + NODE_WIDTH / 2;
  const top = Math.min(...nodes.map(node => node.y)) - NODE_HEIGHT / 2;
  const bottom = Math.max(...nodes.map(node => node.y)) + NODE_HEIGHT / 2;
  const { clientWidth: width, clientHeight: height } = viewport;
  const fit = Math.min((width - 48) / (right - left), (height - 106) / (bottom - top), 1);
  const scale = clampScale(overview ? Math.max(0.18, fit) : fit);
  return { scale, x: width / 2 - (left + right) / 2 * scale, y: (height - 42) / 2 - (top + bottom) / 2 * scale };
}

function pointerCenter(points) {
  const [first, second] = points.values();
  if (!second) return { ...first, distance: 0 };
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2, distance: Math.hypot(first.x - second.x, first.y - second.y) };
}

export function MobilePageMap({ route }) {
  const params = new URLSearchParams(route?.split('?')[1]);
  return params.has('print') && !offlinePrototype ? <MobileMapPrint /> : <MobileMapCanvas />;
}

function MobileMapCanvas() {
  const viewport = useRef(null);
  const pointers = useRef(new Map());
  const moved = useRef(false);
  const [expanded, setExpanded] = useState(initialExpanded);
  const { nodes, edges } = useMemo(() => layoutMap(expanded), [expanded]);
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const visible = new Map(nodes.map(node => [node.id, node]));
  const [mounted, setMounted] = useState(() => new Map(layoutMap(initialExpanded()).nodes.map(node => [node.id, node])));


  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    setCamera(fitCamera(viewport.current, layoutMap(initialExpanded()).nodes, viewport.current.clientWidth > 560));
  }, []);

  const zoomAt = (factor, point) => setCamera(current => {
    const scale = clampScale(current.scale * factor);
    const ratio = scale / current.scale;
    return { scale, x: point.x - (point.x - current.x) * ratio, y: point.y - (point.y - current.y) * ratio };
  });

  useLayoutEffect(() => {
    const element = viewport.current;
    const onWheel = event => {
      event.preventDefault();
      const mode = event.deltaMode;
      const dx = event.deltaX * (mode === 1 ? 16 : mode === 2 ? element.clientWidth : 1);
      const dy = event.deltaY * (mode === 1 ? 16 : mode === 2 ? element.clientHeight : 1);

      // Browsers report trackpad pinch as a wheel event with Ctrl pressed.
      if (event.ctrlKey || event.metaKey) {
        const bounds = element.getBoundingClientRect();
        const amount = Math.max(-50, Math.min(50, dy));
        zoomAt(Math.exp(-amount * 0.008), { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
        return;
      }

      const horizontal = event.shiftKey && dx === 0;
      setCamera(current => ({
        ...current,
        x: current.x - (horizontal ? dy : dx),
        y: current.y - (horizontal ? 0 : dy),
      }));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const zoom = factor => zoomAt(factor, { x: viewport.current.clientWidth / 2, y: viewport.current.clientHeight / 2 });
  const toggle = node => {
    const next = new Set(expanded);
    if (next.has(node.id)) next.delete(node.id);
    else next.add(node.id);
    const nextNodes = layoutMap(next).nodes;
    const updated = nextNodes.find(item => item.id === node.id);
    setMounted(current => new Map([...current, ...nextNodes.map(item => [item.id, item])]));
    setExpanded(next);
    setCamera(current => ({ ...current, y: current.y + (node.y - updated.y) * current.scale }));
  };

  const focusPrototype = node => {
    const { clientWidth: width, clientHeight: height } = viewport.current;
    const scale = Math.min(1, (width - 24) / NODE_WIDTH, (height - 74) / NODE_HEIGHT);
    setCamera({ scale, x: width / 2 - node.x * scale, y: (height - 44) / 2 - node.y * scale });
  };
  const point = event => {
    const bounds = viewport.current.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  const startDrag = event => {
    if (event.button !== 0) return;
    if (!pointers.current.size) moved.current = false;
    if (event.pointerType !== 'touch' && event.target.closest('a, button')) return;
    const position = point(event);
    pointers.current.set(event.pointerId, { ...position, start: position });
  };
  const drag = event => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const position = point(event);
    if (!moved.current && pointers.current.size === 1 && Math.hypot(position.x - previous.start.x, position.y - previous.start.y) < 5) return;
    if (!moved.current) {
      moved.current = true;
      setDragging(true);
    }
    if (!viewport.current.hasPointerCapture(event.pointerId)) viewport.current.setPointerCapture(event.pointerId);
    const before = pointerCenter(pointers.current);
    pointers.current.set(event.pointerId, { ...position, start: previous.start });
    const after = pointerCenter(pointers.current);
    setCamera(current => {
      const scale = before.distance && after.distance ? clampScale(current.scale * after.distance / before.distance) : current.scale;
      const ratio = scale / current.scale;
      return { scale, x: after.x - (before.x - current.x) * ratio, y: after.y - (before.y - current.y) * ratio };
    });
  };
  const endDrag = event => {
    pointers.current.delete(event.pointerId);
    if (!pointers.current.size) setDragging(false);
  };
  const onKeyDown = event => {
    if (event.target !== viewport.current) return;
    const offsets = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] };
    if (offsets[event.key]) {
      const [x, y] = offsets[event.key];
      setCamera(current => ({ ...current, x: current.x + x, y: current.y + y }));
    } else if (event.key === '+' || event.key === '=') zoom(1.2);
    else if (event.key === '-') zoom(1 / 1.2);
    else return;
    event.preventDefault();
  };
  const focusNode = (event, node) => {
    if (!event.target.matches(':focus-visible')) return;
    const bounds = viewport.current.getBoundingClientRect();
    const card = event.currentTarget.getBoundingClientRect();
    if (card.left < bounds.left || card.right > bounds.right || card.top < bounds.top || card.bottom > bounds.bottom - 56) {
      setCamera(current => ({ ...current, x: bounds.width / 2 - node.x * current.scale, y: bounds.height / 2 - node.y * current.scale }));
    }
  };

  return <main className="page-map">
    <header className="page-map-header">
      <div className="page-map-heading"><span className="page-map-icon"><Network size={20} aria-hidden="true" /></span>
        <div><h1>移动端原型导图</h1><p>供应商管理平台与协同门户</p></div>
      </div>
      <div className="page-map-header-actions">
        {!offlinePrototype && !import.meta.env.DEV && <a className="page-map-export"
          href={import.meta.env.BASE_URL + 'supplier-mobile-interactive.html'} download="供应商移动端交互原型.html">导出交互原型</a>}
        {!offlinePrototype && <a href="#/mobile/components">组件库</a>}
        <a href={mobilePrdUrl} download="供应商移动端PRD.md">下载 PRD</a>
        {!offlinePrototype && <a href="#/mobile"><ArrowLeft size={16} aria-hidden="true" /><span>返回原型</span></a>}
      </div>
    </header>
    <div className={dragging ? 'page-map-canvas is-dragging' : 'page-map-canvas'} ref={viewport} tabIndex={0}
      role="region" aria-label="原型导图画布" onKeyDown={onKeyDown}
      onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}
      onPointerLeave={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) endDrag(event); }}
      onClickCapture={event => {
        if (!moved.current || event.detail === 0) return;
        moved.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}>
      <div className="page-map-world" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
        <svg className="page-map-edges" width="1" height="1" aria-hidden="true">
          <defs>
            <marker id="page-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" />
            </marker>
          </defs>
          {edges.map(edge => <path className="page-map-connector" key={edge.to.id}
            d={edgePath(edge)} markerEnd="url(#page-map-arrow)" />)}
        </svg>
        <div className="page-map-center"><Network size={18} aria-hidden="true" />供应商系统</div>
        {[...mounted.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })).map(saved => {
          const node = visible.get(saved.id) || saved;
          const { item, id } = node;
          const open = expanded.has(id);
          return <div className="page-map-node" key={id} hidden={!visible.has(id)} data-node={id}
            style={{ left: node.x - NODE_WIDTH / 2, top: node.y - NODE_HEIGHT / 2, width: NODE_WIDTH, height: NODE_HEIGHT }}
            onFocus={event => focusNode(event, node)}>
            <div className="page-map-node-title">
              <strong>{item.label}</strong>
              <button type="button" aria-label={'放大' + item.label} title="放大原型" onClick={() => focusPrototype(node)}>
                <Scan size={17} aria-hidden="true" />
              </button>
              {item.children.length > 0 && <button type="button" aria-expanded={open}
                aria-label={(open ? '收起' : '展开') + item.label} onClick={() => toggle(node)}>
                {open ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              </button>}
            </div>
            <iframe className="page-map-prototype" title={item.label} loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
              width={previewSize.width} height={previewSize.height}
              {...(offlinePrototype
                ? { srcDoc: window.__SUPPLIER_FRAME_DOCUMENT__(item.route) }
                : { src: import.meta.env.BASE_URL + '?prototype-node=' + id + '#/mobile/' + item.route })} />
          </div>;
        })}
      </div>
    </div>
    <div className="page-map-hint"><span>页面内直接操作 · 空白处拖动画布 · Ctrl / ⌘ + 滚轮缩放</span></div>
    <div className="page-map-tools" role="group" aria-label="画布缩放">
      <button type="button" aria-label="缩小" onClick={() => zoom(1 / 1.2)} disabled={camera.scale <= MIN_SCALE}><Minus size={18} /></button>
      <output aria-label="当前缩放">{Math.round(camera.scale * 100)}%</output>
      <button type="button" aria-label="放大" onClick={() => zoom(1.2)} disabled={camera.scale >= MAX_SCALE}><Plus size={18} /></button>
      <button className="page-map-fit" type="button" aria-label="适应画布" title="适应画布" onClick={() => setCamera(fitCamera(viewport.current, nodes))}><Maximize2 size={17} /></button>
    </div>
  </main>;
}
