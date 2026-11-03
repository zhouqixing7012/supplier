import test from 'node:test';
import assert from 'node:assert/strict';
import { canChangeSupplier, canRateSupplier, canReinviteSupplier, canDeleteSupplier } from '../src/pages/mobile-rules.js';
const states = ['草稿', '邀请中', '注册中', '审批中', '注册驳回', '变更中', '已审批'];

test('评分在七种状态中仅支持变更中、已审批，拉黑不额外扩大限制', () => {
  for (const blacklisted of [false, true]) assert.deepEqual(states.filter(status => canRateSupplier({status, blacklisted})), ['变更中', '已审批']);
});
test('变更操作同时要求已审批、未拉黑，兼容两种拉黑字段', () => {
  assert.deepEqual(states.filter(status => canChangeSupplier({status})), ['已审批']);
  for (const flags of [{blacklisted:true},{blackFlag:1},{blackFlag:'1'}]) for (const status of states) assert.equal(canChangeSupplier({status,...flags}),false);
});
test('两个列表删除范围独立，重新邀请仅支持草稿及注册驳回', () => {
  assert.deepEqual(states.filter(status => canDeleteSupplier({status})), ['草稿','注册驳回']);
  assert.deepEqual(states.filter(status => canDeleteSupplier({status},true)), ['草稿','邀请中','注册中','注册驳回']);
  assert.deepEqual(states.filter(status => canReinviteSupplier({status})), ['草稿','注册驳回']);
});
