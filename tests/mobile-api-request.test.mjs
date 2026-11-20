import assert from 'node:assert/strict';
import test from 'node:test';
import { createMobileRequest, MobileApiError } from '../src/api/mobile/request.js';

const json = (data, init) => Response.json(data, init);
const service = { center: 'https://supplier.example.invalid/gateway/' };

test('移动端请求保留网关前缀与参数大小写，兼容字符串长整数和数组', async () => {
  const request = createMobileRequest({
    services: service,
    getHeaders: () => ({ 'X-Demo-Context': 'test' }),
    fetchImpl: async (url, options) => {
      assert.equal(url.origin + url.pathname, 'https://supplier.example.invalid/gateway/supplier/supplierBasicInfoPage');
      assert.deepEqual([...url.searchParams], [
        ['PageIndex', '2'], ['statusList', '0'], ['statusList', '6'], ['supplierId', '9223372036854775807'],
      ]);
      assert.equal(options.headers.get('X-Demo-Context'), 'test');
      assert.equal(options.credentials, 'same-origin');
      return json({ code: 2000, msg: 'success', data: { currentPage: 2, data: [] } });
    },
  });
  const result = await request('center', '/supplier/supplierBasicInfoPage', {
    query: { PageIndex: 2, statusList: [0, 6], supplierId: '9223372036854775807', supplierName: null },
  });
  assert.equal(result.currentPage, 2);
});

test('提交发送 JSON，成功时接受缺省的 data', async () => {
  const request = createMobileRequest({
    services: service,
    fetchImpl: async (_, options) => {
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.get('Content-Type'), 'application/json');
      assert.deepEqual(JSON.parse(options.body), { supplierType: 0, supplierName: '演示企业' });
      return json({ code: 2000 });
    },
  });
  assert.equal(await request('center', '/supplier/inviteSupplier', { method: 'POST', body: { supplierType: 0, supplierName: '演示企业' } }), null);
});

test('缺地址、不安全的数值、跨服务路径和内部参数在发请求前被拒绝', async () => {
  const request = createMobileRequest({ services: service, fetchImpl: () => assert.fail('不应发送请求') });
  const configError = error => error instanceof MobileApiError && error.kind === 'config';
  await assert.rejects(request('approval', '/approval/approvalProgress'), configError);
  await assert.rejects(request('center', '/supplier/supplierBasicInfoPage', { query: { limitSql: 'any' } }), configError);
  await assert.rejects(request('center', '/supplier/supplierBasicInfoPage', { query: { supplierId: 9007199254740992 } }), configError);
  await assert.rejects(request('center', '/../other'), configError);
  await assert.rejects(request('center', '//other.example.invalid/path'), configError);
});

test('区分业务、HTTP、网络及响应错误，并保留取消信号', async () => {
  const make = fetchImpl => createMobileRequest({ services: service, fetchImpl });
  const path = '/supplier/supplierInfo';
  for (const [request, kind] of [
    [make(async () => json({ code: 4001, msg: '当前状态不可办理' })), 'business'],
    [make(async () => json({}, { status: 403 })), 'http'],
    [make(async () => { throw new TypeError('network'); }), 'network'],
    [make(async () => json({ accepted: true })), 'response'],
  ]) {
    await assert.rejects(request('center', path), error => {
      assert.equal(error.kind, kind);
      if (kind === 'business') assert.equal(error.message, '当前状态不可办理');
      return true;
    });
  }
  const controller = new AbortController();
  controller.abort();
  const abort = make(async (_, { signal }) => { assert.equal(signal, controller.signal); signal.throwIfAborted(); });
  await assert.rejects(abort('center', path, { signal: controller.signal }), { name: 'AbortError' });
});

test('导出返回二进制文件，JSON 错误不会被当成文件下载', async () => {
  const path = '/supplier/exportInvitation';
  const file = createMobileRequest({ services: service, fetchImpl: async () => new Response('xlsx', {
    headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  }) });
  assert.equal(await (await file('center', path, { responseType: 'blob' })).text(), 'xlsx');
  const denied = createMobileRequest({ services: service, fetchImpl: async () => json({ code: 4001, msg: '不能导出' }) });
  await assert.rejects(denied('center', path, { responseType: 'blob' }), { kind: 'business', message: '不能导出' });
});
