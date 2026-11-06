import React from 'react';
import { BankCard } from './mobile-forms.jsx';
import { bankChange } from './mobile-bank-changes.js';

// 银行页暂用完整账户卡片展示本次资料，差异排版待UI定稿。
export function BankChangeCard({ before, bank, onPreview, onEdit, onDelete, deleteDisabledReason }) {
  const { action, original } = bankChange(before, bank);
  if (!action) return <BankCard {...{ bank, onPreview, onEdit, onDelete, deleteDisabledReason }} />;
  const record = action === '删除' ? original : bank;
  return <div className="m-bank-change-card" data-bank-change={action}><BankCard
    bank={{ ...record, change: action }} changeLabel={'待提交' + action} onPreview={onPreview}
    onEdit={action === '删除' ? undefined : onEdit} onDelete={action === '删除' ? undefined : onDelete}
    deleteDisabledReason={deleteDisabledReason}
  /></div>;
}
