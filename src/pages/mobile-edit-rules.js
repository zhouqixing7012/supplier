// 原型公共业务规则，目录资料来自移动端演示数据。
export function withAccountBank(account, bankName, directory) {
  const bank = directory.find(item => item.name === bankName);
  return { ...account, bank: bankName, branch: '', country: bank?.country || '', province: '', city: '' };
}
export function reinviteCandidate(records, name, inviter, excludedId) {
  const normalized = (name || '').trim();
  if (!normalized) return undefined;
  return records.find(record => record.id !== excludedId && record.inviter === inviter
    && (record.name || '').trim() === normalized && ['草稿', '注册驳回'].includes(record.status));
}
export function informationSteps(personal) { return personal ? [0, 2, 3] : [0, 1, 2, 3]; }

export const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
export function registrationEmailError(value) {
  if (!(value || '').trim()) return '请填写供应商注册邮箱';
  return validEmail(value) ? '' : '请输入正确的供应商注册邮箱';
}
export function middleEllipsis(value, limit) {
  const chars = Array.from(value || '');
  if (chars.length <= limit) return value || '';
  const extension = (value || '').match(/\.[^.]+$/)?.[0] || '';
  const extensionLength = Math.min(12, Array.from(extension).length);
  const available = Math.max(extensionLength + 1, 2, limit - 3);
  const tail = Math.min(12, available - 1, Math.max(extensionLength, 1, Math.floor(available * .4)));
  return chars.slice(0, available - tail).join('') + '...' + chars.slice(-tail).join('');
}
