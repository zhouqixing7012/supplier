import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTax, isDecimal, quoteError, remainingTime } from '../src/pages/mobile-portal-pricing.js';

test('13%按确认公式计算，单价14位有效数字，金额两位', () => {
  assert.deepEqual(calculateTax({ grossUnit: '190', gross: '190', quantity: '1' }, '13'), { grossUnit: '190', gross: '190', quantity: '1', rate: '13', netUnit: '168.14159292035', net: '168.14', tax: '21.86' });
});
test('以含税金额计算金额，避免与数量乘单价混淆', () => {
  const next = calculateTax({ grossUnit: '190', gross: '200', quantity: '1' }, '13');
  assert.equal(next.netUnit, '168.14159292035'); assert.equal(next.net, '176.99'); assert.equal(next.tax, '23.01');
});
test('零税率、精确结果至少两位、小金额及四舍五入边界', () => {
  assert.equal(calculateTax({ grossUnit: '10', gross: '20' }, '0').netUnit, '10.00');
  const next = calculateTax({ grossUnit: '0.03', gross: '0.03' }, '20');
  assert.equal(next.netUnit, '0.025'); assert.equal(next.net, '0.03'); assert.equal(next.tax, '0.01');
});
test('大金额不经过浮点，清空税率清空派生结果', () => {
  assert.equal(calculateTax({ grossUnit: '1', gross: '9007199254740993.99' }, '0').net, '9007199254740993.99');
  assert.deepEqual(calculateTax({ grossUnit: '190', gross: '190', netUnit: '1', net: '1', tax: '1' }, ''), { grossUnit: '190', gross: '190', netUnit: '', net: '', tax: '', rate: '' });
});
test('非法数字不会计算，逐行报价必填校验', () => {
  for (const value of ['-1', 'NaN', '1e2', '', '1.']) assert.equal(isDecimal(value), false);
  assert.throws(() => calculateTax({ grossUnit: '190', gross: '190' }, 'abc'));
  assert.equal(quoteError([{ grossUnit: '100', rate: '0' }]), '');
  assert.match(quoteError([{ grossUnit: '100', rate: '13' }, { grossUnit: '', rate: '13' }]), /第2项/);
});
test('剩余时间区分完成、截止及计时', () => {
  assert.equal(remainingTime({ inquiryStatus: '定价完成', end: '2026-01-01' }), '已完成');
  assert.equal(remainingTime({ end: '2026-01-01' }, new Date('2026-01-02').getTime()), '已过期');
  assert.equal(remainingTime({ end: '2026-01-03 03:04:00' }, new Date('2026-01-01T00:00:00').getTime()), '2天3小时4分');
});
