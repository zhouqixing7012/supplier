import { mobileStorage } from './mobile-prototype-runtime.js';
export const bankComparisonFields = [
  ['accountType', '账户类型'], ['bank', '开户银行'], ['branch', '银行分行'],
  ['country', '开户行所在国家/地区'], ['province', '开户所在省'], ['city', '开户所在市'],
  ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种'], ['note', '备注'],
];
const value = input => input ?? '';
export function bankChange(before, entry) {
  const original = before.find(record => record.id === entry.id);
  const action = entry.change === '删除' ? (original ? '删除' : '') : !original ? '新增'
    : [...bankComparisonFields.map(([key]) => key), 'proof'].some(key => value(original[key]) !== value(entry[key])) ? '修改' : '';
  const fields = bankComparisonFields.filter(([key]) => action === '新增' || action === '删除' || value(original?.[key]) !== value(entry[key]))
    .map(([key, label]) => ({ key, label, previous: value(original?.[key]), next: value(entry[key]) }));
  return { action, original, fields };
}
export function normalizeBankChanges(before, entries) {
  return entries.filter(entry => entry.change !== '删除' || before.some(original => original.id === entry.id))
    .map(entry => ({ ...entry, change: bankChange(before, entry).action }));
}
export function bankChangeCounts(before, entries) {
  const counts = { 新增: 0, 修改: 0, 删除: 0, total: 0 };
  for (const entry of entries) { const { action } = bankChange(before, entry); if (action) { counts[action] += 1; counts.total += 1; } }
  return counts;
}
const storageKey = id => 'supplier:bank-draft:v1:陈才慧:' + id;
export function readBankDraft(id, storage = mobileStorage()) {
  try { const draft = JSON.parse(storage.getItem(storageKey(id)) || 'null'); return Array.isArray(draft?.entries) ? draft.entries : null; } catch { return null; }
}
export function writeBankDraft(id, entries, storage = mobileStorage()) {
  if (entries) storage.setItem(storageKey(id), JSON.stringify({ entries })); else storage.removeItem(storageKey(id));
}
