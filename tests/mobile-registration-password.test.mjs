import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationPasswordError } from '../src/pages/mobile-registration-password.js';

const cases = [
  ['空密码', '', false],
  ['7位不通过', 'Abc1234', false],
  ['8位通过', 'Abc12345', true],
  ['20位通过', 'Aa1' + 'b'.repeat(17), true],
  ['21位不通过', 'Aa1' + 'b'.repeat(18), false],
  ['缺数字不通过', 'Abcdefgh', false],
  ['缺大写不通过', 'abc12345', false],
  ['缺小写不通过', 'ABC12345', false],
  ['特殊字符不作为必填', 'Abc12345!', true],
  ['特殊字符不能替代数字', 'Abcdefg!', false],
];
for (const [name, value, valid] of cases) test(name, () => assert.equal(registrationPasswordError(value) === '', valid));
