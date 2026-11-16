import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReviewImport, REVIEW_VERSION, reviewDefinitions, reviewAppliesToScope } from '../src/pages/mobile-review-data.js';
const note = () => ({ id: 'register:note:1', scope: 'register', title: '注册地址', body: '在同一面板内完成地址选择', target: { kind: 'element', type: 'field', label: '注册地址', context: '' } });
test('接受手工字段标注并保留中文内容', () => {
  const [result] = validateReviewImport({ version: REVIEW_VERSION, notes: [note()] });
  assert.equal(result.body, note().body); assert.equal(result.target.label, '注册地址'); assert.equal(result.source, '评审批注');
});
test('接受已知公共组件锚点', () => {
  const result = validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), target: { kind: 'component', key: 'empty' } }] });
  assert.equal(result.length, 1);
});
test('拒绝版本不匹配而非静默当作空文件', () => assert.throws(() => validateReviewImport({ version: 99, notes: [] }), /版本/));
test('拒绝重复编号以免覆盖另一条需求', () => assert.throws(() => validateReviewImport({ version: REVIEW_VERSION, notes: [note(), note()] }), /重复/));
test('拒绝任意CSS选择器或缺失定位信息', () => {
  assert.throws(() => validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), target: { kind: 'selector', selector: 'body' } }] }), /定位/);
  assert.throws(() => validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), target: { kind: 'element', type: 'field', label: '注册地址' } }] }), /完整/);
});
test('拒绝未知组件及对象原型名避免错贴锚点', () => {
  for (const key of ['unknown', 'constructor', '__proto__']) assert.throws(() => validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), target: { kind: 'component', key } }] }), /未支持/);
});
test('拒绝空白详情与超长内容', () => {
  assert.throws(() => validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), body: ' ' }] }), /缺少/);
  assert.throws(() => validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), body: '字'.repeat(4001) }] }), /长度/);
});
test('导入文档链接仅保留项目内正式文档', () => {
  const [result] = validateReviewImport({ version: REVIEW_VERSION, notes: [{ ...note(), doc: 'https://example.invalid', body: '<script>文本仍作为文本保存</script>' }] });
  assert.equal(result.doc, ''); assert.equal(result.body, '<script>文本仍作为文本保存</script>');
});

test('预置标注的27项需求均对应历史优化PRD章节', async () => {
  const { readFile } = await import('node:fs/promises');
  const prd = await readFile(new URL('../docs/mobile-prd.md', import.meta.url), 'utf8');
  const titles = new Set();
  for (const [key, selector, title, body, doc, scopes] of reviewDefinitions) {
    assert(key.startsWith('prd-')); assert(selector); assert(body);
    assert(prd.includes('### ' + title), title);
    assert.equal(doc, 'docs/mobile-prd.md');
    assert(scopes.length > 0);
    assert(!/\\bpx\\b|#[0-9a-f]{6}/i.test(body), title);
    titles.add(title);
  }
  assert.equal(titles.size, 27);
  assert.equal(new Set(reviewDefinitions.map(row => row[0])).size, reviewDefinitions.length);
});
test('评分查询及邮箱需求按真实业务页面隔离', () => {
  const scopes = key => reviewDefinitions.find(row => row[0] === key)[5];
  assert(reviewAppliesToScope(scopes('prd-1.8-person'), 'rating-filter'));
  assert(!reviewAppliesToScope(scopes('prd-1.8-person'), 'filter'));
  assert(!reviewAppliesToScope(scopes('prd-3.4-supplier'), 'portal'));
  assert(reviewAppliesToScope(scopes('prd-3.4-supplier'), 'workspace-account-email'));
  assert(reviewAppliesToScope(scopes('prd-1.24-edit'), 'workspace-info'));
  assert(!reviewAppliesToScope(scopes('prd-1.24-edit'), 'workspace-home'));
});
