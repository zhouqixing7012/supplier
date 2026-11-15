import assert from 'node:assert/strict';
import test from 'node:test';
import { recognizeCompanyLicense } from '../src/pages/mobile-document-recognition.js';

const isCurrent = () => true;
const identity = { supplierName: '示例企业', creditCode: 'MOCK-CREDIT-001' };
const file = { name: '营业执照.png' };

function useRecognitionServices(t, ocr, lookup) {
  globalThis.window = { __SUPPLIER_DOCUMENT_OCR__: ocr, __SUPPLIER_ENTERPRISE_LOOKUP__: lookup };
  t.after(() => { delete globalThis.window; });
}

test('执照识别后查询企业资料，收到匹配结果才返回完整回填值', async t => {
  let finishLookup;
  let markStarted;
  const lookupResult = new Promise(resolve => { finishLookup = resolve; });
  const lookupStarted = new Promise(resolve => { markStarted = resolve; });
  useRecognitionServices(t, async params => {
    assert.deepEqual(params, { kind: 'license', file });
    return { ...identity, legalRepresentative: 'OCR额外值' };
  }, params => {
    assert.deepEqual(params, { name: identity.supplierName, creditCode: identity.creditCode });
    markStarted();
    return lookupResult;
  });
  let returned = false;
  const pending = recognizeCompanyLicense(file, isCurrent).then(values => { returned = true; return values; });
  await lookupStarted;
  assert.equal(returned, false);
  finishLookup({ ...identity, legalRepresentative: '陈知', industry: '制造业', unexpectedField: '忽略' });
  assert.deepEqual(await pending, { ...identity, legalRepresentative: '陈知', industry: '制造业' });
});

test('执照缺少一个识别项时不查询企业资料', async t => {
  useRecognitionServices(t, async () => ({ supplierName: identity.supplierName }), () => assert.fail('不应调用企业资料查询'));
  await assert.rejects(recognizeCompanyLicense(file, isCurrent), /未能识别完整/);
});

test('企业资料的统一社会信用代码不匹配时不回填', async t => {
  useRecognitionServices(t, async () => identity, async () => ({ creditCode: 'OTHER', address: '其他企业地址' }));
  await assert.rejects(recognizeCompanyLicense(file, isCurrent), /未查询到匹配/);
});

test('企业资料查询失败时提示手工填写', async t => {
  useRecognitionServices(t, async () => identity, async () => { throw new Error('请求超时'); });
  await assert.rejects(recognizeCompanyLicense(file, isCurrent), /查询企业资料失败，请手工填写/);
});

test('替换上传文件后，旧的查询结果作废', async t => {
  let current = true;
  useRecognitionServices(t, async () => identity, async () => {
    current = false;
    return identity;
  });
  assert.equal(await recognizeCompanyLicense(file, () => current), undefined);
});
