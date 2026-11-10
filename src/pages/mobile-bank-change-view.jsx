import React, { useState } from 'react';
import { BankCard } from './mobile-forms.jsx';
import { AttachmentLink, CardActions, Overlay } from './mobile-ui.jsx';
import { bankChange, bankComparisonFields } from './mobile-bank-changes.js';
import { attachmentName } from './mobile-interaction.jsx';

const valueText = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const displayValue = (key, value) => key === 'proof' ? valueText(attachmentName(value)) : valueText(value);
const hasValue = value => valueText(value).trim() !== '';
const bankFields = [...bankComparisonFields, ['proof', '开户证明']];

function BankFieldValue({ field, raw, value, onPreview }) {
  if (field.key === 'proof' && raw && onPreview) return <AttachmentLink value={raw} onPreview={onPreview} />;
  return value || '—';
}

export function BankChangeCard({ before, bank, onPreview, onEdit, onDelete, deleteDisabledReason }) {
  const [blockedDelete, setBlockedDelete] = useState(false);
  const { action, original } = bankChange(before, bank);
  if (!action) return <BankCard {...{ bank, onPreview, onEdit, onDelete, deleteDisabledReason }} />;

  const deleted = action === '删除';
  const modified = action === '修改';
  const titleRecord = deleted ? original : bank;
  const title = [
    titleRecord?.accountType || '银行账户',
    titleRecord?.bank,
    titleRecord?.number ? '尾号' + titleRecord.number.slice(-4) : '',
  ].filter(Boolean).join(' · ');
  const fields = bankFields.map(([key, label]) => {
    const previousRaw = original?.[key];
    const nextRaw = bank?.[key];
    const previous = displayValue(key, previousRaw);
    const next = displayValue(key, nextRaw);
    return {
      key, label, previous, next, previousRaw, nextRaw,
      changed: modified && valueText(previousRaw) !== valueText(nextRaw),
    };
  });
  const badge = modified ? '变更' : action;
  const showDelete = !!onDelete || (!!onEdit && !!deleteDisabledReason);

  return <article className="m-bank-card m-bank-change-card" data-bank-change={action}>
    <header className="m-change-group-heading m-record-heading">
      <h3>{title}</h3>
      <span className="m-change-badge" data-action={badge} aria-label={'变更状态：' + (action === '修改' ? '修改' : action)}>{badge}</span>
    </header>
    <div className="m-change-group-body">
      {fields.map(field => {
        const raw = deleted ? field.previousRaw : field.nextRaw;
        const value = deleted ? field.previous : field.next;
        return <div className="m-change-field-row" key={field.key}>
          <span className="m-change-field-label">{field.label}</span>
          <div className="m-change-field-values" aria-label={field.label + (modified && field.changed ? '修改前后' : '')}>
            {modified && field.changed
              ? <><span className="m-change-value-new"><BankFieldValue field={field} raw={field.nextRaw} value={field.next} onPreview={onPreview} /></span><span className="m-change-value-old"><BankFieldValue field={field} raw={field.previousRaw} value={field.previous} onPreview={onPreview} /></span></>
              : <span className="m-change-value-normal"><BankFieldValue field={field} raw={raw} value={value} onPreview={onPreview} /></span>}
          </div>
        </div>;
      })}
    </div>
    {(onEdit || showDelete) && <CardActions>
      {onEdit && <button type="button" onClick={onEdit}>修改</button>}
      {showDelete && <button type="button" className="m-action-danger" onClick={() => deleteDisabledReason ? setBlockedDelete(true) : onDelete?.()}>删除</button>}
    </CardActions>}
    {blockedDelete && <Overlay label="银行删除校验" onClose={() => setBlockedDelete(false)}>
      <h2>无法删除</h2>
      <p>{deleteDisabledReason}</p>
      <div className="m-dialog-actions"><button type="button" onClick={() => setBlockedDelete(false)}>知道了</button></div>
    </Overlay>}
  </article>;
}
