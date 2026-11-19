import { mobileAsset } from '../../pages/mobile-prototype-runtime.js';
import React from 'react';

export function SearchBox({ value, onChange, placeholder = '搜索', label = placeholder || '搜索', children }) {
  return <div className="m-search-row"><label className="m-search"><img src={mobileAsset('mobile-assets/workbench/search.svg')} alt="" /><input type="search" autoComplete="off" enterKeyHint="search" aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button type="button" aria-label="清空搜索" onClick={() => onChange('')}><img src={mobileAsset('mobile-assets/workbench/search-clear.svg')} alt="" /></button>}</label>{children}</div>;
}

export function FilterButton({ onClick, label = '筛选', active = false }) {
  const icon = active ? 'filter-active.svg' : 'filter.svg';
  return <button type="button" className="m-icon-button" aria-label={label}
    title={label} aria-description={active ? '已应用筛选条件' : undefined} onClick={onClick}>
    <img src={mobileAsset('mobile-assets/workbench/' + icon)} alt="" />
  </button>;
}

export function AppliedFilters({ count, onClear }) {
  return count > 0 && <div className="m-filter-notice">
    <span role="status">已应用{count}项条件</span>
    <button type="button" onClick={onClear}>清除条件</button>
  </div>;
}

export function FilterSummary({ count, unit = '条', label = '查询结果', action }) {
  return <section className="m-applied-filters" aria-label={label}>
    <div className="m-filter-summary">
      {count !== undefined && <span className="m-result-count" role="status">共 <span className="m-result-count-value">{count}</span> {unit}</span>}
      {action}
    </div>
  </section>;
}
