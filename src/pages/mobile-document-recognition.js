// 宿主负责鉴权并将服务结果转换为表单字段。
const licenseIdentityFields = ['supplierName', 'creditCode'];
const companyProfileFields = ['establishedAt', 'licenseUntil', 'legalRepresentative', 'companyType', 'industry', 'capital', 'currency', 'address', 'businessScope'];
export async function recognizeCompanyLicense(file, isCurrent) {
  if (typeof window.__SUPPLIER_DOCUMENT_OCR__ !== 'function') throw new Error('识别服务暂不可用，请手工填写。');
  const recognized = await window.__SUPPLIER_DOCUMENT_OCR__({ kind: 'license', file });
  if (!isCurrent()) return;
  const identity = normalizeFields(recognized, licenseIdentityFields);
  const { supplierName, creditCode } = identity;
  if (!supplierName || !creditCode) throw new Error('未能识别完整的供应商名称和统一社会信用代码，请手工填写。');
  const lookup = window.__SUPPLIER_ENTERPRISE_LOOKUP__;
  if (typeof lookup !== 'function') throw new Error('企业资料查询暂不可用，请手工填写。');
  let result;
  try {
    result = await lookup({ name: supplierName, creditCode });
  } catch {
    throw new Error('查询企业资料失败，请手工填写。');
  }
  if (!isCurrent()) return;
  const profile = normalizeFields(result, [...licenseIdentityFields, ...companyProfileFields]);
  if (!Object.keys(profile).length || (profile.creditCode && profile.creditCode.toUpperCase() !== creditCode.toUpperCase())) {
    throw new Error('未查询到匹配的企业资料，请手工填写。');
  }
  return { ...profile, ...identity };
}

function normalizeFields(result, fields) {
  return Object.fromEntries(fields.flatMap(key => {
    const value = result?.[key];
    return typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [];
  }));
}
