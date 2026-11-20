import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockManagement } from '../src/api/mobile/mock-management.js';
import { mockSupplierUser, mockSupplierViewer } from '../src/pages/mock-supplier-access.js';
import { canViewSupplier } from '../src/pages/supplier-list-access.js';

const queries = { mine: false, scene: 'query', screenshot: false, search: '', filters: {} };
const invitation = { type: '企业供应商', name: '接口演示企业', contact: '测试联系人', email: 'mock@example.invalid', phone: '13800000000' };

test('供应商可见范围按工号、ACP 身份、用户组、来源、状态和有效标识取交集', () => {
  const other = { inviter: mockSupplierUser.name, inviterCode: 'OTHER', disabled: 0, source: -1, status: '已审批' };
  const self = { ...other, inviter: '改名后的邀请人', inviterCode: mockSupplierUser.userCode };
  for (const role of ['employee', 'admin_supplier', 'expLaPeople', 'admin']) {
    const viewer = mockSupplierViewer(role);
    assert.equal(canViewSupplier(other, viewer), true);
    assert.equal(canViewSupplier({ ...other, source: 0 }, viewer), role !== 'employee');
    assert.equal(canViewSupplier({ ...other, source: 1 }, viewer), role === 'admin');
    for (const status of [0, 1, 2, 4, '0', '草稿', '邀请中', '注册中', '注册驳回']) {
      assert.equal(canViewSupplier({ ...other, status }, viewer), role === 'admin');
      assert.equal(canViewSupplier({ ...self, source: 1, status }, viewer, viewer.userCode), true);
    }
    assert.equal(canViewSupplier({ ...self, disabled: 1 }, viewer), false);
    assert.equal(canViewSupplier(other, viewer, viewer.userCode), false);
    assert.equal(canViewSupplier(self, viewer, other.inviterCode), false);
    assert.equal(canViewSupplier(other, viewer, other.inviterCode), true);
  }
  assert.equal(canViewSupplier(other, { isAcpAdmin: true }), false);
});

test('移动列表及导出先按数据权限过滤，再按邀请人工号和其他条件查询', () => {
  const api = createMockManagement();
  const employee = mockSupplierViewer('employee');
  const group = mockSupplierViewer('expLaPeople');
  const list = options => api.querySuppliers({ ...queries, ...options }).records.map(record => record.id);
  assert.deepEqual(list({ viewer: employee, inviterCode: 'MOCK-005' }), []);
  assert.deepEqual(list({ viewer: group, inviterCode: 'MOCK-005', filters: { status: '审批中' } }), ['person']);
  assert.deepEqual(list({ viewer: group, inviterCode: 'MOCK-005', filters: { status: '草稿' } }), []);
  assert.ok(list({ viewer: employee, inviterCode: 'MOCK-002' }).includes('mock-historical'));
  assert.ok(list({ viewer: employee, mine: true, inviterCode: 'MOCK-005' }).includes('mock-person-id-card'));
  assert.deepEqual(api.exportSuppliers({ ...queries, viewer: employee, inviterCode: 'MOCK-005' }, {}), []);
  assert.equal(api.changeInviters(['733324'], '周辉').count, 1);
  assert.equal(list({ viewer: employee, mine: true }).includes('733324'), false);
  assert.ok(list({ viewer: employee, inviterCode: 'MOCK-002' }).includes('733324'));
});

test('移动Mock API会话隔离，更新后查询和订阅读取同一结果', () => {
  const api = createMockManagement();
  const other = createMockManagement();
  const initial = api.getSnapshot();
  let notifications = 0;
  const unsubscribe = api.subscribe(() => { notifications += 1; });
  const { id } = api.invite(invitation);
  assert.equal(notifications, 1);
  assert.notEqual(api.getSnapshot(), initial);
  assert.equal(api.getSupplier(id).status, '邀请中');
  assert.deepEqual(api.querySuppliers({ ...queries, search: invitation.name }).records.map(record => record.id), [id]);
  assert.equal(other.getSupplier(id), undefined);
  unsubscribe();
  api.clearBankApplication();
  assert.equal(notifications, 1);
});

test('代注册连续保存更新同一草稿，提交审批保留登记信息', () => {
  const api = createMockManagement();
  const basic = { type: '企业供应商', supplierName: '接口演示草稿', registerEmail: ' draft@example.invalid ' };
  const form = { basic, contacts: [], banks: [] };
  const { id } = api.saveRegistrationDraft(form);
  assert.equal(api.saveRegistrationDraft({ ...form, contacts: [{ name: '联系人', phone: '13800000000' }] }, { id }).id, id);
  assert.equal(api.querySuppliers({ ...queries, search: basic.supplierName }).records.length, 1);
  assert.equal(api.getSupplier(id).email, 'draft@example.invalid');
  assert.equal(api.submitRegistration({ ...form, contacts: [{ name: '联系人', phone: '13800000000' }] }, { id }).id, id);
  assert.equal(api.getSupplier(id).status, '审批中');
  assert.equal(api.getSupplier(id).contact, '联系人');
  assert.ok(api.saveRegistrationDraft(form, { id }).error);
});

test('批量删除混有不可删除记录时不改变会话记录', () => {
  const api = createMockManagement();
  const { id } = api.invite(invitation);
  const before = api.getSnapshot();
  const result = api.deleteSuppliers([id, '733324'], { mine: true, administrator: true });
  assert.equal(result.title, '无法删除');
  assert.equal(api.getSnapshot(), before);
  assert.ok(api.getSupplier(id));
  assert.ok(api.deleteSuppliers([id], { mine: false, administrator: false }).error);
  assert.equal(api.deleteSuppliers([id], { mine: true, administrator: false }).count, 1);
  assert.equal(api.getSupplier(id), undefined);
});

test('银行暂存沿用现有浏览器存储，审批提交后保留正式账户及待审值', () => {
  const values = new Map();
  const bankStorage = {
    getItem: key => values.get(key),
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const api = createMockManagement({ bankStorage });
  const id = '733324';
  const current = api.getSupplier(id).banks;
  const draft = current.map(bank => ({ ...bank, note: '接口迁移演示修改' }));
  const { records } = api.saveBankDraft(id, draft);
  assert.equal(records[0].change, '修改');
  const nextSession = createMockManagement({ bankStorage });
  assert.equal(nextSession.getBankDraft(id)[0].note, '接口迁移演示修改');
  assert.deepEqual(api.submitBankChanges(id, records), {});
  assert.equal(api.getSupplier(id).status, '变更中');
  assert.deepEqual(api.getSupplier(id).banks, current);
  assert.equal(api.getSupplier(id).pendingBanks[0].note, '接口迁移演示修改');
  assert.equal(values.size, 0);
});

test('受邀人完成账户注册和资料提交后可查看结果', () => {
  const api = createMockManagement();
  const target = api.getRegistrationInvitation();
  assert.equal(api.registerInvitedAccount(target, { account: 'mock-user' }).id, target.id);
  assert.equal(api.getSupplier(target.id).status, '注册中');
  assert.ok(api.listAccounts().includes('mock-user'));
  const basic = { type: target.type, supplierName: target.name, registerEmail: target.email };
  assert.deepEqual(api.saveRegistrationDraft({ basic, contacts: [], banks: [], step: 1 }, { invited: true }), {});
  assert.equal(api.getSnapshot().registrationDraft.step, 1);
  assert.equal(api.submitRegistration({ basic, contacts: [], banks: [] }, { invited: true, id: target.id }).id, target.id);
  assert.equal(api.getSnapshot().registrationResult.account, 'mock-user');
  assert.equal(api.getSnapshot().registrationDraft, null);
  assert.equal(api.getSupplier(target.id).status, '审批中');
});
