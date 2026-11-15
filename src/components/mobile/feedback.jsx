import { mobileAsset } from '../../pages/mobile-prototype-runtime.js';
import React from 'react';

export function StatusBadge({ children, tone = 'neutral', label }) {
  return <span className="m-status" data-tone={tone} aria-label={label}>{children}</span>;
}

// 搜索与业务空态共用工作台原始插画资产。
function SearchEmptyArt({ search = false }) {
  const asset = name => mobileAsset('mobile-assets/workbench/' + name);
  return <span className={search ? "m-search-empty-art" : "m-search-empty-art m-record-empty-art"} aria-hidden="true"><span className="m-empty-art-group"><span className="m-empty-art-board" /><span className="m-empty-art-mask"><span /></span>{search && <img className="m-empty-art-warning" src={asset('empty-warning.svg')} alt="" />}<img className="m-empty-art-clip" src={asset('empty-clip.svg')} alt="" />{search && <><span className="m-empty-art-bar" /><img className="m-empty-art-dots" src={asset('empty-dots.svg')} alt="" /></>}<img className="m-empty-art-detail" src={asset('empty-detail.png')} width="34.909" height="46.545" alt="" /></span><span className="m-empty-art-decoration"><img src={asset('empty-decoration.svg')} alt="" /></span></span>;
}

export function Empty({ text = '暂无数据', illustration = false, search = false, variant = 'bare' }) {
  return <div className={`m-empty m-empty-${variant} ${illustration ? 'm-empty-illustrated' : ''} ${search ? 'm-empty-search' : !illustration ? 'm-empty-neutral' : ''}`} role="status">{search || !illustration ? <span className="m-empty-art-frame"><SearchEmptyArt search={search} /></span> : illustration && <span className="m-empty-plate"><img src={mobileAsset('mobile-assets/empty-application-source.jpg')} alt="" /></span>}<span>{text}</span></div>;
}
