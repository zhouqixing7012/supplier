const restrictedStatuses = new Set([0, 1, 2, 4, '0', '1', '2', '4', '草稿', '邀请中', '注册中', '注册驳回']);
const writerAccessGroups = ['admin_supplier', 'expLaPeople'];

export function canViewSupplier(record, { userCode, isAcpAdmin, groups = [] }, inviterCode) {
  if (!userCode || !record || ![0, '0'].includes(record.disabled)) return false;
  if (inviterCode && record.inviterCode !== inviterCode) return false;
  if (isAcpAdmin || record.inviterCode === userCode) return true;
  if (restrictedStatuses.has(record.status)) return false;
  return [-1, '-1'].includes(record.source)
    || ([0, '0'].includes(record.source) && writerAccessGroups.some(group => groups.includes(group)));
}
