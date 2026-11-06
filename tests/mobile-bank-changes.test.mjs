import test from 'node:test';
import assert from 'node:assert/strict';
import { bankChange, bankChangeCounts, normalizeBankChanges, readBankDraft, writeBankDraft } from '../src/pages/mobile-bank-changes.js';
const base = [{ id: 'one', bank: '银行A', name: '原名称', number: '00123', proof: '旧证明.pdf' }, { id: 'two', bank: '银行B', number: '00456' }];
test('银行按稳定账户编号对比，排序变化不会错配，账号保留原文', () => {
 const changed={ ...base[0], name:'新名称', number:'00009' };
 assert.deepEqual(bankChange(base,changed).fields.map(x=>[x.key,x.previous,x.next]),[['name','原名称','新名称'],['number','00123','00009']]);
 assert.equal(bankChange(base,[...base].reverse()[0]).action,'');
});
test('开户证明可修改和提交，但不产生任何证明diff行', () => {
 const result=bankChange(base,{...base[0],proof:'新证明.pdf'});
 assert.equal(result.action,'修改');assert.deepEqual(result.fields,[]);
});
test('修改恢复原值、删除尚未提交新增账户，均消除无效变更', () => {
 assert.equal(normalizeBankChanges(base,[{...base[0],change:'修改'}])[0].change,'');
 assert.deepEqual(normalizeBankChanges(base,[{id:'new',change:'删除'}]),[]);
});
test('新增修改删除分别计数', () => {
 const entries=[{...base[0],name:'新名称'},{...base[1],change:'删除'},{id:'new',number:'00000'}];
 assert.deepEqual(bankChangeCounts(base,entries),{新增:1,修改:1,删除:1,total:3});
});
test('待提交字段跨重新进入保留，按供应商隔离，提交或放弃后清除', () => {
 const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 writeBankDraft('supplier-one',base,storage);assert.deepEqual(readBankDraft('supplier-one',storage),base);
 assert.equal(readBankDraft('supplier-two',storage),null);writeBankDraft('supplier-one',null,storage);assert.equal(readBankDraft('supplier-one',storage),null);
});
