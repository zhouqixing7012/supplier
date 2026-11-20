const decimalId = (id) => {
  if (typeof id === 'number' && Number.isSafeInteger(id)) return String(id);
  if (typeof id === 'string' && /^-?\d+$/.test(id)) return id;
  throw new TypeError('供应商 ID 必须是安全整数或十进制字符串');
};

const supplierIds = (ids) => {
  if (!Array.isArray(ids) || !ids.length) throw new TypeError('请填写供应商 ID');
  return ids.map(decimalId).join(',');
};

const safeQuery = (query) => {
  if (query && 'limitSql' in query) throw new TypeError('前端查询不能传 limitSql');
  return query;
};

// 接收接口文档定义的查询参数及 DTO。调用方负责提供实际登录上下文和服务地址。
export function createManagementHttpApi(request) {
  const get = (service, path, query, { signal } = {}) =>
    request(service, path, { method: 'GET', query: safeQuery(query), signal });
  const post = (path, body, { signal } = {}) =>
    request('center', path, { method: 'POST', body, signal });
  const remove = (path, { signal } = {}) =>
    request('center', path, { method: 'DELETE', signal });
  const download = (path, query, { signal } = {}) =>
    request('center', path, { method: 'GET', query: safeQuery(query), responseType: 'blob', signal });
  const getCenter = (path, query, options) => get('center', path, query, options);
  const bySupplierId = (path, supplierId, options) => getCenter(path, { supplierId: decimalId(supplierId) }, options);

  return {
    // 查询条件中的 PageIndex、PageSize 和数值枚举直接使用接口约定。
    getSupplierPage: (query, options) => getCenter('/supplier/supplierBasicInfoPage', query, options),
    getSuppliersByIds: (ids, options) =>
      getCenter('/supplier/supplierBasicInfoList', { supplierIds: supplierIds(ids) }, options),
    getSupplierByCode: (supplierCode, options) =>
      getCenter('/api/supplier/supplierBasicInfo', { supplierCode }, options),
    getBasicAndLicense: (supplierId, options) => bySupplierId('/supplier/supplierBasicAndLicense', supplierId, options),
    getSupplierContacts: (supplierId, options) => bySupplierId('/supplier/supplierContact', supplierId, options),
    getSupplierBanks: (supplierId, options) => bySupplierId('/supplier/supplierBank', supplierId, options),
    getSupplierBusiness: (supplierId, options) => bySupplierId('/supplier/supplierBusiness', supplierId, options),
    getSupplierFinanceOUs: (supplierId, options) => bySupplierId('/supplier/supplierFinanceOU', supplierId, options),
    getSupplierBlacklist: (supplierId, options) => bySupplierId('/supplier/supplierBlacklist', supplierId, options),

    inviteSupplier: (dto, options) => post('/supplier/inviteSupplier', dto, options),
    saveBasicAndLicense: (dto, options) => post('/supplier/supplierBasicAndLicense', dto, options),
    saveSupplier: (dto, options) => post('/supplier/supplierInfo', dto, options),
    saveSupplierContacts: (dto, options) => post('/supplier/supplierContact', dto, options),
    saveSupplierBanks: (dto, options) => post('/supplier/supplierBank', dto, options),
    deleteSupplier: (id, options) => remove('/supplier/deleteSupplierById/' + decimalId(id), options),
    deleteSuppliers: (ids, options) => remove('/supplier/supplierInfo/' + supplierIds(ids), options),
    updateInviters: (dto, options) => post('/supplier/updateInviters', dto, options),

    checkSupplierName: (supplierName, options) => getCenter('/supplier/supplierName', { supplierName }, options),
    checkSocialCreditCode: (socialCreditCode, options) =>
      getCenter('/supplier/socialCreditCode', { socialCreditCode }, options),
    checkBlacklist: (query, options) => getCenter('/supplier/supplierBlackVerification', query, options),
    getCompanyLookup: (supplierName, options) => getCenter('/supplier/tycInfo', { supplierName }, options),

    getHistoricalSupplier: (query, options) => getCenter('/supplier/hisSupplierInfo', query, options),
    submitHistoricalSupplier: (dto, options) => post('/supplier/hisSupplierInfo', dto, options),
    getLatestApprovalId: (supplierCode, options) => getCenter('/supplier/update/approvalId', { supplierCode }, options),
    getTemporaryBasicInfo: (query, options) => getCenter('/supplier/update/supplierBasicInfo', query, options),
    saveTemporaryBasicInfo: (dto, options) => post('/supplier/update/supplierBasicInfo', dto, options),
    getTemporaryBankPage: (query, options) => getCenter('/supplier/update/supplierBankPage', query, options),
    saveTemporaryBank: (dto, options) => post('/supplier/update/supplierBank', dto, options),
    getTemporaryBusinessPage: (query, options) => getCenter('/supplier/update/supplierBusinessPage', query, options),
    saveTemporaryBusiness: (dto, options) => post('/supplier/update/supplierBusiness', dto, options),
    getBasicInfoChangeDetails: (query, options) =>
      getCenter('/supplier/update/supplierBasicInfoChangeDetailList', query, options),
    submitSupplierChange: (dto, options) => post('/supplier/update/supplierInfo', dto, options),
    checkChangedSupplierName: (query, options) => getCenter('/supplier/update/supplierName', query, options),
    checkChangedSocialCreditCode: (query, options) => getCenter('/supplier/update/socialCreditCode', query, options),
    checkTemporaryBankEmpty: (query, options) => getCenter('/supplier/update/checkBankIsEmpty', query, options),
    checkTemporaryContactEmpty: (query, options) => getCenter('/supplier/update/checkContactIsEmpty', query, options),
    checkTemporaryBusinessEmpty: (query, options) =>
      getCenter('/supplier/update/checkBusinessDetpIsEmpty', query, options),

    getBankDirectoryPage: (query, options) => getCenter('/supplier/newBankInfoPage', query, options),
    getBankBranchPage: (query, options) => getCenter('/supplier/newBankBranchInfoPage', query, options),
    getScoreItems: (cooperateTypeId, options) => getCenter('/supplier/score/getScoreItemList', { cooperateTypeId }, options),
    getScorePage: (query, options) => getCenter('/supplier/score/scorerecordlist', query, options),
    getScore: (query, options) => getCenter('/supplier/score/scorerecord', query, options),
    saveScore: (dto, options) => post('/supplier/score/scorerecord', dto, options),

    exportInvitations: (query, options) => download('/supplier/exportInvitation', query, options),
    exportSuppliers: (query, options) => download('/supplier/exportSupplierInfo', query, options),
    getApprovalProgress: (query, options) => get('approval', '/approval/approvalProgress', query, options),
    getApprovalHistory: (supplierCode, options) => get('approval', '/approval/approvalHistory', { supplierCode }, options),
    getEmployeePermissions: (userCode, options) => {
      if (typeof userCode !== 'string' || !userCode.trim() || /^\.{1,2}$/.test(userCode)) {
        throw new TypeError('请填写实际员工编码');
      }
      return get('user', '/api/user/sohuUserPermissions/' + encodeURIComponent(userCode), undefined, options);
    },
  };
}
