import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Overlay, PickerHeading, SelectionMark } from './dialogs.jsx';
import { Empty } from './feedback.jsx';
import { SearchBox } from './search.jsx';
import { runMotion } from '../../pages/mobile-motion.jsx';

function DateWheel({ label, values, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const id = useId();
  useLayoutEffect(() => {
    clearTimeout(timer.current);
    const node = ref.current;
    const top = Math.max(0, values.indexOf(value)) * 44;
    if (Math.abs(node.scrollTop - top) > 1) node.scrollTop = top;
  }, [value, values.length]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const chooseAt = index => onChange(values[Math.max(0, Math.min(values.length - 1, index))]);
  return <div ref={ref} className="m-date-wheel" role="listbox" aria-label={label} aria-activedescendant={id + '-' + value} tabIndex={0}
    onScroll={e => { const node = e.currentTarget; clearTimeout(timer.current); timer.current = setTimeout(() => chooseAt(Math.round(node.scrollTop / 44)), 100); }}
    onKeyDown={e => { const index = values.indexOf(value); if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); chooseAt(e.key === 'Home' ? 0 : e.key === 'End' ? values.length - 1 : index + (e.key === 'ArrowDown' ? 1 : -1)); } }}>
    {values.map(x => <button type="button" role="option" id={id + '-' + x} key={x} tabIndex={-1} aria-selected={x === value} onClick={() => { clearTimeout(timer.current); ref.current.scrollTop = values.indexOf(x) * 44; onChange(x); }}>{x}{label}</button>)}
  </div>;
}

export function DateSheet({ title, value, onChange: changeOriginal, onClose: closeOriginal, allowLong = false, allowClear = false }) {
  const onClose = () => runMotion(closeOriginal, 'sheet-close');
  const onChange = value => changeOriginal(value);
  const today = new Date();
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  const [date, setDate] = useState(parts);
  const days = new Date(date[0], date[1], 0).getDate();
  const wheels = useRef(null);
  const values = [Array.from({ length: 91 }, (_, i) => 1970 + i), Array.from({ length: 12 }, (_, i) => i + 1), Array.from({ length: days }, (_, i) => i + 1)];
  const confirm = () => {
    // 确认时读取可见滚动位置，避免快速滚动后立即确认取到上一次日期。
    const current = [...wheels.current.querySelectorAll('.m-date-wheel')].map((node, i) => values[i][Math.max(0, Math.min(values[i].length - 1, Math.round(node.scrollTop / 44)))]);
    current[2] = Math.min(current[2], new Date(current[0], current[1], 0).getDate());
    runMotion(() => { onChange(`${current[0]}-${String(current[1]).padStart(2, '0')}-${String(current[2]).padStart(2, '0')}`); closeOriginal(); }, 'sheet-close');
  };
  return <Overlay label={title} onClose={onClose} sheet><div className="m-date-picker"><PickerHeading title={title} /><p className="m-date-selection" aria-live="polite">{date[0]}年{date[1]}月{Math.min(date[2], days)}日</p><div className="m-date-columns" aria-hidden="true"><span>年</span><span>月</span><span>日</span></div><div ref={wheels} className="m-date-wheels" data-no-swipe>{values.map((items, i) => <DateWheel key={i} label={['年', '月', '日'][i]} values={items} value={Math.min(date[i], i === 2 ? days : date[i])} onChange={v => setDate(old => { const next = old.map((x, n) => n === i ? v : x); next[2] = Math.min(next[2], new Date(next[0], next[1], 0).getDate()); return next; })} />)}</div>{(allowLong || allowClear) && <div className="m-date-shortcuts">{allowLong && <button onClick={() => { onChange('长期'); onClose(); }}>长期</button>}{allowClear && <button onClick={() => { onChange(''); onClose(); }}>清空日期</button>}</div>}<div className="m-picker-actions"><button type="button" onClick={onClose}>取消</button><button type="button" className="primary" onClick={confirm}>确认</button></div></div></Overlay>;
}

export function OptionSheet({ title, options = [], value, onChange, onClose: closeOriginal, mode = 'immediate', searchable = false, clearable = true }) {
  const onClose = () => runMotion(closeOriginal, 'sheet-close');
  const choose = value => runMotion(() => { onChange(value); closeOriginal(); }, 'sheet-close');
  const [selected, setSelected] = useState(value || '');
  const [query, setQuery] = useState('');
  const matches = options.filter(x => x.includes(query.trim()));
  // 简单动作列表无需圆形标记；搜索目录或暂选确认式选择保留标记。
  const showSelection = searchable || mode === 'confirm';
  const clear = () => { if (mode === 'immediate') { choose(''); } else setSelected(''); };
  return <Overlay label={title} onClose={onClose} sheet><div className={'m-option-picker ' + (showSelection ? 'has-selection-marks' : 'is-simple') + (searchable ? ' is-searchable' : '')}><PickerHeading title={title} />{searchable && <SearchBox value={query} onChange={setQuery} placeholder={'搜索' + title} />}<div className="m-sheet-options">{matches.length ? matches.map(x => <button type="button" aria-pressed={x === selected} className={x === selected ? 'selected' : ''} key={x} onClick={() => { if (mode === 'immediate') { choose(x); } else setSelected(x); }}><span>{x}</span>{showSelection && <SelectionMark selected={x === selected} />}</button>) : <Empty search={!!query} text={query ? '暂无匹配选项' : '暂无可用选项'} />}</div><div className="m-picker-actions">{clearable && <button type="button" onClick={clear}>清空选择</button>}<button type="button" onClick={onClose}>取消</button>{mode === 'confirm' && <button type="button" className="primary" onClick={() => choose(selected)}>确认</button>}</div></div></Overlay>;
}
