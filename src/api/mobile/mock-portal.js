import { exampleBank } from '../../pages/mobile-data.js';
import { validEmail } from '../../pages/mobile-edit-rules.js';
import { matchesPortalTask } from '../../pages/mobile-portal-filters.js';
import { clearPricingDraft, readPricingDraft, savePricingLine } from '../../pages/mobile-portal-pricing-drafts.js';
import { findDemoProcurementTask } from '../../pages/mobile-portal-procurement.js';
import { createPortalInquiries, createPortalOrders } from '../../pages/mobile-portal-records.js';
import { registrationPasswordError } from '../../pages/mobile-registration-password.js';
import { filledBasic } from './mock-registration-fixture.js';

const demoAuthCode = '123456';
const demoSecurityCode = '1234';

function authEmailError(email) {
  return validEmail(email) ? null : { field: 'email', message: email ? '请输入正确的注册邮箱' : '请填写注册邮箱' };
}

function authCodeError(code) {
  return code === demoAuthCode ? null : { field: 'code', message: '邮箱验证码错误' };
}

function createProfile() {
  const basic = {
    ...structuredClone(filledBasic),
    supplierName: '协同门户演示供应商',
    address: '北京市/北京市/朝阳区 演示地址',
    businessScope: '技术与电子产品服务',
    cooperation: '平台技术服务',
    businessAdvantage: '技术服务与项目交付经验',
  };
  return {
    name: basic.supplierName,
    type: basic.type,
    email: basic.registerEmail,
    basic,
    status: '已审批',
    contacts: [{ id: 'portal-contact', name: '演示联系人', phone: '13800000000', email: 'supplier@example.com', department: '', job: '', wechat: '', note: '' }],
    banks: [{ ...structuredClone(exampleBank), name: basic.supplierName }],
  };
}

function issuePortalSecurityCode(target, now = Date.now()) {
  return { target, code: demoSecurityCode, expires: now + 5 * 60 * 1000 };
}

function verifyPortalSecurityCode(issued, target, code = '', now = Date.now()) {
  if (!code.trim()) return '请输入邮箱验证码';
  if (!issued || issued.target !== target) return '请先获取邮箱验证码';
  if (now > issued.expires) return '验证码已过期，请重新获取';
  return code.trim() === issued.code ? '' : '邮箱验证码错误';
}

export function createPortalMockApi() {
  const store = { portalAccount: null, portalProfile: createProfile(), portalDraft: null, portalPending: null };
  const pricingByAccount = new Map();
  const pendingPricing = new Set();
  const pricing = () => {
    const account = store.portalAccount?.account ?? null;
    if (!pricingByAccount.has(account)) pricingByAccount.set(account, { inquiries: createPortalInquiries(), orders: createPortalOrders() });
    return pricingByAccount.get(account);
  };
  const pricingRecords = quote => pricing()[quote ? 'inquiries' : 'orders'];

  return {
    getAccount: () => store.portalAccount,
    validateLogin({ account = '', password = '', captcha = '' } = {}, expectedCaptcha) {
      const normalized = account.trim();
      if (!normalized) return { field: 'account', message: '请输入账号' };
      if (!password) return { field: 'password', message: '请输入密码' };
      if (captcha.toLowerCase() !== expectedCaptcha) return { field: 'captcha', message: '图形验证码错误' };
      return { account: normalized };
    },
    sendAuthCode: email => authEmailError(email) || { code: demoAuthCode },
    verifyLogin({ account = '', email, code } = {}) {
      const error = authEmailError(email) || authCodeError(code);
      if (error) return error;
      store.portalAccount = { account: account.trim() || '演示供应商账号', email: email.trim() };
      return store.portalAccount;
    },
    resetPassword({ email, code, password } = {}) {
      const error = authEmailError(email) || authCodeError(code);
      if (error) return error;
      const message = registrationPasswordError(password);
      return message ? { message } : {};
    },
    logout() {
      store.portalDraft = null;
      store.portalAccount = null;
    },
    getProfile: () => store.portalProfile,
    getProfileDraft: () => store.portalDraft,
    getPendingProfile: () => store.portalPending,
    discardProfileDraft() {
      store.portalDraft = null;
    },
    submitProfile(profile) {
      store.portalPending = structuredClone(profile);
      store.portalDraft = null;
    },
    updateEmail(email) {
      const sync = profile => profile ? { ...profile, email, basic: { ...profile.basic, registerEmail: email } } : profile;
      store.portalProfile = sync(store.portalProfile);
      store.portalDraft = sync(store.portalDraft);
      store.portalPending = sync(store.portalPending);
      if (store.portalAccount) store.portalAccount = { ...store.portalAccount, email };
    },
    markPasswordChanged() {
      store.portalPasswordChangedAt = new Date().toISOString();
    },
    issueSecurityCode: issuePortalSecurityCode,
    verifySecurityCode: verifyPortalSecurityCode,
    listPricingTasks({ quote, handled, query = '', filters = {} }) {
      return pricingRecords(quote).filter(record => (record.status === '已处理') === handled
        && matchesPortalTask(record, query, filters));
    },
    getPricingRecord({ quote, number, sample, tab }) {
      const records = pricingRecords(quote);
      return records.find(record => record.number === number)
        ?? (sample ? records.find(record => (record.status === '已处理') === (Number(tab) % 2 === 1)) : null)
        ?? (!quote && !number ? records[0] : null);
    },
    getProcurementNotice(notice) {
      return findDemoProcurementTask(notice, store.portalAccount, pricingRecords(notice?.task === 'quote'));
    },
    readPricingDraft: (quote, record) => readPricingDraft(store, quote, record),
    savePricingLine: (quote, number, index, line) => savePricingLine(store, quote, number, index, line),
    async submitPricing(quote, record, draft) {
      const records = pricing();
      const key = quote ? 'inquiries' : 'orders';
      if (!records[key].includes(record) || record.status !== '待处理') throw new Error('采购单据状态已变化');
      if (pendingPricing.has(record)) throw new Error('采购单据正在提交');
      const next = { ...structuredClone(draft), status: '已处理', ...(quote ? { inquiryStatus: '定价完成' } : {}) };
      pendingPricing.add(record);
      try {
        await clearPricingDraft(store, quote, record);
        records[key] = records[key].map(item => item === record ? next : item);
      } finally {
        pendingPricing.delete(record);
      }
    },
    async uploadTravelBill(type, files) {
      const upload = globalThis.window?.__PORTAL_TRAVEL_UPLOAD__;
      if (typeof upload !== 'function') return { success: true, demo: true };
      const result = await upload({ type, files, timeoutMs: 180000 });
      if (result === false || result?.success === false) throw new Error(result?.message || '差旅系统未确认上传成功');
      return result;
    },
    async downloadTravelTemplate() {
      const download = globalThis.window?.__PORTAL_TRAVEL_TEMPLATE__;
      if (typeof download !== 'function') throw new Error('模板暂不可用，请联系管理员');
      const file = await download();
      if (!(file?.blob instanceof Blob) || !file.blob.size || !file.name) throw new Error('模板文件获取失败，请重试');
      return file;
    },
  };
}
