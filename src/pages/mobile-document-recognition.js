// 宿主负责鉴权、调用识别服务并把结果转换为表单字段。原型不生成识别值。
const licenseFields = ['supplierName', 'creditCode', 'legalRepresentative', 'licenseUntil', 'capital', 'currency', 'address', 'businessScope'];
const bankCardFields = ['bank', 'number'];

export async function recognizeSupplierDocument(kind, file) {
  if (typeof window.__SUPPLIER_DOCUMENT_OCR__ !== 'function') throw new Error('识别服务暂不可用，请手工填写。');
  const fields = kind === 'license' ? licenseFields : bankCardFields;
  const result = await window.__SUPPLIER_DOCUMENT_OCR__({ kind, file });
  const values = normalizeFields(result, fields);
  if (!Object.keys(values).length) throw new Error('未识别到可回填的信息，请手工填写。');
  return values;
}

export async function lookupSupplierEnterprise(name) {
  if (typeof window.__SUPPLIER_ENTERPRISE_LOOKUP__ !== 'function') throw new Error('企业信息查询暂不可用，请手工填写。');
  const result = await window.__SUPPLIER_ENTERPRISE_LOOKUP__({ name });
  const values = normalizeFields(result, licenseFields.filter(key => key !== 'supplierName'));
  if (!Object.keys(values).length) throw new Error('没有查询到可回填的企业信息，请核对名称或手工填写。');
  return values;
}

function normalizeFields(result, fields) {
  return Object.fromEntries(fields.flatMap(key => {
    const value = result?.[key];
    return typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [];
  }));
}
