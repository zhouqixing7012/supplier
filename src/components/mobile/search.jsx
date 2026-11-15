import React from 'react';

export function SearchBox({ value, onChange, placeholder = '搜索', label = placeholder || '搜索', children }) {
  return <div className="m-search-row"><label className="m-search"><img src="/mobile-assets/workbench/search.svg" alt="" /><input type="search" autoComplete="off" enterKeyHint="search" aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />{value && <button type="button" aria-label="清空搜索" onClick={() => onChange('')}><img src="/mobile-assets/workbench/search-clear.svg" alt="" /></button>}</label>{children}</div>;
}

export function FilterButton({ onClick, label = '筛选' }) {
  return <button type="button" className="m-icon-button" aria-label={label} title={label} onClick={onClick}><img src="/mobile-assets/workbench/filter.svg" alt="" /></button>;
}

// 查询摘要只展示数量与筛选项，搜索词由搜索框自身承载。
export function FilterSummary({ entries = [], count, unit = '条', onEdit, onClear, label = '当前查询条件', showConditions = true }) {
  return <section className="m-applied-filters" aria-label={label}><div className="m-filter-summary">{entries.length > 0 && <button type="button" onClick={onEdit}>已筛选 · {entries.length}项</button>}{count !== undefined && <span className="m-result-count" role="status">共 {count} {unit}</span>}{entries.length > 0 && <button type="button" onClick={onClear}>清除筛选</button>}</div>{showConditions && entries.length > 0 && <dl className="m-applied-conditions">{entries.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}</section>;
}
