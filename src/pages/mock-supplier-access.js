import { initialSuppliers, people } from './mobile-data.js';

export const mockSupplierUser = { name: '陈才慧', userCode: 'MOCK-CURRENT' };
const demoInviterCodes = new Map([
  ...people.map(person => [person.name, person.userCode]),
  [mockSupplierUser.name, mockSupplierUser.userCode],
  ['周琦星', 'MOCK-005'],
]);

export function mockSupplierViewer(role = 'admin') {
  return {
    userCode: mockSupplierUser.userCode,
    isAcpAdmin: role === 'admin',
    groups: ['admin_supplier', 'expLaPeople'].includes(role) ? [role] : [],
  };
}

export function mockInviterCode(name) {
  return demoInviterCodes.get(name);
}

// 为旧演示会话补齐字段，保留已记录的来源、停用状态和邀请人工号。
export function withMockSupplierAccess(record) {
  const { disabled = 0, source = initialSuppliers.find(sample => sample.id === record.id)?.source ?? -1,
    inviterCode = mockInviterCode(record.inviter) } = record;
  return { ...record, disabled, source, inviterCode };
}
