import { createSessionId } from '../../components/mobile/attachment-session.js';
import { bankChangeCounts, normalizeBankChanges, readBankDraft, writeBankDraft } from '../../pages/mobile-bank-changes.js';
import { cooperation, initialSuppliers, supplierTypes } from '../../pages/mobile-data.js';
import { bankAccountsError, reinviteCandidate } from '../../pages/mobile-edit-rules.js';
import {
  canChangeSupplier, canDeleteSupplier, canInviteHistoricalSupplier, canReinviteSupplier,
  certificateNumber, deleteStatuses, supplierAccount,
} from '../../pages/mobile-rules.js';
import { mobileSupplierSamples, registerMobileSupplierSampleFiles } from '../../pages/mobile-supplier-samples.js';

const currentInviter = '陈才慧';
const now = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
const clone = value => structuredClone(value);
const reject = (message, title) => ({ error: message, title });

export const ratingDetailDemo = {
  id: 'demo-rating-dimensions', name: initialSuppliers[0].name, type: '技术服务', content: '评分明细演示',
  person: currentInviter, department: '', date: '2026-08-14', rated: '2026-10-15 14:00:00',
  status: '已评分', score: '84', dimensions: [4.5, 4, 3.5, 5, 4], comment: '',
};
export const initialRatings = [
  ...cooperation.map(record => ({ ...record, rated: '', status: '未评分', dimensions: [], comment: '' })),
  { id: 'demo-rated', name: '快速创建557348', type: '技术服务', content: '测试PR授权行', person: currentInviter, department: '', date: '2026-08-14', rated: '2026-10-15 13:53:41', status: '已评分', score: '66', dimensions: [], comment: '' },
  ratingDetailDemo,
];

const ratingOperationIds = ['20882171982136639490', '2088217198212136961', '2099345533281612000'];
const within = (date, start, end) => (!start || date.slice(0, 10) >= start) && (!end || date.slice(0, 10) <= end);
const approvalStages = ['业务审批', '领导审批', '财务审批'];
const approvalCompanies = ['演示采购公司', '演示付款公司'];

const registrationApproval = {
  stages: approvalStages,
  companies: approvalCompanies,
  read: id => mobileSupplierSamples.find(record => record.id === id) || mobileSupplierSamples[0],
  decide({ stage, company, opinion, approved }) {
    if (approved && stage === 0 && !company) return reject('请选择付款公司');
    if (approved && stage < approvalStages.length - 1) return { nextStage: stage + 1 };
    return { result: approved ? { status: '审批通过' } : { status: '审批驳回', opinion } };
  },
};

export function queryRatings(records, { mine, query, status, filters }) {
  const keys = ['cooperationType', 'start', 'end', ...(mine ? [] : ['person', 'department'])];
  const activeFilters = Object.fromEntries(keys.filter(key => filters[key]?.trim()).map(key => [key, filters[key]]));
  const matching = records.filter(record => (!mine || record.person === currentInviter)
    && (!query || (mine ? [record.name, record.content] : [record.name, record.content, record.person]).some(value => value?.includes(query)))
    && (!activeFilters.cooperationType || activeFilters.cooperationType === record.type)
    && (!activeFilters.person || record.person.includes(activeFilters.person))
    && (!activeFilters.department || record.department.includes(activeFilters.department))
    && within(record.rated, activeFilters.start, activeFilters.end));
  const statusItems = ['全部', '未评分', '已评分'].map(label => ({
    label, count: label === '全部' ? matching.length : matching.filter(record => record.status === label).length,
  }));
  return { records: matching.filter(record => status === '全部' || record.status === status), activeFilters, statusItems };
}

export function queryRatingOperations({ start, end, names }) {
  const excluded = names.split(/[\n#]/).map(name => name.trim()).filter(Boolean);
  return cooperation.map((record, index) => ({ ...record, created: '2026-08-14 18:52:32', id: ratingOperationIds[index] }))
    .filter(record => within(record.created, start, end) && !excluded.includes(record.person));
}

function supplierListFixture(records, { mine, scene, screenshot }) {
  let list = [...records];
  if (!screenshot) return (mine ? list.filter(record => record.inviter === currentInviter) : list)
    .sort((left, right) => right.date.localeCompare(left.date));
  list = list.filter(record => !record.id.startsWith('mock-'));
  if (scene === 'query-old') return ['old', 'person'].map(id => list.find(record => record.id === id)).filter(Boolean);
  if (scene === 'mine-empty') return [];
  const order = ['733324', '000253', '557348'];
  if (scene === 'query-changing' || mine || ['query-batch', 'query-export'].includes(scene)) {
    list = list.map(record => record.id === '733324' ? { ...record, status: '变更中', updated: '2026-10-14 19:58:23' } : record);
  }
  if (mine || ['query-batch', 'query-export'].includes(scene)) list.sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id));
  if (['query-add', 'query-more'].includes(scene)) list.sort((left, right) => left.id === '557348' ? -1 : right.id === '557348' ? 1 : 0);
  return list.filter(record => !['draft', 'old', 'person'].includes(record.id));
}

function querySupplierList(records, options) {
  const { mine, search, filters } = options;
  const keys = ['type', 'status', 'start', 'end', 'recommended', 'inviter', ...(mine ? [] : ['certificate'])];
  const activeFilters = Object.fromEntries(keys.map(key => [key, filters[key]?.trim()]).filter(([, value]) => value));
  const { type, status, recommended, inviter, certificate, start, end } = activeFilters;
  const matching = supplierListFixture(records, options).filter(record => (!search || record.name.includes(search))
    && (!type || record.type === type) && (!status || record.status === status)
    && (!recommended || (record.basic?.industry || record.industry) === recommended)
    && (!inviter || record.inviter.includes(inviter))
    && (!certificate || String(certificateNumber(record)).toUpperCase().includes(certificate.toUpperCase())));
  return { matching, records: matching.filter(record => within(record.date, start, end)), activeFilters };
}

function registrationPatch({ basic, contacts, banks, draft = false }) {
  const email = (basic.registerEmail || '').trim();
  return {
    name: basic.supplierName, type: basic.type, code: basic.creditCode || '', email,
    banks: clone(banks), basic: { ...clone(basic), registerEmail: email }, contacts: clone(contacts),
    ...(draft ? { updated: now() } : { contact: contacts[0]?.name || '', phone: contacts[0]?.phone || '' }),
  };
}

function handoverFields(record, inviter) {
  return record.mode === '历史供应商' ? { inviter, historicalHandoverTo: inviter, historicalInvite: null } : { inviter };
}

export function createMockManagement({ bankStorage } = {}) {
  registerMobileSupplierSampleFiles();
  let snapshot = {
    suppliers: clone([...initialSuppliers, ...mobileSupplierSamples]),
    ratings: clone(initialRatings),
    bankApplication: null,
    registrationDraft: null,
    registrationResult: null,
    registrationAccount: null,
    registrationInvitation: null,
    registeredAccounts: [],
  };
  const listeners = new Set();
  const update = patch => {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  };
  const getSupplier = id => snapshot.suppliers.find(record => record.id === id);
  const getSupplierDetail = id => getSupplier(id) || snapshot.suppliers[0] || clone(initialSuppliers[0]);
  const patchSupplier = (id, patch, state = {}) => {
    update({ ...state, suppliers: snapshot.suppliers.map(record => record.id === id
      ? { ...record, ...patch, updated: patch.status ? now() : patch.updated ?? record.updated } : record) });
  };
  const findReinvite = name => reinviteCandidate(snapshot.suppliers, name, currentInviter);
  const accounts = ({ historical = false } = {}) => [
    ...snapshot.suppliers.map(record => historical ? supplierAccount(record) : record.account).filter(Boolean),
    ...snapshot.registeredAccounts,
  ];
  return {
    registrationApproval,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSupplier,
    getSupplierDetail,
    querySuppliers: options => querySupplierList(snapshot.suppliers, options),
    exportSuppliers: (criteria, { start, end }) => querySupplierList(snapshot.suppliers, criteria)
      .matching.filter(record => within(record.date, start, end)),
    findReinvite,
    invite(data, targetId) {
      const target = targetId && getSupplier(targetId);
      if (targetId && (!target || target.inviter !== currentInviter || !canReinviteSupplier(target))) {
        return reject('当前状态不能重新邀请，请返回列表核对');
      }
      if (target && data.type !== target.type) return reject('供应商类型与原记录不一致，请返回修改');
      const name = data.name.trim();
      if (data.type !== supplierTypes[1] && (!target || target.name.trim() !== name)
        && snapshot.suppliers.some(record => record.id !== target?.id && record.name.trim() === name)) {
        return reject('供应商名称已存在');
      }
      const payload = { ...data, name, invitationNo: 'DEMO-INV-' + createSessionId(), status: '邀请中', mode: '邀请注册', inviter: target?.inviter || currentInviter, updated: now() };
      if (target) {
        patchSupplier(target.id, payload);
        return { id: target.id };
      }
      const id = createSessionId();
      const record = { ...payload, id, supplierCode: 'DEMO-SUP-' + id, date: now(), score: '未评分', code: '', banks: [], permissions: [] };
      update({ suppliers: [record, ...snapshot.suppliers] });
      return { id };
    },
    deleteSuppliers(ids, { mine, administrator }) {
      if (!mine && !administrator) return reject('当前人员不支持删除');
      const targets = snapshot.suppliers.filter(record => ids.includes(record.id));
      if (mine && targets.some(record => record.inviter !== currentInviter)) return reject('当前供应商已交接，请返回列表核对');
      if (targets.some(record => record.hasCooperation)) return reject('发生过合作的供应商不能删除，请重新选择。', '无法删除');
      if (!targets.length || targets.length !== ids.length || targets.some(record => !canDeleteSupplier(record, mine))) {
        return reject('所选记录状态已变化，仅' + deleteStatuses(mine).join('、') + '可删除，请重新选择。', '无法删除');
      }
      update({ suppliers: snapshot.suppliers.filter(record => !ids.includes(record.id)) });
      return { count: targets.length };
    },
    changeInviters(ids, inviter, { batch = false } = {}) {
      if (!inviter?.trim()) return reject('请选择新邀请人');
      const targets = snapshot.suppliers.filter(record => ids.includes(record.id));
      if (batch) {
        const title = '无法变更邀请人';
        if (!targets.length || targets.length !== ids.length || targets.some(record => record.inviter !== currentInviter || !canChangeSupplier(record))) {
          return reject('所选供应商状态已变化，请重新选择已审批且未拉黑的供应商。', title);
        }
        if (targets.some(record => record.inviter === inviter)) return reject('新邀请人不能与所选供应商的原邀请人相同。', title);
        update({ suppliers: snapshot.suppliers.map(record => ids.includes(record.id)
          ? { ...record, ...handoverFields(record, inviter), updated: now() } : record) });
      } else {
        const [record] = targets;
        if (!record || !canChangeSupplier(record)) return reject('当前状态不能变更邀请人');
        if (record.inviter === inviter) return reject('新邀请人不能与原邀请人相同');
        patchSupplier(record.id, { ...handoverFields(record, inviter),
          status: record.mode === '历史供应商' || record.inviter === currentInviter ? '已审批' : '变更中' });
      }
      return { count: targets.length };
    },
    registrationDuplicates(basic, excludeId) {
      const normalize = value => String(value || '').trim().replaceAll('（', '(').replaceAll('）', ')');
      const candidates = snapshot.suppliers.filter(record => record.id !== excludeId && ['审批中', '变更中', '已审批'].includes(record.status));
      return {
        supplierName: basic.type !== supplierTypes[1] && candidates.some(record => normalize(record.name) === normalize(basic.supplierName)),
        creditCode: basic.creditCode && candidates.some(record => record.code === basic.creditCode),
      };
    },
    saveRegistrationDraft(input, { id, invited, invitation } = {}) {
      if (invited) {
        const { basic, contacts, banks } = registrationPatch({ ...input, draft: true });
        update({ registrationDraft: { basic, contacts, banks, step: input.step },
          registrationInvitation: snapshot.registrationInvitation || invitation || null });
        return {};
      }
      if (id) {
        const record = getSupplier(id);
        if (!record || record.inviter !== currentInviter || record.status !== '草稿') return reject('当前记录不支持修改草稿');
        patchSupplier(id, registrationPatch({ ...input, draft: true }));
        return { id };
      }
      const newId = createSessionId();
      const record = { ...registrationPatch({ ...input, draft: true }), id: newId, status: '草稿', inviter: currentInviter,
        mode: '代注册', date: now(), permissions: [], score: '未评分' };
      update({ suppliers: [record, ...snapshot.suppliers] });
      return { id: newId };
    },
    submitRegistration(input, { id, editingAll, invited } = {}) {
      const patch = registrationPatch(input);
      if (invited) {
        const account = snapshot.registrationAccount?.account;
        const registrationResult = { ...patch, account, status: '审批中', submittedAt: now() };
        patchSupplier(id, { ...patch, account, status: '审批中' }, {
          registrationResult, registrationAccount: null, registrationInvitation: null, registrationDraft: null,
        });
        return { id };
      }
      if (editingAll) {
        const record = getSupplier(id);
        if (!record || record.inviter !== currentInviter || !canChangeSupplier(record)) return reject('当前状态不能修改全部信息，请返回列表核对');
        patchSupplier(id, { pendingInformation: patch, status: '变更中' });
        return { id };
      }
      if (id) {
        const record = getSupplier(id);
        if (!record || record.inviter !== currentInviter || record.status !== '草稿') return reject('当前记录不支持修改草稿');
        patchSupplier(id, { ...patch, status: '审批中' });
        return { id };
      }
      const newId = createSessionId();
      update({ suppliers: [{ ...patch, id: newId, supplierCode: 'DEMO-SUP-' + newId, status: '审批中',
        mode: '代注册', inviter: currentInviter, date: now(), updated: now(), score: '未评分', permissions: [] }, ...snapshot.suppliers] });
      return { id: newId };
    },
    getRegistrationInvitation: () => snapshot.registrationInvitation || snapshot.suppliers.find(record => record.status === '邀请中'),
    listAccounts: accounts,
    registerInvitedAccount(invitation, account) {
      const record = getSupplier(invitation?.id);
      if (!record || record.status !== '邀请中') return reject('该地址已失效，请联系邀请人重新邀请！');
      if (accounts().some(name => name.trim() === account.account)) return reject('该账号已存在，请更换账号');
      patchSupplier(record.id, { account: account.account, status: '注册中' }, {
        registrationAccount: clone(account), registrationInvitation: clone(invitation),
        registeredAccounts: [...snapshot.registeredAccounts, account.account],
      });
      return { id: record.id };
    },
    historicalInviteTarget(token) {
      return token && snapshot.suppliers.find(record => record.historicalInvite?.token === token
        && record.historicalInvite.expiresAt > Date.now() && canInviteHistoricalSupplier(record, record.inviter));
    },
    sendHistoricalInvite(id, data) {
      const record = getSupplier(id);
      if (!canInviteHistoricalSupplier(record, currentInviter)) return reject('当前记录不能重新邀请注册账号');
      const token = createSessionId();
      patchSupplier(id, { historicalInvite: { contact: data.contact, email: data.email, phone: data.phone,
        token, expiresAt: Date.now() + 7 * 86400000 }, invitationNo: 'DEMO-INV-' + token, updated: now() });
      return { token };
    },
    registerHistoricalAccount(token, account) {
      const record = snapshot.suppliers.find(item => item.historicalInvite?.token === token
        && item.historicalInvite.expiresAt > Date.now() && canInviteHistoricalSupplier(item, item.inviter));
      if (!record) return reject('该地址已失效，请联系邀请人重新邀请！');
      if (accounts({ historical: true }).some(name => name.trim() === account)) return reject('该账号已存在，请更换账号');
      patchSupplier(record.id, { account, email: record.historicalInvite.email, historicalInvite: null, updated: now() },
        { registeredAccounts: [...snapshot.registeredAccounts, account] });
      return { id: record.id };
    },
    getBankDraft(id) {
      const record = getSupplierDetail(id);
      return normalizeBankChanges(record.banks, clone(readBankDraft(record.id, bankStorage) || record.banks));
    },
    saveBankDraft(id, entries) {
      const record = getSupplier(id);
      if (!record) return reject('账户保存失败，请重试');
      const next = normalizeBankChanges(record.banks, entries);
      try { writeBankDraft(record.id, next.some(bank => bank.change) ? next : null, bankStorage); }
      catch { return reject('账户保存失败，请重试'); }
      return { records: next };
    },
    submitBankChanges(id, entries) {
      const record = getSupplier(id);
      if (!record || !canChangeSupplier(record)) return reject('当前供应商状态不能发起银行变更');
      if (!bankChangeCounts(record.banks, entries).total) return reject('请先修改银行信息');
      const error = bankAccountsError(entries, record.type === supplierTypes[0], record.banks);
      if (error) return reject(error);
      try { writeBankDraft(id, null, bankStorage); } catch { return reject('提交失败，请重试'); }
      patchSupplier(id, { pendingBanks: clone(entries), status: '变更中' });
      return {};
    },
    submitPermissions(id, entries, { mine }) {
      const record = getSupplier(id);
      if (!record || !canChangeSupplier(record) || (mine && record.inviter !== currentInviter)) {
        return reject('当前人员或状态不支持分配权限');
      }
      if (!entries.some(entry => entry.change)) return reject('请先新增、修改或删除权限');
      patchSupplier(id, { pendingPermissions: clone(entries), status: '变更中' });
      return {};
    },
    queryRatings: filters => queryRatings(snapshot.ratings, filters),
    queryRatingOperations,
    saveRating(record) {
      const next = { ...clone(record), id: record.id || createSessionId(), status: '已评分', rated: record.rated || now(), score: '' };
      const { ratings } = snapshot;
      update({ ratings: ratings.some(item => item.id === next.id) ? ratings.map(item => item.id === next.id ? next : item) : [next, ...ratings] });
      return { id: next.id };
    },
    saveBankApplication: data => update({ bankApplication: clone(data) }),
    clearBankApplication: () => update({ bankApplication: null }),
  };
}
