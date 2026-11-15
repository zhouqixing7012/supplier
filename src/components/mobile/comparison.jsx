import React from 'react';

export function ComparisonField({ label, current, previous, changed = false }) {
  return <div className="m-change-field-row" data-changed={changed || undefined}>
    <span className="m-change-field-label">{label}</span>
    <div className="m-change-field-values" aria-label={label + (changed ? '修改前后' : '')}>
      <span className={changed ? 'm-change-value-new' : 'm-change-value-normal'}>{current}</span>
      {changed && <span className="m-change-value-old">{previous}</span>}
    </div>
  </div>;
}
