import test from 'node:test';
import assert from 'node:assert/strict';
import { withAccountBank, reinviteCandidate, informationSteps, registrationEmailError, validEmail, middleEllipsis } from '../src/pages/mobile-edit-rules.js';

test('选择开户银行立即回填实际国家，并清理原分行省市及保留账户资料', () => {
  const original = { bank: '旧银行', branch: '旧分行', country: '旧国家', province: '旧省', city: '旧市', number: '001234', proof: '证明.pdf', name: '账户名', currency: '美元' };
  const changed = withAccountBank(original, '境外银行', [{ name: '境外银行', country: '美国' }]);
  assert.equal(changed.country, '美国');
  for (const key of ['branch', 'province', 'city']) assert.equal(changed[key], '');
  for (const key of ['number', 'proof', 'name', 'currency']) assert.equal(changed[key], original[key]);
  assert.equal(original.branch, '旧分行');
  assert.equal(withAccountBank(original, '未知银行', []).country, '');
});

test('重新邀请匹配本人名下同名的唯一草稿或注册驳回记录', () => {
  const draft = { id: 'draft', name: ' 同名供应商 ', inviter: '本人', status: '草稿' };
  const other = { id: 'other', name: '同名供应商', inviter: '他人', status: '草稿' };
  assert.equal(reinviteCandidate([other, draft], '同名供应商 ', '本人'), draft);
  assert.equal(reinviteCandidate([{ ...draft, status: '注册驳回' }], '同名供应商', '本人').id, 'draft');
  assert.equal(reinviteCandidate([{ ...draft, status: '已审批' }], '同名供应商', '本人'), undefined);
  assert.equal(reinviteCandidate([draft], '同名供应商', '本人', 'draft'), undefined);
  assert.equal(reinviteCandidate([draft], ' ', '本人'), undefined);
});

test('个人按三步计数，其他供应商按四步计数，预览排在最后', () => {
  assert.deepEqual(informationSteps(true), [0, 2, 3]);
  assert.deepEqual(informationSteps(false), [0, 1, 2, 3]);
});


test('注册邮箱区分空值和错误格式，支持正常企业邮箱及首尾空格', () => {
  assert.equal(registrationEmailError('  '), '请填写供应商注册邮箱');
  assert.equal(registrationEmailError('bad-email'), '请输入正确的供应商注册邮箱');
  for (const email of ['user@company.cn', 'supplier+test@example.com', ' abc@sohu.com ']) assert.equal(registrationEmailError(email), '');
  assert.equal(validEmail('user name@example.com'), false);
});
test('长附件名省略中间，保留前后及扩展名，完整原名保持不变', () => {
  const name='供应商营业执照完整文件名称20261106最终版.pdf';
  const shortened=middleEllipsis(name,20);
  assert(shortened.startsWith('供应商'));assert(shortened.endsWith('.pdf'));assert(shortened.includes('...'));
  assert(Array.from(shortened).length<=20);assert.equal(middleEllipsis('证明.pdf',20),'证明.pdf');
  assert.equal(name,'供应商营业执照完整文件名称20261106最终版.pdf');
});
