const service = 'quote';

function segment(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('缺少' + name);
  return encodeURIComponent(value);
}

function taskStatus(status) {
  if (status !== 0 && status !== 1) throw new TypeError('单据状态必须为 0 或 1');
  return status;
}

function pageQuery({ PageIndex, PageSize, purType, startTime, endTime }) {
  if (!Number.isInteger(PageIndex) || PageIndex < 1 || !Number.isInteger(PageSize) || PageSize < 1) {
    throw new TypeError('PageIndex 和 PageSize 必须为正整数');
  }
  return { PageIndex, PageSize, purType, startTime, endTime };
}

// 接受 PDF 4.12 的 DTO 和分页参数，不推断采购类型编号或门户令牌。
export function createPortalHttpApi(request) {
  return {
    listInquiries(params, { signal } = {}) {
      const path = '/inquiry/inquiryInfoPage/' + taskStatus(params.status) + '/' + segment(params.supplierToken, '供应商令牌');
      return request(service, path, {
        query: { ...pageQuery(params), inquiryNumber: params.inquiryNumber, inquiryUnit: params.inquiryUnit },
        signal,
      });
    },
    getInquiry({ supplierToken, inquiryNumber }, { signal } = {}) {
      return request(service, '/inquiry/inquiryInfo/' + segment(supplierToken, '供应商令牌') + '/' + segment(inquiryNumber, '询价单号'), { signal });
    },
    saveQuote(body, { signal } = {}) {
      segment(body.supplierToken, '供应商令牌');
      return request(service, '/inquiry/saveQuote', { method: 'POST', body, signal });
    },
    listOrders(params, { signal } = {}) {
      const path = '/order/orderInfoPage/' + taskStatus(params.status) + '/' + segment(params.supplierToken, '供应商令牌');
      return request(service, path, {
        query: { ...pageQuery(params), orderNumber: params.orderNumber, purCompany: params.purCompany },
        signal,
      });
    },
    getOrder({ orderNumber }, { signal } = {}) {
      return request(service, '/order/orderInfo/' + segment(orderNumber, '订单号'), { signal });
    },
    saveOrder(body, { signal } = {}) {
      return request(service, '/order/saveOrder', { method: 'POST', body, signal });
    },
  };
}
