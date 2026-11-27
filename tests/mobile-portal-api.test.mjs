import test from 'node:test';
import assert from 'node:assert/strict';
import { createMobileMockApi } from '../src/api/mobile/index.js';
import { portalDemoAccounts } from '../src/api/mobile/mock-portal-accounts.js';
import { createPortalMockApi } from '../src/api/mobile/mock-portal.js';
import { createPortalHttpApi } from '../src/api/mobile/http-portal.js';
import { createMobileRequest } from '../src/api/mobile/request.js';

function login(api, index) {
  const { account, email, password } = portalDemoAccounts[index];
  assert.equal(api.validateLogin({ account: ' 任意演示账号 ', password, captcha: 'CBVS' }, 'cbvs').account, account);
  assert.equal(api.validateLogin({ account, password: 'other', captcha: 'CBVS' }, 'cbvs').field, 'password');
  assert.equal(api.validateLogin({ account, password, captcha: 'no' }, 'cbvs').field, 'captcha');
  assert.equal(api.verifyLogin({ account, email, code: 'not-valid' }).field, 'code');
  assert.equal(api.sendAuthCode('other@example.com', account).field, 'email');
  const { code } = api.sendAuthCode(email, account);
  assert.equal(api.verifyLogin({ account, email, code }).email, email);
}

test('资料审批期间供应商可自助修改邮箱，审批仅写入实际变更字段', () => {
  const { management, portal } = createMobileMockApi();
  login(portal, 2);
  const before = portal.getProfile();
  assert.equal(before.status, '变更中');
  assert.equal(portal.isEmailChangeLocked(), false);
  assert.ok(portal.submitProfile(before).error);
  assert.deepEqual(portal.updateEmail('updated@example.com', before.emailVersion), {});
  assert.ok(portal.updateEmail('stale@example.com', before.emailVersion).error);
  assert.equal(portal.getPendingProfile().basic.registerEmail, 'updated@example.com');
  assert.deepEqual(management.resolveInformation(before.id, true), {});
  assert.equal(portal.getProfile().basic.businessScope, '技术服务与项目交付');
  assert.equal(portal.getProfile().basic.registerEmail, 'updated@example.com');
  assert.equal(portal.getAccount().email, 'updated@example.com');
  assert.equal(portal.getPendingProfile(), null);
});

test('邮箱变更审批拦截自助修改和重复提交，通过或驳回后解锁', () => {
  const { management, portal } = createMobileMockApi();
  login(portal, 1);
  const original = portal.getProfile();
  assert.ok(portal.isEmailChangeLocked());
  assert.equal(portal.updateEmail('blocked@example.com').error, '当前注册邮箱正在变更中，待审批完成后方可再次修改');
  assert.ok(management.submitRegistration(original, { id: original.id, editingAll: true, before: original }).error);
  assert.deepEqual(management.resolveInformation(original.id, false), {});
  assert.equal(portal.isEmailChangeLocked(), false);
  assert.equal(portal.getProfile().email, original.email);
  const before = portal.getProfile();
  const basic = { ...before.basic, registerEmail: 'pending@example.com' };
  assert.deepEqual(management.submitRegistration({ ...before, basic }, { id: before.id, editingAll: true, before }), { id: before.id });
  assert.deepEqual(management.resolveInformation(before.id, true), {});
  assert.equal(portal.getAccount().email, 'pending@example.com');
  assert.equal(portal.getProfile().emailVersion, before.emailVersion + 1);
  assert.deepEqual(portal.getProfile().approvalHistory.map(entry => entry.status), ['审批通过', '审批驳回']);
  portal.logout();
  login(portal, 0);
  assert.equal(portal.getProfile().email, portalDemoAccounts[0].email);
  assert.equal(portal.getProcurementNotice({ task: 'quote', record: 'MOCK-INQ-001' })?.number, 'MOCK-INQ-001');
});

test('员工提交时校验所打开的邮箱版本，审批写入前再次核对', () => {
  const entries = new Map();
  const demoStorage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) };
  const { management, portal } = createMobileMockApi({ demoStorage });
  login(portal, 0);
  const before = portal.getProfile();
  portal.updateEmail('new@example.com');
  const profile = { ...before, basic: { ...before.basic, remark: '其他资料', registerEmail: 'requested@example.com' } };
  assert.match(management.submitRegistration(profile, { id: before.id, editingAll: true, before }).error, /请刷新/);
  const refreshed = portal.getProfile();
  const requested = { ...refreshed, basic: { ...refreshed.basic, registerEmail: 'requested@example.com' } };
  assert.deepEqual(management.submitRegistration(requested, { id: refreshed.id, editingAll: true, before: refreshed }), { id: refreshed.id });
  const key = 'supplier:shared-mobile-demo:' + refreshed.id;
  const record = JSON.parse(entries.get(key));
  entries.set(key, JSON.stringify({ ...record, emailVersion: record.emailVersion + 1 }));
  assert.match(management.resolveInformation(refreshed.id, true).error, /请刷新/);
  assert.equal(portal.getAccount().email, 'new@example.com');
  assert.equal(portal.getProfile().status, '变更中');
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
  login(api, 0);
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
