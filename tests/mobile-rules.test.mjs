import test from 'node:test';
import assert from 'node:assert/strict';
import { canChangeSupplier, canRateSupplier, canReinviteSupplier, canDeleteSupplier, supplierListActions } from '../src/pages/mobile-rules.js';
const states = ['草稿', '邀请中', '注册中', '审批中', '注册驳回', '变更中', '已审批'];

test('评分在七种状态中仅支持变更中、已审批，拉黑不额外扩大限制', () => {
  for (const blacklisted of [false, true]) assert.deepEqual(states.filter(status => canRateSupplier({status, blacklisted})), ['变更中', '已审批']);
});
test('变更操作同时要求已审批、未拉黑，兼容两种拉黑字段', () => {
  assert.deepEqual(states.filter(status => canChangeSupplier({status})), ['已审批']);
  for (const flags of [{blacklisted:true},{blackFlag:1},{blackFlag:'1'}]) for (const status of states) assert.equal(canChangeSupplier({status,...flags}),false);
});
test('两个列表删除范围独立，重新邀请仅支持草稿及邀请中', () => {
  assert.deepEqual(states.filter(status => canDeleteSupplier({status})), ['草稿','注册驳回']);
  assert.deepEqual(states.filter(status => canDeleteSupplier({status},true)), ['草稿','邀请中','注册中','注册驳回']);
  assert.deepEqual(states.filter(status => canReinviteSupplier({status})), ['草稿','邀请中']);
});

test('供应商查询全部状态可查看审批，修改草稿、重邀和单删属于我的邀请', () => {
  for (const status of states) {
    const action = supplierListActions({ status, inviter: '本人' }, { inviter: '本人' });
    assert.equal(action.detail, true);
    assert.equal(action.approval, true);
    for (const key of ['editDraft', 'reinvite', 'delete', 'editAll']) assert.equal(action[key], false);
  }
});
test('我的邀请按归属及状态开放操作，已审批可分配权限', () => {
  for (const status of states) {
    assert(Object.values(supplierListActions({ status, inviter: '他人' }, { mine: true, inviter: '本人' })).every(value => !value));
    const own = supplierListActions({ status, inviter: '本人' }, { mine: true, inviter: '本人' });
    assert.equal(own.permissions, status === '已审批');
    assert.equal(own.reinvite, ['草稿', '邀请中'].includes(status));
    assert.equal(own.editDraft, status === '草稿');
    assert.equal(own.score, false);
  }
});
test('已合作与拉黑记录分别执行删除和变更限制', () => {
  assert.equal(supplierListActions({status:'草稿',inviter:'本人',hasCooperation:true},{mine:true,inviter:'本人'}).delete,false);
  const action = supplierListActions({status:'已审批',inviter:'本人',blacklisted:true},{mine:true,inviter:'本人'});
  for (const key of ['editAll','bank','permissions','inviter']) assert.equal(action[key], false);
});
