import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { OptionSheet } from './pickers.jsx';
import { runMotion } from '../../pages/mobile-motion.jsx';

export function Tabs({ active, onChange, items, variant = 'line', showDirectory = true, stretch = false, label = '功能模块' }) {
  const ref = useRef(null);
  const [directory, setDirectory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const align = () => {
      const nav = ref.current;
      const button = nav?.querySelector('[aria-current="page"]');
      if (cancelled || !button) return;
      const offset = button.getBoundingClientRect().left - nav.getBoundingClientRect().left;
      const center = (nav.clientWidth - button.clientWidth) / 2;
      nav.scrollLeft = active === items.length - 1
        ? nav.scrollWidth - nav.clientWidth
        : Math.max(0, offset + nav.scrollLeft - center);
    };
    align();
    document.fonts.ready.then(align);
    return () => { cancelled = true; };
  }, [active, items.length]);

  useLayoutEffect(() => {
    const nav = ref.current;
    const align = () => {
      const button = nav.querySelector('[aria-current="page"]');
      if (!button) return;
      nav.style.setProperty('--m-indicator-x', button.offsetLeft + 'px');
      nav.style.setProperty('--m-indicator-width', button.offsetWidth + 'px');
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active, items.length]);

  const choose = index => {
    if (index !== active) runMotion(() => onChange(index), index > active ? 'tab-next' : 'tab-prev');
  };
  const bar = ['m-tab-bar', 'm-tab-motion', variant === 'pill' && 'm-tab-bar-pill', stretch && 'm-tab-bar-stretch']
    .filter(Boolean).join(' ');

  return <>
    <div className={bar}>
      <nav ref={ref} className="m-tabs" data-active={active} aria-label={label}>
        {items.map((item, index) => <button type="button" key={item}
          className={active === index ? 'active' : ''}
          aria-current={active === index ? 'page' : undefined}
          onClick={() => choose(index)}>
          <span className="m-tab-label">{item}</span>
        </button>)}
        <span className="m-tab-indicator" aria-hidden="true" />
      </nav>
      {showDirectory && <button type="button" className="m-tab-directory" aria-label="全部标签"
        onClick={() => setDirectory(true)}><ChevronDown /></button>}
    </div>
    {showDirectory && directory && <OptionSheet title="全部标签" options={items} value={items[active]}
      clearable={false} onClose={() => setDirectory(false)}
      onChange={item => choose(items.indexOf(item))} />}
  </>;
}

export function CountTabs({ items, active, onChange, label }) {
  return <div className="m-status-tabs m-count-tabs" role="group" aria-label={label}>
    {items.map(item => <button key={item.label} type="button" className={active === item.label ? 'active' : ''}
      aria-label={item.label} aria-description={'共' + item.count + '条'} aria-pressed={active === item.label}
      onClick={() => onChange(item.label)}>
      <strong>{item.count}</strong><span>{item.label}</span>
    </button>)}
  </div>;
}

export function Steps({ items, active, expanded, onExpandedChange, label = '办理步骤', collapsible = false }) {
  const id = useId();
  if (items[active] === undefined) return null;

  const list = <ol>{items.map((title, index) => {
    const complete = index < active;
    const current = index === active;
    return <li key={title} aria-current={current ? 'step' : undefined}
      className={complete ? 'completed' : current ? 'current' : ''}>
      <span className="m-step-number">{complete ? <Check aria-label="已完成" /> : index + 1}</span>
      <span className="m-step-name">{title}</span>
      <span className="m-step-state">{complete ? '已完成' : current ? '当前步骤' : '待填写'}</span>
    </li>;
  })}</ol>;
  if (!collapsible) return <nav className="m-registration-steps m-registration-steps-horizontal" aria-label={label} data-no-swipe>{list}</nav>;
  return <nav className="m-registration-steps" aria-label={label} data-no-swipe>
    <button type="button" className="m-steps-toggle" aria-expanded={expanded} aria-controls={id}
      onClick={() => onExpandedChange(!expanded)}>
      <span>第 {active + 1} / {items.length} 步</span>
      <strong>{items[active]}</strong>
      <span className="m-steps-disclosure">
        {expanded ? '收起步骤' : '全部步骤'}
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </span>
    </button>
    <div id={id} className="m-registration-step-list" data-open={expanded} aria-hidden={!expanded}
      inert={!expanded ? true : undefined}>
      <div className="m-registration-step-list-inner">
        {list}
      </div>
    </div>
  </nav>;
}
