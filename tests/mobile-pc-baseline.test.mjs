import assert from 'node:assert/strict';
import test from 'node:test';
import { canDeleteSupplier, canInviteHistoricalSupplier, displayCertificateNumber } from '../src/pages/mobile-rules.js';
import { bankAccountsError, effectiveBasicBankDeleteError, restoreBankDirectoryFields } from '../src/pages/mobile-edit-rules.js';
import { findDemoProcurementTask, procurementNoticeRoute } from '../src/pages/mobile-portal-procurement.js';

const original = { id: 'bank-1', accountType: '基本账户' };

test('证件脱敏以登记号码为准，并保留企业证照原值', () => {
  assert.equal(displayCertificateNumber({ type: '个人供应商', code: 'old', basic: { creditCode: '12DEMO0034' } }), '12******34');
  assert.equal(displayCertificateNumber({ type: '个人供应商', code: '1234' }), '****');
  assert.equal(displayCertificateNumber({ type: '企业供应商', code: 'DEMO-0123' }), 'DEMO-0123');
});

test('发生过合作的供应商在两个列表均不可删除', () => {
  assert.equal(canDeleteSupplier({ status: '注册驳回', hasCooperation: true }), false);
  assert.equal(canDeleteSupplier({ status: '邀请中', hasCooperation: true }, true), false);
  assert.equal(canDeleteSupplier({ status: '注册驳回' }), true);
});

test('历史供应商须已交接给当前邀请人且无账号方可发送开户邀请', () => {
  const supplier = { mode: '历史供应商', status: '已审批', inviter: '员工甲' };
  assert.equal(canInviteHistoricalSupplier(supplier, '员工甲'), false);
  supplier.historicalHandoverTo = '员工甲';
  assert.equal(canInviteHistoricalSupplier(supplier, '员工甲'), true);
  assert.equal(canInviteHistoricalSupplier(supplier, '员工乙'), false);
  assert.equal(canInviteHistoricalSupplier({ ...supplier, account: '已有账号' }, '员工甲'), false);
});

test('调整基本账户要求同单指定新基本户并保留原账户', () => {
  const changed = { ...original, accountType: '一般账户' };
  const replacement = { id: 'bank-2', accountType: '基本账户' };
  assert.equal(bankAccountsError([changed, replacement], true, [original]), '');
  assert.match(bankAccountsError([changed], true, [original]), /有且只有一个/);
  assert.equal(bankAccountsError([replacement, { ...changed, change: '删除' }], true, [original]), effectiveBasicBankDeleteError);
});

test('旧分行地址仅按相同开户银行和分行回填', () => {
  const banks = [{ name: '甲行', country: '日本' }];
  const branches = [{ name: '营业部', bank: '乙行', province: '省乙', city: '市乙' }, { name: '营业部', bank: '甲行', province: '省甲', city: '市甲' }];
  assert.deepEqual(restoreBankDirectoryFields({ bank: '甲行', branch: '营业部' }, banks, branches), { bank: '甲行', branch: '营业部', country: '日本', province: '省甲', city: '市甲' });
  assert.equal(restoreBankDirectoryFields({ bank: '甲行', branch: '其他' }, banks, branches).city, undefined);
});

test('采购通知只处理允许的任务和专用会话演示账号', () => {
  const task = { task: 'quote', record: 'MOCK-INQ-001' };
  const record = { status: '待处理', number: task.record };
  assert.equal(procurementNoticeRoute('task=quote&record=MOCK-INQ-001'), 'workspace-procurement?task=quote&record=MOCK-INQ-001');
  assert.equal(procurementNoticeRoute('task=quote&record=https%3A%2F%2Fexample.test'), '');
  assert.equal(findDemoProcurementTask(task, { account: 'another-account' }, [record]), null);
  assert.equal(findDemoProcurementTask(task, { account: 'supplier-demo' }, [record]), record);
});
