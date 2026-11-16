import { supplierTypes } from './mobile-data.js';

// 列表入口与执行校验共用用户确认的状态规则。
export const canChangeSupplier = supplier => supplier.status === '已审批' && !supplier.blacklisted && Number(supplier.blackFlag || 0) !== 1;
export const canRateSupplier = supplier => ['变更中', '已审批'].includes(supplier.status);
export const canReinviteSupplier = supplier => ['草稿', '邀请中'].includes(supplier.status);
export const deleteStatuses = mine => mine ? ['邀请中', '注册中', '草稿', '注册驳回'] : ['草稿', '注册驳回'];
export const canDeleteSupplier = (supplier, mine = false) => !supplier.hasCooperation && deleteStatuses(mine).includes(supplier.status);

export const supplierAccount = supplier => supplier.supplierAccount || supplier.userCode || supplier.account || '';
export const certificateNumber = supplier => supplier.basic?.creditCode || supplier.certificateNumber || supplier.code || '';

export function displayCertificateNumber(supplier) {
  const number = String(certificateNumber(supplier));
  if (supplier.type !== supplierTypes[1]) return number;
  if (number.length <= 4) return '*'.repeat(number.length);
  return number.slice(0, 2) + '*'.repeat(number.length - 4) + number.slice(-2);
}

export const canInviteHistoricalSupplier = (supplier, inviter) => Boolean(supplier &&
  supplier.mode === '历史供应商' && canChangeSupplier(supplier) && supplier.inviter === inviter &&
  supplier.historicalHandoverTo === inviter && !supplierAccount(supplier));

// 菜单、人员和状态共同决定记录操作，删除表示我的邀请的单条操作。
export function supplierListActions(supplier, { mine = false, inviter = '' } = {}) {
  const visible = !mine || supplier.inviter === inviter;
  const own = mine && visible;
  const change = visible && canChangeSupplier(supplier);
  return {
    detail: visible,
    approval: visible && (!mine || ['审批中', '已审批', '变更中'].includes(supplier.status)),
    editDraft: own && supplier.status === '草稿',
    reinvite: own && canReinviteSupplier(supplier),
    delete: own && canDeleteSupplier(supplier, true),
    editAll: own && change,
    bank: change, permissions: change, inviter: change,
    score: !mine && visible && canRateSupplier(supplier),
  };
}
