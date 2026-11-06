// 原型公共业务规则，目录资料来自移动端演示数据。
export function withAccountBank(account, bankName, directory) {
  const bank = directory.find(item => item.name === bankName);
  return { ...account, bank: bankName, branch: '', country: bank?.country || '', province: '', city: '' };
}
export function reinviteCandidates(records, name, inviter, excludedId) {
  const normalized = (name || '').trim();
  if (!normalized) return [];
  return records.filter(record => record.id !== excludedId && record.inviter === inviter
    && (record.name || '').trim() === normalized && ['草稿', '注册驳回'].includes(record.status));
}
export function informationSteps(personal) { return personal ? [0, 2, 3] : [0, 1, 2, 3]; }
