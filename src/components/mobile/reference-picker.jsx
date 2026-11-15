import React, { useId, useState } from 'react';
import { SelectionMark } from './dialogs.jsx';
import { Empty } from './feedback.jsx';
import { Actions, Row } from './layout.jsx';
import { SearchBox } from './search.jsx';

export function ReferencePicker({
  entries, selected = '', onCancel, onConfirm, initialSearch = '', mode = 'immediate',
  searchLabel = '搜索', searchPrompt, emptyText = '暂无可用数据', radioName,
}) {
  const id = useId();
  const [query, setQuery] = useState(initialSearch);
  const [pending, setPending] = useState(selected);
  const confirm = mode === 'confirm';
  const chosen = confirm ? pending : selected;
  const matches = searchPrompt && !query ? [] : entries.filter(
    entry => (entry.searchFields || [entry.name]).some(value => value?.includes(query)),
  );

  return <div className={'m-reference-list' + (confirm ? ' m-reference-confirm' : '')}>
    <SearchBox value={query} onChange={setQuery} placeholder={searchLabel} />
    <div className="m-reference-content">
      {matches.length ? matches.map(entry => <label key={entry.name} className="m-reference-card">
        <input type="radio" name={radioName || id} value={entry.name} checked={chosen === entry.name} readOnly
          onClick={() => { if (confirm) setPending(entry.name); else onConfirm(entry.name); }} />
        <div>
          <div className="m-reference-heading">
            <h3>{entry.name}</h3>
            {entry.code && <span className="m-person-code">{entry.code}</span>}
            <SelectionMark selected={chosen === entry.name} />
          </div>
          {(entry.rows || []).map(([label, value]) => <Row key={label} label={label} compact>{value}</Row>)}
        </div>
      </label>) : <Empty search={!!query}
        text={query ? '没有匹配结果，请调整关键词' : searchPrompt || emptyText} />}
    </div>
    <Actions flat items={[
      { label: '取消', muted: true, onClick: onCancel },
      ...(confirm ? [{ label: '确认', disabled: !pending, onClick: () => onConfirm(pending) }] : []),
    ]} />
  </div>;
}
