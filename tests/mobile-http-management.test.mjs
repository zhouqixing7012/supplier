import assert from 'node:assert/strict';
import test from 'node:test';
import { createManagementHttpApi } from '../src/api/mobile/http-management.js';

const makeApi = () => createManagementHttpApi((service, path, options) => ({ service, path, ...options }));

test('供应商分页查询使用文档中的大小写及真实调用者参数', () => {
  const api = makeApi();
  const signal = new AbortController().signal;
  const query = { PageIndex: 2, PageSize: 20, supplierType: 0, statusList: [3, 6], userCode: 'E001' };
  assert.deepEqual(api.getSupplierPage(query, { signal }), {
    service: 'center', path: '/supplier/supplierBasicInfoPage', method: 'GET', query, signal,
  });
  assert.throws(() => api.getSupplierPage({ ...query, limitSql: 'invalid' }), /limitSql/);
});

test('供应商主键按原始十进制字符串传递，批量删除保留逗号分隔', () => {
  const api = makeApi();
  const id = '9223372036854775807';
  assert.equal(api.getBasicAndLicense(id).query.supplierId, id);
  assert.equal(api.getSuppliersByIds([id, 9]).query.supplierIds, id + ',9');
  assert.equal(api.deleteSupplier(id).path, '/supplier/deleteSupplierById/' + id);
  assert.deepEqual(api.deleteSuppliers([id, 9]), {
    service: 'center', path: '/supplier/supplierInfo/' + id + ',9', method: 'DELETE', signal: undefined,
  });
  assert.throws(() => api.deleteSupplier(Number(id)), /安全整数/);
  assert.throws(() => api.deleteSuppliers([]), /供应商 ID/);
});

test('资料与评分的查询和保存使用同一路径、不同方法', () => {
  const api = makeApi();
  const detail = api.getScore({ scoreRecordId: '9223372036854775807' });
  const body = { id: '9223372036854775807', OPSApproveButtonCode: 'submit' };
  const saved = api.saveScore(body);
  assert.equal(detail.path, '/supplier/score/scorerecord');
  assert.equal(detail.path, saved.path);
  assert.equal(detail.method, 'GET');
  assert.equal(saved.method, 'POST');
  assert.deepEqual(saved.body, body);
  const query = { idList: ['7'], approvalId: 'A1' };
  assert.equal(api.getTemporaryBasicInfo(query).path, api.saveTemporaryBasicInfo({}).path);
  assert.deepEqual(api.getTemporaryBasicInfo(query).query, query);
  assert.equal(api.getTemporaryBusinessPage({ PageIndex: 1, PageSize: 20 }).path, '/supplier/update/supplierBusinessPage');
  assert.equal(api.saveTemporaryBusiness({ supplierId: '7', method: 2 }).path, '/supplier/update/supplierBusiness');
});

test('审批、员工权限和 Excel 导出使用各自的服务和响应类型', () => {
  const api = makeApi();
  const query = { approvalNo: 'A1' };
  assert.deepEqual(api.getApprovalProgress(query), {
    service: 'approval', path: '/approval/approvalProgress', method: 'GET', query, signal: undefined,
  });
  assert.equal(api.getEmployeePermissions('E/001').service, 'user');
  assert.equal(api.getEmployeePermissions('E/001').path, '/api/user/sohuUserPermissions/E%2F001');
  assert.equal(api.exportInvitations({}).path, '/supplier/exportInvitation');
  assert.equal(api.exportSuppliers({}).responseType, 'blob');
});
