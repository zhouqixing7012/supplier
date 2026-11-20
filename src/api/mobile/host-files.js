function hostFunction(key) {
  const method = globalThis.window?.[key];
  return typeof method === 'function' ? method : null;
}

export const mobileFileApi = {
  recognizeLicense(file) {
    const recognize = hostFunction('__SUPPLIER_DOCUMENT_OCR__');
    if (!recognize) throw new Error('识别服务暂不可用，请手工填写。');
    return recognize.call(globalThis.window, { kind: 'license', file });
  },
  hasEnterpriseLookup() {
    return !!hostFunction('__SUPPLIER_ENTERPRISE_LOOKUP__');
  },
  lookupEnterprise(criteria) {
    const lookup = hostFunction('__SUPPLIER_ENTERPRISE_LOOKUP__');
    if (!lookup) throw new Error('企业资料查询暂不可用，请手工填写。');
    return lookup(criteria);
  },
  canDownloadAttachment() {
    return !!hostFunction('__SUPPLIER_ATTACHMENT_DOWNLOAD__');
  },
  downloadAttachment(input) {
    const download = hostFunction('__SUPPLIER_ATTACHMENT_DOWNLOAD__');
    if (!download) throw new Error('附件下载服务暂不可用');
    return download.call(globalThis.window, input);
  },
};
