import { validEmail } from '../../pages/mobile-edit-rules.js';
import { matchesPortalTask } from '../../pages/mobile-portal-filters.js';
import { clearPricingDraft, readPricingDraft, savePricingLine } from '../../pages/mobile-portal-pricing-drafts.js';
import { findDemoProcurementTask } from '../../pages/mobile-portal-procurement.js';
import { createPortalInquiries, createPortalOrders } from '../../pages/mobile-portal-records.js';
import { registrationPasswordError } from '../../pages/mobile-registration-password.js';
import { portalDemoAccounts } from './mock-portal-accounts.js';
import { createMockManagement } from './mock-management.js';
import { applyProfileChange } from './profile-change.js';

const demoAuthCode = '123456';
const demoSecurityCode = '1234';

function authEmailError(email) {
  return validEmail(email) ? null : { field: 'email', message: email ? '请输入正确的注册邮箱' : '请填写注册邮箱' };
}

function authCodeError(code) {
  return code === demoAuthCode ? null : { field: 'code', message: '邮箱验证码错误' };
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

export function createPortalMockApi(management = createMockManagement()) {
  const store = { portalAccount: null };
  const demoPasswords = new Map(portalDemoAccounts.map(({ account, password }) => [account, password]));
  const supplierId = account => 'mock-' + account;
  const getProfile = () => management.getSupplier(supplierId(store.portalAccount?.account ?? portalDemoAccounts[0].account));
  const findAccount = value => portalDemoAccounts.find(({ account }) =>
    account === value || management.getSupplier(supplierId(account))?.email === value)?.account;
  const profileDrafts = new Map();
  const pricingByAccount = new Map();
  const pendingPricing = new Set();
  const pricing = () => {
    const account = store.portalAccount?.account ?? null;
    if (!pricingByAccount.has(account)) pricingByAccount.set(account, { inquiries: createPortalInquiries(), orders: createPortalOrders() });
    return pricingByAccount.get(account);
  };
  const pricingRecords = quote => pricing()[quote ? 'inquiries' : 'orders'];

  return {
    getAccount: () => store.portalAccount && { ...store.portalAccount, email: getProfile().email },
    getEmailVersion: () => getProfile().emailVersion ?? 0,
    isEmailChangeLocked: () => {
      const change = getProfile().profileChange;
      return change?.source === 'management' && change.changesEmail;
    },
    validateLogin({ account = '', password = '', captcha = '' } = {}, expectedCaptcha) {
      const normalized = account.trim();
      if (!normalized) return { field: 'account', message: '请输入账号' };
      if (!password) return { field: 'password', message: '请输入密码' };
      if (captcha.toLowerCase() !== expectedCaptcha) return { field: 'captcha', message: '图形验证码错误' };
      const matching = [...demoPasswords].filter(([, candidate]) => candidate === password).map(([id]) => id);
      const selected = matching.length === 1 ? matching[0] : matching.find(id => id === normalized);
      if (!selected) return { field: 'password', message: '密码错误' };
      return { account: selected, email: management.getSupplier(supplierId(selected)).email };
    },
    sendAuthCode(email, account) {
      const error = authEmailError(email);
      if (error) return error;
      const selected = account && findAccount(account.trim());
      if (selected && management.getSupplier(supplierId(selected)).email !== email.trim()) {
        return { field: 'email', message: '请输入该账号当前的注册邮箱' };
      }
      return { code: demoAuthCode };
    },
    verifyLogin({ account = '', email, code } = {}) {
      const error = authEmailError(email) || authCodeError(code);
      if (error) return error;
      const selected = findAccount(account.trim());
      const profile = selected && management.getSupplier(supplierId(selected));
      if (!profile || profile.email !== email.trim()) return { field: 'email', message: '请输入该账号当前的注册邮箱' };
      store.portalAccount = { account: selected, email: profile.email };
      return store.portalAccount;
    },
    resetPassword({ email, code, password } = {}) {
      const error = authEmailError(email) || authCodeError(code);
      if (error) return error;
      const message = registrationPasswordError(password);
      if (message) return { message };
      const account = findAccount(email.trim());
      if (!account) return { field: 'email', message: '未找到使用该注册邮箱的演示账号' };
      demoPasswords.set(account, password);
      return {};
    },
    logout() {
      profileDrafts.delete(getProfile().id);
      store.portalAccount = null;
    },
    getProfile,
    getProfileDraft: () => profileDrafts.get(getProfile().id),
    getPendingProfile() {
      const profile = getProfile();
      return profile.profileChange ? applyProfileChange(profile, profile.profileChange) : null;
    },
    discardProfileDraft() {
      profileDrafts.delete(getProfile().id);
    },
    submitProfile(profile, before = getProfile()) {
      const id = getProfile().id;
      const result = management.submitPortalInformation(id, profile, before);
      if (!result.error) profileDrafts.delete(id);
      return result;
    },
    updateEmail(email, version = getProfile().emailVersion ?? 0) {
      const account = findAccount(email);
      if (account && supplierId(account) !== getProfile().id) return { error: '该邮箱已用于其他演示账号' };
      return management.updatePortalEmail(getProfile().id, email, version);
    },
    markPasswordChanged(password) {
      if (store.portalAccount) demoPasswords.set(store.portalAccount.account, password);
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
