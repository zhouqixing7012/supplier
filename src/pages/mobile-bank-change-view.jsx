import React, { useState } from 'react';
import { BankCard } from './mobile-forms.jsx';
import { AttachmentLink, CardActions, Overlay } from './mobile-ui.jsx';
import { bankChange, bankComparisonFields } from './mobile-bank-changes.js';
import { attachmentName } from './mobile-interaction.jsx';

const valueText = value => value == null ? '' : String(value);
const displayValue = (key, value) => key === 'proof' ? valueText(attachmentName(value)) : valueText(value);
const hasValue = value => valueText(value).trim() !== '';

export function BankChangeCard({ before, bank, onPreview, onEdit, onDelete, deleteDisabledReason }) {
  const [blockedDelete, setBlockedDelete] = useState(false);
  const { action, original } = bankChange(before, bank);
  if (!action) return <BankCard {...{ bank, onPreview, onEdit, onDelete, deleteDisabledReason }} />;

  const deleted = action === '删除';
  const titleRecord = deleted ? original : bank;
  const title = [
    titleRecord?.accountType || '银行账户',
    titleRecord?.bank,
    titleRecord?.number ? '尾号' + titleRecord.number.slice(-4) : '',
  ].filter(Boolean).join(' · ');
  const definitions = [...bankComparisonFields, ['proof', '开户证明']];
  const fields = definitions.map(([key, label]) => {
    const previous = displayValue(key, original?.[key]);
    const next = displayValue(key, bank?.[key]);
    const changed = action === '新增' ? hasValue(next)
      : deleted ? hasValue(previous)
        : previous !== next;
    return changed ? { key, label, previous, next } : null;
  }).filter(Boolean);
  const badge = action === '修改' ? '变更' : action;
  const showDelete = !!onDelete || (!!onEdit && !!deleteDisabledReason);

  return <article className="m-bank-change-card" data-bank-change={action}>
    <header className="m-change-group-heading">
      <h3>{title}</h3>
      <span className="m-change-badge" data-action={badge}>{badge}</span>
    </header>
    <div className="m-change-group-body">
      {fields.map(field => <div className="m-change-diff-row" key={field.key}>
        <span className="m-change-diff-label">{field.label}</span>
        <div className="m-change-diff-values" aria-label={field.label + '修改前后'}>
          {!deleted && <span className="m-change-value-new">{field.key === 'proof' && bank.proof ? <AttachmentLink value={bank.proof} onPreview={onPreview} /> : field.next || (action === '新增' ? '' : '未填写')}</span>}
          {action !== '新增' && hasValue(field.previous) && <span className="m-change-value-old">{field.previous}</span>}
        </div>
      </div>)}
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
