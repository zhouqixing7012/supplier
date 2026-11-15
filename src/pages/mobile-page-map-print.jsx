import React, { useEffect, useState } from 'react';
import { exportGroups, previewSize } from './mobile-page-map-data.js';
import tiles from './mobile-page-map-index.json';

const { columns, rows } = previewSize;
const perSheet = columns * rows;
const asset = sheet => import.meta.env.BASE_URL + 'mobile-map/preview-' + sheet + '.webp';

export function MapThumbnail({ route }) {
  const index = tiles[route];
  if (index === undefined) return <span className="page-map-thumbnail is-missing" role="status">此页面待更新截图</span>;
  const tile = index % perSheet;
  const x = tile % columns / (columns - 1) * 100;
  const y = Math.floor(tile / columns) / (rows - 1) * 100;
  return <span className="page-map-thumbnail" aria-hidden="true" style={{
    backgroundImage: `url("${asset(Math.floor(index / perSheet))}")`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
  }} />;
}

const groups = exportGroups();

function PrintFlow({ group, index }) {
  const marker = 'map-print-arrow-' + index;
  return <article className="map-print-sheet">
    <header>
      <h1>{group.entries[0].child.label}</h1>
      <p>{group.trail.join(' / ')}</p>
    </header>
    <div className="map-print-flow">
      <svg className="map-print-links" viewBox="0 0 1200 64" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
        {group.entries.slice(1).map(({ from }, position) => {
          const start = 150 + from * 300 + (from ? 15 : 0);
          const end = 150 + (position + 1) * 300;
          return <path key={position} d={`M ${start} 63 V ${15 + from * 12} H ${end} V 62`} markerEnd={`url(#${marker})`} />;
        })}
      </svg>
      {group.entries.map(({ child, action }, position) =>
        <figure key={position} className="map-print-node">
          <figcaption><strong>{child.label}</strong><small>{action}</small></figcaption>
          <MapThumbnail route={child.route} />
        </figure>)}
    </div>
    <footer><span>供应商移动端原型流程图</span><span>{index + 1} / {groups.length}</span></footer>
  </article>;
}

export function MobileMapPrint() {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    const sheets = new Set(Object.values(tiles).map(index => Math.floor(index / perSheet)));
    Promise.all([...sheets].map(sheet => {
      const image = new Image();
      image.src = asset(sheet);
      return image.decode();
    })).then(() => setStatus('ready'), () => setStatus('error'));
  }, []);

  return <main className="map-print" data-print-status={status}>
    <style>{"@page { size: A3 landscape; margin: 0; }"}</style>
    <div className="map-print-toolbar">
      <a href="#/mobile/page-map">返回导图</a>
      <button type="button" disabled={status !== 'ready'} onClick={() => window.print()}>打印 / 保存 PDF</button>
      {status === 'error' && <span role="alert">有页面画面加载失败，请刷新后重试。</span>}
    </div>
    {groups.map((group, index) => <PrintFlow key={index} group={group} index={index} />)}
  </main>;
}
