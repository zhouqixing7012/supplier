import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesPortalTask, purchaseTypes } from '../src/pages/mobile-portal-filters.js';
const record = {number:'MOCK-001',unit:'演示采购公司',type:'服务器',created:'2026-11-01 09:00:00',end:'2026-11-20 23:59:59'};
test('开始筛创建、结束筛单据结束，并包含结束当天', () => {
  assert.equal(matchesPortalTask(record,'',{start:'2026-11-01',end:'2026-11-20'}),true);
  assert.equal(matchesPortalTask(record,'',{end:'2026-11-19'}),false);
  assert.equal(matchesPortalTask(record,'',{start:'2026-11-02'}),false);
  assert.equal(matchesPortalTask(record,'',{start:'2026-10-31'}),true);
});
test('单号、采购单位、类型与日期组合生效',()=>{
  assert.equal(matchesPortalTask(record,'001',{company:'采购公司',type:'服务器',end:'2026-11-20'}),true);
  assert.equal(matchesPortalTask(record,'002',{}),false);
  assert.equal(matchesPortalTask(record,'',{company:'不存在'}),false);
  assert.equal(matchesPortalTask(record,'',{type:'网络设备'}),false);
});
test('七项枚举及无时间数据处理',()=>{
  assert.deepEqual(purchaseTypes,['电子设备','耗材','网络设备','服务器','服务器备件','网络设备备件','带宽']);
  assert.equal(matchesPortalTask({...record,created:''},'',{start:'2026-11-01'}),false);
  assert.equal(matchesPortalTask({...record,end:''},'',{end:'2026-11-20'}),false);
});
