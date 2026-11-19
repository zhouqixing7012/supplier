import { supplierTypes } from '../pages/mobile-data.js';
import { certificateNumber } from '../pages/mobile-rules.js';

export function supplierProfileConflict(records, profile, id) {
  const normalizeName = (value) => String(value || '').trim().replaceAll('（', '(').replaceAll('）', ')');
  const name = normalizeName(profile.basic.supplierName);
  const code = profile.basic.creditCode?.trim();
  return records.some((row) => row.id !== id && ['审批中', '变更中', '已审批'].includes(row.status)
    && ((profile.type !== supplierTypes[1] && name && normalizeName(row.name) === name) || (code && certificateNumber(row) === code)));
}

export function resolveSupplierApproval(record, task) {
  if (record.maintenanceApproval !== task.number || (task.supplierId && task.supplierId !== record.id)) return record;
  const registration = task.type === '注册';
  if (record.status !== (registration ? '审批中' : '变更中') || !['同意', '驳回'].includes(task.status)) return record;

  const next = {
    ...record,
    status: registration && task.status === '驳回' ? '注册驳回' : '已审批',
    updated: task.handledAt,
    pendingProfile: undefined,
  };
  if (task.status === '驳回') return next;
  if (task.type === '银行信息变更') return { ...next, banks: task.profile.banks };
  if (task.type === '权限变更') return { ...next, permissions: task.profile.permissions };

  const { type, basic, contacts, banks } = task.profile;
  const name = basic.supplierName?.trim() || record.name;
  return {
    ...next, type, basic, contacts, banks, name,
    code: basic.creditCode ?? record.code,
    contact: contacts?.[0]?.name || '',
    phone: contacts?.[0]?.phone || basic.mobile || '',
    email: contacts?.[0]?.email || basic.email || '',
    registerEmail: basic.registerEmail ?? record.registerEmail,
    supplierFormerName: name !== record.name ? record.name : record.supplierFormerName,
    ...(registration ? { permissions: task.permissions, company: task.company } : {}),
  };
}

export function supplierApprovalNodes(task) {
  return [
    { id: task.number + ':submit', name: '开始', person: task.applicant, time: task.submittedAt, status: '已提交' },
    { id: task.number + ':review', name: '业务审批', person: task.approver, time: task.handledAt, status: task.status, opinion: task.opinion },
  ];
}
