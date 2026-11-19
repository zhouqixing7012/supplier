import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSupplierApproval, supplierProfileConflict } from '../src/pc/supplier-approval.js';

const supplier = {
  id: 'demo-supplier', name: '演示企业', type: '企业供应商', status: '变更中',
  maintenanceApproval: 'MOCK-APPROVAL', banks: [{ id: 'original-bank' }],
  permissions: [{ id: 'original-permission' }], basic: { supplierName: '演示企业' },
};
const profile = {
  type: '企业供应商', basic: { supplierName: '更新后的演示企业', creditCode: 'MOCK-CODE' },
  contacts: [{ name: '演示联系人' }], banks: [{ id: 'new-bank' }],
  permissions: [{ id: 'new-permission' }],
};
const task = {
  number: 'MOCK-APPROVAL', supplierId: supplier.id, status: '同意',
  handledAt: '2026-11-19 16:00:00', profile,
};

test('代注册审批通过或驳回后更新供应商的注册状态', () => {
  const pending = { ...supplier, status: '审批中' };
  const registration = { ...task, type: '注册', company: '演示付款公司', permissions: profile.permissions };
  const approved = resolveSupplierApproval(pending, registration);
  assert.equal(approved.status, '已审批');
  assert.equal(approved.company, registration.company);
  assert.deepEqual(approved.permissions, profile.permissions);
  assert.equal(resolveSupplierApproval(pending, { ...registration, status: '驳回' }).status, '注册驳回');
});

test('银行或权限审批通过只更新本次申请对应的资料', () => {
  const approvedBank = resolveSupplierApproval(supplier, { ...task, type: '银行信息变更' });
  const approvedPermissions = resolveSupplierApproval(supplier, { ...task, type: '权限变更' });
  assert.deepEqual(approvedBank.banks, profile.banks);
  assert.deepEqual(approvedBank.permissions, supplier.permissions);
  assert.deepEqual(approvedPermissions.permissions, profile.permissions);
  assert.deepEqual(approvedPermissions.banks, supplier.banks);
});

test('资料变更通过保留曾用名，驳回保留生效资料', () => {
  const change = { ...task, type: '资料变更' };
  const approved = resolveSupplierApproval(supplier, change);
  const rejected = resolveSupplierApproval(supplier, { ...change, status: '驳回' });
  assert.equal(approved.name, profile.basic.supplierName);
  assert.equal(approved.supplierFormerName, supplier.name);
  assert.equal(rejected.status, '已审批');
  assert.deepEqual(rejected.basic, supplier.basic);
  assert.deepEqual(rejected.banks, supplier.banks);
});

test('供应商仅接收与当前状态及本次申请匹配的审批结果', () => {
  assert.equal(resolveSupplierApproval(supplier, { ...task, type: '资料变更', supplierId: 'other' }), supplier);
  assert.equal(resolveSupplierApproval(supplier, { ...task, type: '资料变更', number: 'other' }), supplier);
  assert.equal(resolveSupplierApproval(supplier, { ...task, type: '注册' }), supplier);
});

test('代注册查重只匹配已定义状态、排除当前记录并兼容名称括号', () => {
  const pending = { id: 'pending', name: '示例（北京）', status: '审批中' };
  const candidate = { type: '企业供应商', basic: { supplierName: '示例(北京)' } };
  assert.ok(supplierProfileConflict([pending], candidate));
  assert.equal(supplierProfileConflict([pending], candidate, pending.id), false);
  assert.equal(supplierProfileConflict([{ ...pending, status: '草稿' }], candidate), false);
  assert.equal(supplierProfileConflict([pending], { ...candidate, type: '个人供应商' }), false);
});
