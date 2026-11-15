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

function normalizeFields(result, fields) {
  return Object.fromEntries(fields.flatMap(key => {
    const value = result?.[key];
    return typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [];
  }));
}
