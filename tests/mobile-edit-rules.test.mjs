import test from 'node:test';
import assert from 'node:assert/strict';
import { withAccountBank, reinviteCandidates, informationSteps } from '../src/pages/mobile-edit-rules.js';

test('选择开户银行立即回填实际国家，并清理原分行省市及保留账户资料', () => {
  const original = { bank: '旧银行', branch: '旧分行', country: '旧国家', province: '旧省', city: '旧市', number: '001234', proof: '证明.pdf', name: '账户名', currency: '美元' };
  const changed = withAccountBank(original, '境外银行', [{ name: '境外银行', country: '美国' }]);
  assert.equal(changed.country, '美国');
  for (const key of ['branch', 'province', 'city']) assert.equal(changed[key], '');
  for (const key of ['number', 'proof', 'name', 'currency']) assert.equal(changed[key], original[key]);
  assert.equal(original.branch, '旧分行');
  assert.equal(withAccountBank(original, '未知银行', []).country, '');
});

test('重新邀请只匹配本人名下同名草稿或注册驳回，支持多条候选', () => {
  const rows = [
    { id: 'draft', name: ' 同名供应商 ', inviter: '本人', status: '草稿' },
    { id: 'rejected', name: '同名供应商', inviter: '本人', status: '注册驳回' },
    { id: 'other-owner', name: '同名供应商', inviter: '他人', status: '草稿' },
    { id: 'approved', name: '同名供应商', inviter: '本人', status: '已审批' },
    { id: 'different', name: '同名供应商二', inviter: '本人', status: '草稿' },
  ];
  assert.deepEqual(reinviteCandidates(rows, '同名供应商 ', '本人').map(x => x.id), ['draft', 'rejected']);
  assert.deepEqual(reinviteCandidates(rows, '同名供应商', '本人', 'draft').map(x => x.id), ['rejected']);
  assert.deepEqual(reinviteCandidates(rows, ' ', '本人'), []);
});

test('个人按三步计数，其他供应商按四步计数，预览排在最后', () => {
  assert.deepEqual(informationSteps(true), [0, 2, 3]);
  assert.deepEqual(informationSteps(false), [0, 1, 2, 3]);
});
