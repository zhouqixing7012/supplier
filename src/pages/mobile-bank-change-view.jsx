import React from 'react';
import { AttachmentLink, CardActions, RecordCard, Row } from './mobile-ui.jsx';
import { BankCard } from './mobile-forms.jsx';
import { bankChange, bankComparisonFields } from './mobile-bank-changes.js';

export function BankChangeCard({ before, bank, onPreview, onEdit, onDelete, deleteDisabledReason, notify }) {
  const { action, original, fields } = bankChange(before, bank);
  if (!action) return <BankCard {...{ bank, onPreview, onEdit, onDelete, deleteDisabledReason }} />;
  const identity = original || bank;
  const record = action === '删除' ? original : bank;
  const title = `${identity.accountType || '银行账户'} · ${identity.bank || '未选择银行'}${identity.number ? ' · 尾号' + identity.number.slice(-4) : ''}`;
  const details = () => bankComparisonFields.map(([key, label]) => <Row key={key} label={label}>{record[key] || '—'}</Row>);
  return <div className="m-bank-change-card" data-bank-change={action}><RecordCard title={title} status={<span className="m-status" data-tone={action === '删除' ? 'danger' : action === '修改' ? 'warning' : 'info'}>待提交{action}</span>}>
    {action === '修改' ? <>{fields.map(field => <section className="m-bank-diff-field" key={field.key} data-diff-field={field.key}><h4>{field.label}</h4><Row label="修改前">{field.previous || '未填写'}</Row><Row label="修改后">{field.next || '未填写'}</Row></section>)}<details className="m-bank-full-details"><summary>查看完整账户资料</summary>{details()}</details></> : details()}
    <Row label="开户证明">{record.proof ? <AttachmentLink value={record.proof} onPreview={() => onPreview(record.proof)} /> : '—'}</Row>
    {action !== '删除' && (onEdit || onDelete) && <CardActions>{onEdit && <button type="button" onClick={onEdit}>修改</button>}{(onDelete || deleteDisabledReason) && <button type="button" className="m-action-danger" onClick={() => deleteDisabledReason ? notify(deleteDisabledReason) : onDelete()}>删除</button>}</CardActions>}
  </RecordCard></div>;
}
