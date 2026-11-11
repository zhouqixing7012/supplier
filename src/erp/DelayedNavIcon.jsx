import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd-pc';
import { Calculator, Plane, createLucideIcon } from 'lucide-react';
import './delayed-nav-icon.css';

// 沿用 Lucide 轮廓（ISC），为参与动效的局部线条标记动画。
const BuildingIcon = createLucideIcon('building-2', [
  ['path', { d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z', key: 'body' }],
  ['path', { d: 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', key: 'left' }],
  ['path', { d: 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', key: 'right' }],
  ...[6, 10, 14, 18].map((y, index) => ['path', {
    d: `M10 ${y}h4`, key: y, className: 'pc-nav-icon-tile', style: { '--pc-nav-part-index': index },
  }]),
]);
const ClipboardIcon = createLucideIcon('clipboard-list', [
  ['rect', { width: 8, height: 4, x: 8, y: 2, rx: 1, ry: 1, key: 'clip' }],
  ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', key: 'body' }],
  ...[11, 16].flatMap((y, index) => [
    ['path', { d: `M12 ${y}h4`, key: 'line-' + y, className: 'pc-nav-icon-tile', style: { '--pc-nav-part-index': index } }],
    ['path', { d: `M8 ${y}h.01`, key: 'bullet-' + y }],
  ]),
]);
const panelIcon = (opening) => createLucideIcon(opening ? 'panel-left-open' : 'panel-left-close', [
  ['rect', { width: 18, height: 18, x: 3, y: 3, rx: 2, key: 'panel' }],
  ['path', { d: 'M9 3v18', key: 'divider' }],
  ['path', { d: opening ? 'm14 9 3 3-3 3' : 'm16 15-3-3 3-3', className: 'pc-nav-icon-arrow', key: 'arrow' }],
]);
const icons = { supplier: BuildingIcon, approval: ClipboardIcon, tax: Calculator, travel: Plane, open: panelIcon(true), close: panelIcon(false) };
const dwellMs = 1000;

export default function DelayedNavIcon({ kind, size = 16, className = '', style, tooltip }) {
  const ref = useRef(null);
  const [playingKind, setPlayingKind] = useState(null);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    // 沿用资产系统的整行触发、停留时长和退出条件。
    const target = ref.current?.closest('.ant-menu-submenu-title, .ant-menu-item, .pc-topbar-collapse, .pc-collapse-button');
    if (!target) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    let timer;
    let consumed = false;
    const stop = () => { clearTimeout(timer); setPlayingKind(null); };
    const enter = () => {
      if (tooltip) setHintOpen(true);
      if (consumed || reduced.matches || !hover.matches) return;
      consumed = true;
      timer = setTimeout(() => setPlayingKind(kind), dwellMs);
    };
    const leave = () => { stop(); setHintOpen(false); consumed = false; };
    const activate = () => { stop(); setHintOpen(false); consumed = true; };
    const blur = (event) => { if (!target.contains(event.relatedTarget)) leave(); };
    const keydown = (event) => {
      stop();
      consumed = true;
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') setHintOpen(false);
    };
    const events = { mouseenter: enter, mouseleave: leave, focusin: enter, focusout: blur, pointerdown: activate, click: activate, keydown };
    Object.entries(events).forEach(([name, handler]) => target.addEventListener(name, handler));
    reduced.addEventListener('change', stop);
    return () => {
      clearTimeout(timer);
      Object.entries(events).forEach(([name, handler]) => target.removeEventListener(name, handler));
      reduced.removeEventListener('change', stop);
    };
  }, [kind, tooltip]);

  const Icon = icons[kind];
  const icon = <span ref={ref} style={style} aria-hidden="true"
    className={['pc-delayed-nav-icon', className, playingKind === kind && 'is-playing'].filter(Boolean).join(' ')}
    data-icon-motion={kind}>
    <Icon size={size} aria-hidden="true" />
  </span>;
  // Ant Design 的 Menu.tooltip 只作用于叶子项。折叠分组在图标上方提示，右侧仍用于展开子菜单。
  return tooltip ? <Tooltip title={tooltip} placement="top" open={hintOpen} trigger={[]} autoAdjustOverflow>{icon}</Tooltip> : icon;
}
