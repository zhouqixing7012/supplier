import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalMockApi } from '../src/api/mobile/mock-portal.js';
import { createPortalHttpApi } from '../src/api/mobile/http-portal.js';
import { createMobileRequest } from '../src/api/mobile/request.js';

test('门户演示登录保持账号隔离，修改邮箱同步资料及待审批快照', () => {
  const api = createPortalMockApi();
  const other = createPortalMockApi();
  assert.equal(api.validateLogin({ account: ' supplier-demo ', password: ' a ', captcha: 'CBVS' }, 'cbvs').account, 'supplier-demo');
  assert.equal(api.validateLogin({ account: 'supplier-demo', password: 'a', captcha: 'no' }, 'cbvs').field, 'captcha');
  assert.equal(api.verifyLogin({ account: 'supplier-demo', email: 'a@example.com', code: 'not-valid' }).field, 'code');
  const { code } = api.sendAuthCode(' a@example.com ');
  assert.equal(api.getProcurementNotice({ task: 'quote', record: 'MOCK-INQ-001' }), null);
  assert.equal(api.verifyLogin({ account: ' supplier-demo ', email: ' a@example.com ', code }).email, 'a@example.com');
  assert.equal(api.getProcurementNotice({ task: 'quote', record: 'MOCK-INQ-001' })?.number, 'MOCK-INQ-001');
  const profile = structuredClone(api.getProfile());
  profile.basic.remark = '待审批修改';
  api.submitProfile(profile);
  profile.basic.remark = '继续打字';
  api.updateEmail('changed@example.com');
  assert.equal(api.getProfile().basic.registerEmail, 'changed@example.com');
  assert.equal(api.getPendingProfile().basic.remark, '待审批修改');
  assert.equal(api.getPendingProfile().email, 'changed@example.com');
  assert.equal(api.getAccount().email, 'changed@example.com');
  api.logout();
  assert.equal(api.getAccount(), null);
  assert.equal(other.getAccount(), null);
  assert.notEqual(other.getProfile().email, api.getProfile().email);
});

test('门户安全验证码绑邮箱、校验错误与有效期保留原型行为', () => {
  const api = createPortalMockApi();
  const issued = api.issueSecurityCode('a@example.com', 500);
  assert.equal(api.verifySecurityCode(issued, 'a@example.com', ' ' + issued.code + ' ', 501), '');
  assert.equal(api.verifySecurityCode(issued, 'b@example.com', issued.code, 501), '请先获取邮箱验证码');
  assert.equal(api.verifySecurityCode(issued, 'a@example.com', issued.code, 500 + 5 * 60 * 1000 + 1), '验证码已过期，请重新获取');
});

test('采购演示按标签与条件查询、暂存明细、提交后移至已处理并清除暂存', async () => {
  const api = createPortalMockApi();
  const [record] = api.listPricingTasks({ quote: false, handled: false, query: '001', filters: { type: '服务器' } });
  assert.equal(record.number, 'DEMO-ORDER-001');
  assert.equal(api.getPricingRecord({ quote: false, number: record.number }), record);
  const line = { ...record.lines[0], rate: '13' };
  await api.savePricingLine(false, record.number, 0, line);
  assert.deepEqual(await api.readPricingDraft(false, record), [line]);
  const submission = api.submitPricing(false, record, { ...record, lines: [line] });
  await assert.rejects(api.submitPricing(false, record, record), /正在提交/);
  await submission;
  assert.equal(api.listPricingTasks({ quote: false, handled: false, query: '001' }).length, 0);
  assert.deepEqual(api.listPricingTasks({ quote: false, handled: true, query: '001' })[0].lines, [line]);
  assert.deepEqual(await api.readPricingDraft(false, record), [undefined]);
});

test('明细暂存清理失败时保留待处理状态，错误不会被替换为演示成功', async t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: { open() { throw new Error('暂存不可用'); } },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous);
    else delete globalThis.indexedDB;
  });
  const api = createPortalMockApi();
  const { code } = api.sendAuthCode('a@example.com');
  api.verifyLogin({ account: 'supplier-demo', email: 'a@example.com', code });
  const [record] = api.listPricingTasks({ quote: true, handled: false });
  await assert.rejects(api.submitPricing(true, record, record), /暂存不可用/);
  assert.equal(api.getPricingRecord({ quote: true, number: record.number }).status, '待处理');
  await assert.rejects(api.submitPricing(true, record, record), /暂存不可用/);
});

test('门户联调适配器采用接口文档的报价、价税路径和参数', async () => {
  const calls = [];
  const request = createMobileRequest({
    services: { quote: 'https://quotes.example.invalid/gateway' },
    fetchImpl: async (url, options) => {
      calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), method: options.method, body: options.body });
      return Response.json({ code: 2000, msg: 'success', data: null });
    },
  });
  const api = createPortalHttpApi(request);
  const params = { status: 0, supplierToken: 'token/test', PageIndex: 1, PageSize: 20, purType: 2 };
  const quote = { id: '9007199254740993', inquiryNumber: 'INQ/1', supplierToken: 'token/test', inquiryLinesDtoList: [{ id: '5', taxPrice: '12.75' }] };
  const order = { id: '9007199254740994', orderNumber: 'PO/2', orderLinesDtoList: [{ id: '7', notaxTotalPrice: '15.50' }] };
  await api.listInquiries({ ...params, inquiryNumber: 'INQ', inquiryUnit: '采购公司甲', startTime: '2026-11-01' });
  await api.getInquiry(quote);
  await api.saveQuote(quote);
  await api.listOrders({ ...params, status: 1, orderNumber: 'PO', purCompany: '采购公司乙', endTime: '2026-11-20' });
  await api.getOrder(order);
  await api.saveOrder(order);
  assert.deepEqual(calls.map(({ path, method }) => [method, path]), [
    ['GET', '/gateway/inquiry/inquiryInfoPage/0/token%2Ftest'],
    ['GET', '/gateway/inquiry/inquiryInfo/token%2Ftest/INQ%2F1'],
    ['POST', '/gateway/inquiry/saveQuote'],
    ['GET', '/gateway/order/orderInfoPage/1/token%2Ftest'],
    ['GET', '/gateway/order/orderInfo/PO%2F2'],
    ['POST', '/gateway/order/saveOrder'],
  ]);
  assert.deepEqual(calls[0].query, { PageIndex: '1', PageSize: '20', purType: '2', startTime: '2026-11-01', inquiryNumber: 'INQ', inquiryUnit: '采购公司甲' });
  assert.deepEqual(calls[3].query, { PageIndex: '1', PageSize: '20', purType: '2', endTime: '2026-11-20', orderNumber: 'PO', purCompany: '采购公司乙' });
  assert.deepEqual(JSON.parse(calls[2].body), quote);
  assert.deepEqual(JSON.parse(calls[5].body), order);
  assert.throws(() => api.listInquiries({ ...params, supplierToken: '' }), /供应商令牌/);
  assert.throws(() => api.listOrders({ ...params, PageIndex: 0 }), /正整数/);
  assert.equal(calls.length, 6);
});
