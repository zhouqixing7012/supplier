import { BankChangeCard } from './mobile-bank-change-view.jsx';
import { bankChangeCounts, normalizeBankChanges, readBankDraft, writeBankDraft } from './mobile-bank-changes.js';
import { createSessionId } from './mobile-interaction.jsx';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, MailPlus, FilePenLine, Landmark, Download, Filter, ListChecks, Plus, Search, Signal, Wifi, Battery, X, CircleUserRound } from 'lucide-react';
import { Actions, RecordCollection, AttachmentViewer, AppliedFilters, Confirm, Empty, Field, FilterButton, Header, RegistrationSteps, Overlay, Row, ScreenshotTip, SearchBox, Section } from './mobile-ui.jsx';
import { AddressForm, BankCard, BankFields, BasicFields, ContactFields, InviteForm, PermissionForm, ReferenceList, bankError, blankBank, fieldsFor, filledBasic } from './mobile-forms.jsx';
import { Approval, BankApplication, FilterView, PermissionCard, RatingList, SupplierDetail, SupplierList, Tabs } from './mobile-views.jsx';
import { bankNames, cooperation, exampleBank, initialSuppliers, screenshotScenes, supplierTypes } from './mobile-data.js';
import { BankApplicationForm, RatingEditor, RatingOperations, RatingWorkspace, initialRatings } from './mobile-workflows.jsx';
import { InteractionProvider, SwipeArea, useInteraction, useDirtyForm, useBackLayer, usePageIsolation, attachmentName } from './mobile-interaction.jsx';
import { SupplierExport, exportSupplierRows } from './mobile-export.jsx';
import { canChangeSupplier, canRateSupplier, canReinviteSupplier, canDeleteSupplier, deleteStatuses } from './mobile-rules.js';
import { PortalWorkspace } from './mobile-portal.jsx';
import { RegistrationPreview } from './mobile-registration-preview.jsx';
import { SupplierAccountRegistration } from './mobile-account-registration.jsx';
import { ChangeComparison } from './mobile-changes.jsx';
import { informationSteps, reinviteCandidate, validEmail, registrationEmailError } from './mobile-edit-rules.js';
import { PrototypeReview } from './mobile-review.jsx';
import { ScreenshotCompare } from './mobile-screenshot-compare.jsx';
import './mobile-supplier.css';
import './mobile-refinement.css';
import './mobile-motion.css';
import { runMotion, useMotionStructure, usePanelState, MotionPresence } from './mobile-motion.jsx';
import { routeMotion } from './mobile-motion.js';

const clone = value => structuredClone(value);
const currentInviter = '陈才慧';
const readRoute = () => decodeURIComponent(window.location.hash.replace(/^#\/mobile\/?/, '')) || 'query';
const now = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
const mobileTitle = scene => {
  if (scene === 'workspace-account-email') return '修改注册邮箱';
  if (scene === 'workspace-account') return '供应商协同门户';
  if (scene === 'workspace-account-password') return '修改密码';
  if (scene === 'workspace-tasks') return '采购业务';
  if (scene === 'workspace-changes') return '资料变更预览';
  if (scene === 'workspace-approval') return '资料变更审批';
  if (scene === 'workspace-info') return '供应商信息';
  if (scene === 'workspace-travel') return '差旅账单录入';
  if (scene === 'workspace-quote-detail') return '报价详情';
  if (scene.startsWith('workspace-tax')) return '价税拆分详情';
  if (scene.startsWith('workspace')) return '供应商协同门户';
  if (scene.startsWith('portal')) return '协同门户登录';
  if (scene.startsWith('detail')) return '供应商详情';
  if (scene.startsWith('approval')) return '审批记录';
  if (scene === 'register-supplier') return '供应商注册';
  if (scene === 'supplier-registration-result') return '注册结果';
  if (scene.startsWith('register')) return scene.includes('edit') ? '修改供应商信息' : '供应商代注册';
  if (scene === 'inviter-batch') return '批量变更邀请人';
  if (scene.startsWith('invite')) return scene.startsWith('inviter') ? '变更邀请人' : '邀请供应商';
  if (['people', 'people-empty'].includes(scene)) return '选择新邀请人';
  if (scene === 'bank-select') return '选择开户银行';
  if (scene === 'branch-select') return '选择银行分行';
  if (scene === 'permission-form') return '新增供应商权限';
  if (['expiry', 'address', 'region'].includes(scene)) return '供应商代注册';
  if (scene === 'bank' || scene === 'bank-tip') return '维护银行信息';
  if (scene.startsWith('bank-form')) return '编辑银行账户';
  if (scene.startsWith('permission')) return '维护供应商权限';
  if (scene === 'rating-edit') return '填写供应商评分';
  if (scene === 'rating-detail') return '供应商评分详情';
  if (scene === 'filter') return '筛选供应商';
  if (['bank-application-form', 'application-empty'].includes(scene)) return '银行信息申请';
  if (scene === 'bank-application') return '银行信息申请须知';
  if (scene === 'information-change') return '资料变更对比';
  if (['rating-filter', 'department'].includes(scene)) return '筛选评分';
  return '供应商管理平台';
};

function SceneGallery() {
  return <main className="m-scene-gallery"><header><a href="#/mobile">返回移动端原型</a><a href="#/login">电脑端</a><h1>移动端截图复刻</h1><p>47 张截图对应 47 个独立页面或状态。业务内容均为原型演示样本。</p></header><ol>{screenshotScenes.map(s => <li key={s.time}><a href={s.href}><span>{String(s.index).padStart(2, '0')}</span><strong>{s.title}</strong><small>{s.filename}</small></a></li>)}</ol></main>;
}

export default function MobileSupplier() { return <InteractionProvider><MobileApp /></InteractionProvider>; }
function MobileApp() {
  const motionRoot = useRef(document.getElementById('root'));
  useMotionStructure(motionRoot);
  const interaction = useInteraction();
  usePageIsolation();
  const views = useRef({});
  const listReturn = useRef('query');
  const currentRoute = useRef(readRoute());
  const historyIndex = useRef(0);
  const restoring = useRef(null);
  const approvedBack = useRef(false);
  const [result, setResult] = useState(null);
  const [comparisonState, setComparisonState] = useState({});
  const [route, setRoute] = useState(readRoute);
  const [suppliers, setSuppliers] = useState(() => clone(initialSuppliers));
  const [ratings, setRatings] = useState(() => clone(initialRatings));
  const [activeRating, setActiveRating] = useState(null);
  const [ratingReturn, setRatingReturn] = useState('my-ratings');
  const [selected, setSelected] = useState('733324');
  const [message, setMessage] = useState('');
  useEffect(() => {
    history.replaceState({ ...history.state, mobileIndex: 0 }, '', location.href);
    const change = () => {
      if (restoring.current) { const action = restoring.current; restoring.current = null; action(); return; }
      const next = readRoute();
      const nextIndex = history.state?.mobileIndex ?? historyIndex.current + 1;
      if (next === currentRoute.current && nextIndex === historyIndex.current) return;
      const delta = nextIndex - historyIndex.current;
      const topLayer = interaction.layers.current.at(-1);
      const dirty = [...interaction.forms.current.values()].some(f => f.active && f.value !== f.initial);
      if (!approvedBack.current && delta && (topLayer || dirty)) {
        restoring.current = topLayer || (() => interaction.request(() => { approvedBack.current = true; history.go(delta); }));
        history.go(-delta);
        return;
      }
      approvedBack.current = false;
      historyIndex.current = nextIndex;
      history.replaceState({ ...history.state, mobileIndex: nextIndex }, '', location.href);
      const previous = currentRoute.current;
      runMotion(() => { currentRoute.current = next; setRoute(next); }, routeMotion(previous, next, delta < 0));
    };
    window.addEventListener('popstate', change);
    return () => window.removeEventListener('popstate', change);
  }, []);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 4500); return () => clearTimeout(timer); }, [message]);
  const shot = route.startsWith('shot/') ? screenshotScenes.find(s => s.time === route.split('/')[1]) : null;
  const scene = shot?.scene || route.split('?')[0];
  const go = next => interaction.request(() => { if (next === currentRoute.current) return; const previous = currentRoute.current; runMotion(() => { historyIndex.current += 1; history.pushState({ mobileIndex: historyIndex.current }, '', '#/mobile/' + next); currentRoute.current = next; setRoute(next); }, routeMotion(previous, next)); });
  const notify = text => {
    setMessage(text);
    if (text && /草稿/.test(text)) setResult(null);
    if (text && /^请|错误|不能|只能|必须|已存在|须为/.test(text)) window.dispatchEvent(new CustomEvent('mobile-validation', { detail: text }));
    if (text && /已提交|已保存|已暂存|已导出|修改完成|验证通过|已重新邀请|变更已提交/.test(text)) {
      interaction.clean();
      if (!/已导出|验证码|草稿|待提交审批/.test(text)) setResult({ text, supplier: suppliers.find(x => x.id === selected)?.name });
    }
    if (text && /请填写|请选择|请输入|只能|不能|必须|已存在/.test(text)) {
      requestAnimationFrame(() => {
        const controls = [...document.querySelectorAll('.mobile-page [aria-label]')];
        const target = controls.filter(x => x.offsetParent !== null && ['INPUT','TEXTAREA','BUTTON'].includes(x.tagName)).find(x => text.includes(x.getAttribute('aria-label')));
        const error = document.querySelector('.mobile-page [aria-invalid="true"]') || target;
        if (error) { error.closest('details')?.setAttribute('open', ''); error.scrollIntoView({ block: 'center' }); error.focus({ preventScroll: true }); }
      });
    }
  };
  const update = patch => setSuppliers(list => list.map(s => s.id === selected ? { ...s, ...patch, updated: patch.status ? now() : s.updated } : s));
  return <>{scene === 'scenes' ? <SceneGallery /> : <><aside className="m-preview-nav" aria-label="原型导航"><a href="#/mobile/scenes">47 张截图</a><span>演示数据</span><a href="#/login">电脑端</a></aside><MotionPresence show={!!result} as="aside" className="m-result-banner" role="status">{result && <><strong>操作结果</strong><p>{result.text}</p><button aria-label="关闭操作结果" onClick={() => setResult(null)}>关闭</button></>}</MotionPresence><MobileSurface onComparisonChange={setComparisonState} key={route} scene={scene} shot={shot} ratings={ratings} setRatings={setRatings} activeRating={activeRating} setActiveRating={setActiveRating} ratingReturn={ratingReturn} setRatingReturn={setRatingReturn} views={views.current} listReturn={listReturn} suppliers={suppliers} setSuppliers={setSuppliers} selectedId={selected} select={setSelected} update={update} go={go} notify={notify} /><PrototypeReview route={route} scope={scene} /><ScreenshotCompare state={comparisonState} /></>}<MotionPresence show={!!message} as="div" className="m-toast" role="status">{message}</MotionPresence></>;
}

function MobileSurface({ onComparisonChange, scene, shot, ratings, setRatings, activeRating, setActiveRating, ratingReturn, setRatingReturn, views, listReturn, suppliers, setSuppliers, selectedId, select, update, go, notify }) {
  const supplier = suppliers.find(s => s.id === selectedId) || suppliers[0] || clone(initialSuppliers[0]);
  const [portalAccountMenu, setPortalAccountMenu] = usePanelState(scene === 'workspace-account');
  const [search, setSearch] = useState(views[scene]?.search || '');
  const [filters, setFilters] = useState(() => window.location.hash.includes('?') ? Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1])) : views[scene]?.filters || {});
  const [filtering, setFiltering] = useState(false);
  const [expanded, setExpanded] = useState(['query-add', 'query-export'].includes(scene));
  const [batch, setBatch] = useState(views[scene]?.batch ?? ['query-batch', 'mine-batch'].includes(scene));
  const [checked, setChecked] = useState(views[scene]?.checked || []);
  const batchKind = scene.startsWith('mine') ? 'all' : 'delete';
  const [batchError, setBatchError] = useState(null);
  const firstBatchQuery = useRef(true);
  useEffect(() => { if (firstBatchQuery.current) { firstBatchQuery.current = false; return; } setChecked([]); }, [search, filters, batchKind]);
  const [sheet, setSheet] = useState(scene === 'query-more' ? 'more' : null);
  const [confirm, setConfirm] = useState(null);
  const [reinvitePrompt, setReinvitePrompt] = useState(null);
  const [exportOpen, setExportOpen] = useState(scene === 'export');
  const [exportBusy, setExportBusy] = useState(false);
  const [tip, setTip] = useState(['bank-tip', 'approval-tip'].includes(scene));
  const [debug, setDebug] = useState(false);
  const [banks, setBanks] = useState(() => normalizeBankChanges(supplier.banks, clone(readBankDraft(supplier.id) || supplier.banks)));
  const bankCounts = bankChangeCounts(supplier.banks, banks);
  const [bankLeaving, setBankLeaving] = useState(false);
  const [bankDiscarding, setBankDiscarding] = useState(false);
  const [editingBank, setEditingBank] = useState(-1);
  const [bankForm, setBankForm] = useState(() => scene === 'bank-form-selected' ? { ...clone(exampleBank), name: '', number: '', currency: '', proof: '' } : { ...blankBank(''), accountType: '基本账户' });
  const [showBankForm, setShowBankForm] = usePanelState(false);
  const [permissions, setPermissions] = useState(() => scene === 'permissions-added' ? [{ id: 'p2', group: '集团权限', category: '集团其他业务', note: '', change: '新增' }, ...clone(supplier.permissions)] : clone(supplier.permissions));
  const [permissionForm, setPermissionForm] = usePanelState(false);
  const [newInviter, setNewInviter] = useState(scene === 'inviter-selected' ? '周辉' : '');
  const [peoplePicker, setPeoplePicker] = usePanelState(false);
  const editingRegistration = ['register-edit', 'register-edit-all'].includes(scene);
  const editingAll = scene === 'register-edit-all';
  const portalRegistration = scene === 'register-supplier';
  const registrationDraft = portalRegistration ? views.portalRegistrationDraft : null;
  const [accountRegistered, setAccountRegistered] = useState(Boolean(views.portalRegistrationAccount));
  const registrationInvitation = useRef(views.portalRegistrationInvitation || suppliers.find(s => s.status === '邀请中')).current;
  if (portalRegistration && registrationInvitation && !views.portalRegistrationInvitation) views.portalRegistrationInvitation = clone(registrationInvitation);
  const isRegistration = scene.startsWith('register') || ['expiry', 'address', 'region'].includes(scene);
  const [returnPreview, setReturnPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const [step, setStep] = useState(registrationDraft?.step ?? (scene.includes('contacts') ? 1 : scene.includes('banks') ? 2 : 0));
  const [stepsExpanded, setStepsExpanded] = useState(step === 0);
  const stepScroll = useRef({});
  const changeStep = next => { stepScroll.current[step] = window.scrollY; runMotion(() => setStep(next), next < step ? 'back' : 'forward', () => setStepsExpanded(next === 0)); };
  useLayoutEffect(() => { if (isRegistration) window.scrollTo(0, stepScroll.current[step] || 0); }, [step, isRegistration]);
  const [basic, setBasic] = useState(() => registrationDraft ? clone(registrationDraft.basic) : portalRegistration && registrationInvitation ? { type: registrationInvitation.type, supplierName: registrationInvitation.name, registerEmail: registrationInvitation.email || '' } : scene === 'expiry' ? { ...clone(filledBasic), supplierName: 'Gys', creditCode: 'qqq', establishedAt: '2026-10-14', licenseUntil: '2036-12-31', legalRepresentative: '', companyPhone: '', proof: '' } : shot ? clone(filledBasic) : editingRegistration ? { ...(supplier.basic || {}), type: supplier.type, supplierName: supplier.name, registerEmail: supplier.email || supplier.basic?.registerEmail || '', creditCode: supplier.code } : { type: supplierTypes[0], supplierName: '', registerEmail: '' });
  const editSteps = informationSteps(basic.type === supplierTypes[1]);
  const [contacts, setContacts] = useState(() => registrationDraft ? clone(registrationDraft.contacts) : editingRegistration ? clone(supplier.contacts || []) : []);
  const [registerBanks, setRegisterBanks] = useState(() => registrationDraft ? clone(registrationDraft.banks) : scene === 'register-banks' ? [{ ...clone(exampleBank), accountType: '一般账户', name: '1', number: '1', country: '', province: '', city: '', proof: '开户证明.png' }] : editingRegistration ? clone(supplier.banks) : []);
  const [addressOpen, setAddressOpen] = useState(false);
  const [registerBankPicker, setRegisterBankPicker] = usePanelState(false);
  const [registerBankForm, setRegisterBankForm] = useState(blankBank(basic.supplierName));
  const [saving, setSaving] = useState(false);
  const [portalErrors, setPortalErrors] = useState({});
  const changePortal = (key, value) => { setPortal(old => ({ ...old, [key]: value })); setPortalErrors(old => ({ ...old, [key]: undefined })); };
  const portalError = (key, text) => { setPortalErrors({ [key]: text }); notify(''); };
  const [portalEmail, setPortalEmail] = useState(scene === 'portal-email');
  const [portal, setPortal] = useState({ account: '', password: scene === 'portal-email' ? 'prototype123' : '', captcha: scene === 'portal-email' ? '39qq' : '', email: scene === 'portal-email' ? '675756300@qq.com' : '', code: '' });
  const [countdown, setCountdown] = useState(scene === 'portal-email' ? 55 : 0);
  const [captcha, setCaptcha] = useState(scene === 'portal-email' ? '39qq' : 'cbvs');
  const [passwordScreen, setPasswordScreen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [ratingQuery, setRatingQuery] = useState(false);
  const [ratingRange, setRatingRange] = useState(['', '']);
  const portalGuard = useDirtyForm({ portal, newPassword, passwordScreen }, scene.startsWith('portal'));
  const registrationGuard = useDirtyForm({ basic, contacts, registerBanks }, isRegistration && (!portalRegistration || accountRegistered));
  const bankGuard = useDirtyForm(banks, false);
  const bankFormGuard = useDirtyForm(bankForm, showBankForm || scene.startsWith('bank-form'));
  const permissionsGuard = useDirtyForm(permissions, scene.startsWith('permissions'));
  const inviterGuard = useDirtyForm(newInviter, scene.startsWith('inviter'));
  useBackLayer(['bank', 'bank-tip'].includes(scene), leaveBank);
  useBackLayer(showBankForm, () => bankFormGuard.leave(() => setShowBankForm(false)));
  useBackLayer(!!permissionForm, () => window.dispatchEvent(new CustomEvent('mobile-close-permission')));
  useBackLayer(peoplePicker, () => setPeoplePicker(false));
  useBackLayer(addressOpen, () => window.dispatchEvent(new CustomEvent('mobile-close-address')));
  useBackLayer(registerBankPicker, () => window.dispatchEvent(new CustomEvent('mobile-close-register-bank')));
  useBackLayer(filtering, () => runMotion(() => setFiltering(false), 'back'));
  views[scene] = { ...views[scene], search, filters, batch, checked };
  useEffect(() => {
    const remember = () => { views[scene] = { ...views[scene], scroll: window.scrollY }; };
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [scene, views]);


  useEffect(() => { if (!countdown) return; const timer = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(timer); }, [countdown]);
  useLayoutEffect(() => {
    window.scrollTo(0, views[scene]?.scroll || 0);
    if (shot && ['detail-bank', 'detail-approval-empty', 'mine', 'expiry'].includes(scene)) {
      const timer = setTimeout(() => {
        const target = scene.startsWith('detail') ? document.querySelector('.m-detail .m-tabs') : scene === 'mine' ? document.querySelectorAll('.m-supplier-card')[1] : scene === 'portal-email' ? document.querySelector('.m-captcha-field') : document.querySelector('.m-field-divider');
        if (target) { const top = scene === 'detail-approval-empty' ? 365 : scene === 'detail-bank' ? 150 : scene === 'mine' ? 200 - 170 : 94; window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - top)); }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scene, shot]);

  useEffect(() => {
    onComparisonChange({
      scene, shotTime: shot?.time, filtering, expanded, batch, sheet: typeof sheet === 'string' ? sheet : null,
      exportOpen, tip, showBankForm, permissionForm: !!permissionForm, peoplePicker, newInviter,
      addressOpen, registerBankPicker, isRegistration, step, contacts: contacts.length,
      registerBanks: registerBanks.length, bankSelected: !!(registerBankPicker ? registerBankForm.bank : bankForm.bank),
      portalEmail, passwordScreen
    });
  }, [onComparisonChange, scene, shot?.time, filtering, expanded, batch, sheet, exportOpen, tip,
    showBankForm, permissionForm, peoplePicker, newInviter, addressOpen, registerBankPicker,
    isRegistration, step, contacts.length, registerBanks.length, registerBankForm.bank, bankForm.bank, portalEmail, passwordScreen]);

  const mine = scene.startsWith('mine') || scene === 'export';
  const listScene = scene.startsWith('query') || mine;
  const adminScene = !!shot && shot.index >= 25;
  const tab = mine ? 1 : scene === 'my-ratings' ? 2 : ['ratings', 'rating-filter', 'department'].includes(scene) ? 3 : scene === 'rating-ops' ? 4 : ['bank-application', 'application-empty'].includes(scene) ? 5 : 0;
  const fixtureList = useMemo(() => {
    let list = clone(suppliers);
    if (!shot) return (mine ? list.filter(s => s.inviter === '陈才慧') : list).sort((a, b) => b.date.localeCompare(a.date));
    list = list.filter(s => !s.id.startsWith('mock-'));
    if (scene === 'query-old') return [list.find(x => x.id === 'old'), list.find(x => x.id === 'person')].filter(Boolean);
    if (scene === 'mine-empty') return [];
    if (scene === 'query-changing' || mine || ['query-batch', 'query-export'].includes(scene)) list = list.map(x => x.id === '733324' ? { ...x, status: '变更中', updated: '2026-10-14 19:58:23' } : x);
    if (mine || ['query-batch', 'query-export'].includes(scene)) list.sort((a, b) => ['733324', '000253', '557348'].indexOf(a.id) - ['733324', '000253', '557348'].indexOf(b.id));
    if (['query-add', 'query-more'].includes(scene)) list.sort((a, b) => a.id === '557348' ? -1 : b.id === '557348' ? 1 : 0);
    return list.filter(x => !['draft', 'old', 'person'].includes(x.id));
  }, [suppliers, shot, scene, mine]);
  const matching = fixtureList.filter(s => (!search || (mine ? [s.name] : [s.name, s.inviter]).some(x => x.includes(search))) && (!filters.type || s.type === filters.type) && (!filters.status || s.status === filters.status) && (!filters.recommended || (s.basic?.industry || s.industry) === filters.recommended) && (!filters.inviter || s.inviter.includes(filters.inviter)));
  const list = matching.filter(s => (!filters.start || s.date.slice(0, 10) >= filters.start) && (!filters.end || s.date.slice(0, 10) <= filters.end));
  const canChangeInviter = canChangeSupplier;
  const selectableList = mine ? list : list.filter(x => canDeleteSupplier(x, mine));
  const selectedRecords = list.filter(x => checked.includes(x.id));
  const canBatchDelete = selectedRecords.length > 0 && selectedRecords.every(x => canDeleteSupplier(x, mine));
  const canBatchInviter = selectedRecords.length > 0 && selectedRecords.every(canChangeInviter);
  const closeExport = () => { setExportOpen(false); if (scene === 'export') go('mine'); };
  const performExport = async dates => {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const rows = matching.filter(s => (!dates.start || s.date.slice(0, 10) >= dates.start) && (!dates.end || s.date.slice(0, 10) <= dates.end));
      exportSupplierRows(rows, mine);
      closeExport(); notify('已生成导出文件，共' + rows.length + '家供应商');
    } catch (error) {
      const message = error.message || '导出失败，请重试';
      if (!exportOpen) notify(message);
      return message;
    } finally { setExportBusy(false); }
  };
  const startExport = () => {
    if (exportBusy) return;
    if (!mine && (!filters.start || !filters.end || filters.start > filters.end)) setExportOpen(true);
    else performExport(filters);
  };
  const startScore = s => {
    if (!canRateSupplier(s)) return notify('当前状态不能评分');
    setActiveRating(null); setRatingReturn(mine ? 'mine' : 'query'); pick(s, 'rating-edit');
  };
  const pick = (s, next) => { listReturn.current = mine ? 'mine' : 'query'; select(s.id); go(next); };
  const back = () => ['bank', 'bank-tip'].includes(scene) ? leaveBank() : scene === 'workspace-info' ? window.dispatchEvent(new CustomEvent('mobile-portal-info-back')) : scene.startsWith('workspace-account-') ? go(views.portalSecurityReturn || 'workspace-home') : ['rating-filter', 'department'].includes(scene) ? go(filters.return || 'ratings') : scene === 'workspace-travel' ? go(views.portalTravelReturn || 'workspace-home') : (scene.startsWith('workspace-tax') || scene.startsWith('workspace-quote')) ? go('workspace-tasks') : scene === 'workspace-approval' || scene === 'workspace-changes' ? go('workspace-info') : scene.startsWith('workspace') ? go('workspace-home') : scene.startsWith('portal') && portalEmail && !passwordScreen ? setPortalEmail(false) : ['rating-edit', 'rating-detail'].includes(scene) ? go(ratingReturn) : isRegistration && step > 0 ? changeStep(step === 2 && basic.type === supplierTypes[1] ? 0 : step - 1) : go(portalRegistration || scene === 'supplier-registration-result' ? 'portal' : listReturn.current);
  const preview = name => setSheet({ kind: 'attachment', name });
  function runConfirmation() {
    const action = confirm; setConfirm(null);
    if (action.type === 'batch-inviter') {
      if (!action.inviter?.trim()) return notify('请选择新邀请人');
      const targets = suppliers.filter(s => action.ids.includes(s.id));
      if (!targets.length || targets.length !== action.ids.length || targets.some(s => !canChangeSupplier(s))) { setConfirm(null); return setBatchError({ title: '无法变更邀请人', text: '所选供应商状态已变化，请重新选择已审批且未拉黑的供应商。' }); }
      if (targets.some(s => s.inviter === action.inviter)) { setConfirm(null); return setBatchError({ title: '无法变更邀请人', text: '新邀请人不能与所选供应商的原邀请人相同。' }); }
      setSuppliers(suppliers.map(s => action.ids.includes(s.id) ? { ...s, inviter: action.inviter, updated: now() } : s));
      inviterGuard.accept(); views.mine = { ...views.mine, batch: false, checked: [] }; views.batchInviterIds = []; notify('已更新' + targets.length + '家供应商的邀请人'); go('mine');
    }
    if (action.type === 'delete') {
      const targets = suppliers.filter(s => action.ids.includes(s.id));
      if (!targets.length || targets.length !== action.ids.length || targets.some(s => !canDeleteSupplier(s, mine))) return setBatchError({ title: '无法删除', text: '所选记录状态已变化，仅' + deleteStatuses(mine).join('、') + '可删除，请重新选择。' });
      setSuppliers(suppliers.filter(s => !action.ids.includes(s.id))); setChecked([]); notify('已删除' + targets.length + '家供应商');
    }
    if (action.type === 'delete-register-bank') setRegisterBanks(registerBanks.filter((_, i) => i !== action.index));
    if (action.type === 'delete-bank') persistBanks(banks.flatMap((b, i) => i !== action.index ? [b] : b.change === '新增' ? [] : [{ ...b, change: '删除' }]), '账户删除已保存，待提交审批');
    if (action.type === 'delete-permission') setPermissions(permissions.flatMap((p, i) => i !== action.index ? [p] : p.change === '新增' ? [] : [{ ...p, change: '删除' }]));
  }
  function persistBanks(entries, message = '账户已保存，待提交审批') {
    const next = normalizeBankChanges(supplier.banks, entries);
    try { writeBankDraft(supplier.id, next.some(bank => bank.change) ? next : null); }
    catch { notify('账户保存失败，请重试'); return false; }
    setBanks(next); bankGuard.accept(); notify(next.some(bank => bank.change) ? message : '账户已保存，本次资料与原值一致'); return true;
  }
  function leaveBank() {
    if (bankCounts.total) setBankLeaving(true); else go(listReturn.current);
  }
  function submitBankChanges() {
    if (!bankCounts.total) return notify('请先修改银行信息');
    if (!canChangeSupplier(supplier)) return notify('当前供应商状态不能发起银行变更');
    for (const bank of banks.filter(record => record.change !== '删除')) { const error = bankError(bank, supplier.type === supplierTypes[0]); if (error) return notify(error); }
    if (supplier.type === supplierTypes[0] && banks.filter(bank => bank.change !== '删除' && bank.accountType === '基本账户').length !== 1) return notify('企业供应商必须有且只有一个基本账户');
    try { writeBankDraft(supplier.id, null); } catch { return notify('提交失败，请重试'); }
    update({ pendingBanks: clone(banks), status: '变更中' });
    bankGuard.accept(); notify('原型演示：银行变更已提交，等待审批'); go(listReturn.current);
  }
  function saveBank() {
    const error = bankError(bankForm, supplier.type === supplierTypes[0]); if (error) return notify(error);
    if (banks.some((b, i) => i !== editingBank && b.change !== '删除' && b.accountType === '基本账户' && bankForm.accountType === '基本账户')) return notify('基本账户只能有一个');
    const entry = { ...bankForm, id: editingBank < 0 ? createSessionId() : banks[editingBank].id, change: editingBank < 0 || banks[editingBank].change === '新增' ? '新增' : '修改' };
    if (!persistBanks(editingBank < 0 ? [entry, ...banks] : banks.map((b, i) => i === editingBank ? entry : b))) return;
    bankFormGuard.accept(); setShowBankForm(false); setEditingBank(-1);
  }
  function registrationStepError(target) {
    if (target === 0) {
      for (const [key, label, required] of fieldsFor(basic.type)) if (required && !basic[key]?.trim()) return '请填写' + label;
      if ([supplierTypes[0], supplierTypes[3]].includes(basic.type) && !basic.proof) return '请上传证照附件';
      if (!shot && registrationEmailError(basic.registerEmail)) return registrationEmailError(basic.registerEmail);
      if (basic.email && !validEmail(basic.email)) return '请输入正确的邮箱格式';
      if (basic.capital && !/^\d+$/.test(basic.capital)) return '注册资金只支持整数';
      if (basic.companyPhone && !/^(1\d{10}|\d{3,4}-?\d{8})$/.test(basic.companyPhone)) return '公司电话须为11位手机号或区号加8位号码';
      if (suppliers.some(x => x.id !== selectedId && ((basic.type !== supplierTypes[1] && x.name === basic.supplierName) || (basic.creditCode && x.code === basic.creditCode)))) return '供应商名称或证件号码已存在';
    }
    if (target === 1 && contacts.some(c => !c.name || !c.phone || !validEmail(c.email))) return '请填写联系人的姓名、电话和正确邮箱';
    if (target === 2) {
      if (!registerBanks.length) return '请添加银行信息';
      if (basic.type === supplierTypes[0] && registerBanks.filter(b => b.accountType === '基本账户').length !== 1) return '企业供应商必须有且只有一个基本账户';
      for (const b of registerBanks) { const error = bankError(b, basic.type === supplierTypes[0]); if (error) return error; }
    }
    return '';
  }
  function openInformationPreview() {
    for (const index of editSteps.slice(0, -1)) {
      const error = registrationStepError(index);
      if (error) { changeStep(index); notify(error); return; }
    }
    changeStep(3);
  }
  function nextStep() {
    const error = registrationStepError(step); if (error) return notify(error);
    const next = step === 0 && basic.type === supplierTypes[1] ? 2 : step + 1;
    if (editingAll && next === 3) { openInformationPreview(); return; }
    if (returnPreview) { setReturnPreview(false); changeStep(3); } else changeStep(next);
  }
  function submitRegister() {
    if (editingAll && !canChangeSupplier(supplier)) return notify('当前状态不能修改全部信息，请返回列表核对');
    if (editingAll) for (const index of editSteps.slice(0, -1)) { const error = registrationStepError(index); if (error) { changeStep(index); notify(error); return; } }
    if (saving) return; setSaving(true);
    const patch = { name: basic.supplierName, type: basic.type, code: basic.creditCode || '', email: (basic.registerEmail || '').trim(), contact: contacts[0]?.name || '', phone: contacts[0]?.phone || '', banks: clone(registerBanks), basic: { ...clone(basic), registerEmail: (basic.registerEmail || '').trim() }, contacts: clone(contacts) };
    if (portalRegistration) {
      views.portalRegistrationSubmitted = { ...patch, account: views.portalRegistrationAccount?.account, status: '审批中', submittedAt: now() };
      setSuppliers(list => list.map(s => s.id === registrationInvitation?.id ? { ...s, ...patch, account: views.portalRegistrationAccount?.account, status: '审批中', updated: now() } : s));
      views.portalRegistrationAccount = null;
      views.portalRegistrationInvitation = null;
      views.portalRegistrationDraft = null;
      registrationGuard.accept();
      notify('');
      go('supplier-registration-result');
      return;
    }
    if (editingAll) {
      update({ pendingInformation: patch, status: '变更中' });
      notify('信息变更已提交，等待审批');
    } else if (editingRegistration) {
      update({ ...patch, status: '审批中' }); notify('草稿已提交，等待审批');
    } else {
      const id = createSessionId();
      setSuppliers([{ ...patch, id, status: '审批中', mode: '代注册', inviter: '陈才慧', date: now(), updated: now(), score: '未评分', permissions: [] }, ...suppliers]); select(id);
      notify('注册已提交，等待审批');
    }
    go(editingAll ? 'information-change' : 'mine');
  }
  function saveDraft() {
    if (portalRegistration) {
      views.portalRegistrationDraft = { basic: { ...clone(basic), registerEmail: (basic.registerEmail || '').trim() }, contacts: clone(contacts), banks: clone(registerBanks), step };
      registrationGuard.accept();
      notify('注册草稿保存成功');
      return;
    }
    const patch = { basic: { ...clone(basic), registerEmail: (basic.registerEmail || '').trim() }, name: basic.supplierName, type: basic.type, email: (basic.registerEmail || '').trim(), code: basic.creditCode || '', banks: clone(registerBanks), contacts: clone(contacts), updated: now() };
    if (editingRegistration && !editingAll) update(patch);
    else { const id = createSessionId(); setSuppliers([{ ...patch, id, status: '草稿', inviter: '陈才慧', mode: '代注册', date: now(), permissions: [], score: '未评分' }, ...suppliers]); select(id); }
    registrationGuard.accept();
    notify('草稿已保存'); go('mine');
  }

  function submitInvitation(data, target) {
    if (target && !canReinviteSupplier(target)) return notify('当前状态不能重新邀请，请返回列表核对');
    if (target && data.type !== target.type) return notify('供应商类型与原记录不一致，请返回修改');
    const name = data.name.trim();
    if ((!target || target.name.trim() !== name)
      && suppliers.some(record => record.id !== target?.id && record.name.trim() === name)) return notify('供应商名称已存在');
    const invitation = { ...data, name, status: '邀请中', mode: '邀请注册', inviter: target?.inviter || currentInviter, updated: now() };
    if (target) {
      setSuppliers(list => list.map(record => record.id === target.id ? { ...record, ...invitation } : record));
      select(target.id);
    } else {
      const record = { ...invitation, id: createSessionId(), date: now(), score: '未评分', code: '', banks: [], permissions: [] };
      setSuppliers(list => [record, ...list]); select(record.id);
    }
    setReinvitePrompt(null); notify(target ? '已重新邀请' : '邀请已提交');
    go(scene === 'invite-again' ? listReturn.current : 'mine');
  }

  function saveRegisterBank() {
    const error = bankError(registerBankForm, basic.type === supplierTypes[0]); if (error) return notify(error);
    if (registerBanks.some((b, i) => i !== editingBank && b.accountType === '基本账户' && registerBankForm.accountType === '基本账户')) return notify('基本账户只能有一个');
    setRegisterBanks(editingBank < 0 ? [...registerBanks, { ...registerBankForm, id: createSessionId() }] : registerBanks.map((b, i) => i === editingBank ? { ...registerBankForm, id: b.id } : b)); setRegisterBankPicker(false);
  }

  return <div className={'mobile-page ' + (shot ? 'm-shot ' : '') + (shot?.sourceHeight > 2340 ? 'm-long-shot ' : '') + (listScene ? 'm-list-page' : '')} data-scene={scene}>
    {shot && <div className="m-watermark" aria-hidden="true">{Array.from({ length: 60 }, (_, i) => <span key={i}>{shot.index < 25 ? '孙志强213852' : '陈才慧208660'}</span>)}</div>}
    {shot && <div className="m-status-bar"><span>{shot.time.slice(0, 2)}:{shot.time.slice(2, 4)}</span><div><Signal /><Wifi /><Battery /><small>67</small></div></div>}
    <Header right={['workspace-home', 'workspace-account'].includes(scene) ? <button type="button" className="m-portal-account-button" aria-label="账户设置" onClick={() => setPortalAccountMenu(true)}><CircleUserRound aria-hidden="true" /></button> : undefined} hideBack={(portalRegistration && !accountRegistered) || ['workspace-home', 'workspace-account'].includes(scene)} onBack={back} title={shot ? (scene.startsWith('portal') ? '协同门户-登录' : '供应商管理平台') : scene === 'workspace-tasks' ? (views.portalTaskTab ?? 2) < 2 ? '采购报价' : '价税拆分' : mobileTitle(scene)} close={scene.startsWith('portal') ? () => go('query') : undefined} />
    {(listScene || ['ratings', 'my-ratings', 'rating-ops', 'bank-application'].includes(scene)) && <Tabs active={tab} onChange={i => go(['query', 'mine', 'my-ratings', 'ratings', 'rating-ops', 'bank-application'][i])} />}
    <SwipeArea active={tab} count={6} onChange={i => { if (listScene || ['ratings', 'my-ratings', 'rating-ops', 'bank-application'].includes(scene)) go(['query', 'mine', 'my-ratings', 'ratings', 'rating-ops', 'bank-application'][i]); }}>
    {listScene && <>
      <SearchBox value={search} onChange={setSearch} placeholder={mine ? "搜索供应商名称" : "搜索供应商名称或邀请人"}><button className="m-icon-button" aria-label={exportBusy ? '导出中' : '导出供应商'} disabled={exportBusy} onClick={startExport}><Download /></button><FilterButton label="筛选供应商" onClick={() => runMotion(() => setFiltering(true), 'forward')} /><button className="m-icon-button" aria-label={batch ? '退出批量选择' : '批量选择'} onClick={() => { runMotion(() => { setBatch(!batch); setChecked([]); }, 'record'); }}>{batch ? <X /> : <ListChecks />}</button></SearchBox>
      <AppliedFilters filters={filters} query={search} count={list.length} onEdit={() => runMotion(() => setFiltering(true), 'forward')} onClear={() => setFilters({})} />
      <SupplierList filtered={!!search || Object.values(filters).some(Boolean)} suppliers={list} mine={mine} batch={batch} checked={checked} setChecked={setChecked} admin={adminScene} batchKind={batchKind} onDetail={s => pick(s, 'detail')} onBank={s => pick(s, 'bank')} onMore={(s, approval) => { listReturn.current = mine ? 'mine' : 'query'; select(s.id); approval === 'permissions' ? go('permissions') : approval ? go('detail-approval') : setSheet('more'); }} onInviter={s => pick(s, 'inviter')} onScore={startScore} onReinvite={s => { if (canReinviteSupplier(s)) pick(s, 'invite-again'); }} onEdit={s => pick(s, 'register-edit')} onEditAll={s => pick(s, 'register-edit-all')} onDelete={s => setConfirm({ type: 'delete', ids: [s.id], text: '确认删除供应商「' + s.name + '」？删除后原有信息全部作废。' })} />
      {!batch && <div className="m-fab-group">{expanded && <div className="m-fab-menu"><button onClick={() => go('invite')}><span><MailPlus /></span>邀请注册</button><button onClick={() => go('register')}><span><FilePenLine /></span>代注册</button></div>}<button className="m-fab m-fab-blue" aria-label={expanded ? '收起新增入口' : '新增供应商'} onClick={() => setExpanded(!expanded)}>{expanded ? <X /> : <Plus />}</button></div>}
      {batch && <footer className={'m-batch-actions' + (mine ? ' m-batch-actions-mine' : '')}><label className="m-checkbox"><input type="checkbox" aria-label="全选当前结果" disabled={!selectableList.length} checked={selectableList.length > 0 && checked.length === selectableList.length} onChange={e => setChecked(e.target.checked ? selectableList.map(x => x.id) : [])} /><span>{checked.length === selectableList.length && !!selectableList.length && <Check />}</span>全选</label><span>已选 {checked.length} 项</span><div className="m-batch-buttons"><button disabled={!checked.length} className="m-action-danger" onClick={() => { if (!canBatchDelete) return setBatchError({ title: '无法删除', text: '所选记录包含不可删除的状态，仅' + deleteStatuses(mine).join('、') + '可删除，请重新选择。' }); setConfirm({ type: 'delete', ids: [...checked], text: '确认删除所选供应商？' }); }}>删除</button>{mine && <button disabled={!checked.length} onClick={() => { if (!canBatchInviter) return setBatchError({ title: '无法变更邀请人', text: '所选记录包含未审批或已拉黑的供应商，请重新选择已审批且未拉黑的供应商。' }); views.batchInviterIds = [...checked]; listReturn.current = 'mine'; go('inviter-batch'); }}>批量变更邀请人</button>}</div></footer>}
    </>}
    {(scene === 'filter' || filtering) && <div className={filtering ? 'm-fullscreen-panel' : ''}>{filtering && <Header title="筛选供应商" onBack={() => runMotion(() => setFiltering(false), 'back')} />}<FilterView initial={filters} onApply={v => { if (v.start && v.end && v.start > v.end) return notify('开始时间不能晚于结束时间'); setFilters(v); if (filtering) runMotion(() => setFiltering(false), 'back'); else { views[listReturn.current] = { ...views[listReturn.current], filters: v }; go(listReturn.current); } }} onCancel={() => filtering ? runMotion(() => setFiltering(false), 'back') : go('query')} /></div>}
    {scene === 'information-change' && <>{supplier.pendingInformation && supplier.status === '变更中' ? <><ChangeComparison before={supplier} after={supplier.pendingInformation} /><Actions items={[{ label: '返回列表', secondary: true, onClick: () => go(listReturn.current) }, { label: '查看审批', onClick: () => go('approval') }]} /></> : <><Section title="资料变更对比" collapsible={false}><Empty text="暂无待查看的资料变更" /></Section><Actions items={[{ label: '返回列表', onClick: () => go(listReturn.current) }]} /></>}</>}
    {scene.startsWith('detail') && <SupplierDetail supplier={supplier} initialTab={scene === 'detail-bank' ? 3 : ['detail-approval', 'detail-approval-empty'].includes(scene) ? 7 : scene === 'detail-ratings' ? 8 : 0} approvalEmpty={scene === 'detail-approval-empty'} onPreview={preview} ratings={ratings} onScore={() => { setActiveRating(null); setRatingReturn('detail-ratings'); go('rating-edit'); }} onRatingOpen={(record, readOnly) => { setActiveRating(record); setRatingReturn('detail-ratings'); go(readOnly ? 'rating-detail' : 'rating-edit'); }} />}
    {scene.startsWith('approval') && <Approval type={supplier.pendingInformation ? '资料变更' : '注册'} supplier={shot ? { ...supplier, name: '北京初然文化传媒有限公司827583' } : supplier} history={scene === 'approval-history'} number={shot?.time === '194516' ? 'SUP202610140006' : 'SUP202610140004'} showSupplier={!shot || shot.time !== '194516'} />}
    {['bank', 'bank-tip'].includes(scene) && <>
      <Section title="供应商信息"><Row label="供应商名称">{supplier.name}</Row><Row label="供应商类型">{supplier.type}</Row></Section>
      {bankCounts.total > 0 && <aside className="m-bank-pending" role="status"><strong>有{bankCounts.total}条银行变更待提交审批</strong><p>新增{bankCounts.新增}条 · 修改{bankCounts.修改}条 · 删除{bankCounts.删除}条</p><button type="button" onClick={() => setBankDiscarding(true)}>放弃本次变更</button></aside>}
      <RecordCollection title="银行信息" count={banks.length} emptyText="暂无银行信息" addLabel="添加银行账户" onAdd={() => { setEditingBank(-1); setBankForm(blankBank(supplier.name)); setShowBankForm(true); }}>{banks.map((b, i) => <BankChangeCard key={b.id} before={supplier.banks} bank={b} notify={notify} deleteDisabledReason={supplier.type === supplierTypes[0] && b.accountType === '基本账户' && b.change !== '删除' ? '企业供应商的基本账户不可删除' : ''} onPreview={preview} onEdit={b.change === '删除' ? undefined : () => { setEditingBank(i); setBankForm(clone(b)); setShowBankForm(true); }} onDelete={supplier.type === supplierTypes[0] && b.accountType === '基本账户' || b.change === '删除' ? undefined : () => setConfirm({ type: 'delete-bank', index: i, text: '是否将该银行账户标记为待提交删除？' })} />)}</RecordCollection>
      {!showBankForm && <Actions className="m-bank-submit-actions" items={[{ label: '返回', secondary: true, onClick: leaveBank }, { label: '提交审批', disabled: !bankCounts.total, onClick: submitBankChanges }]} />}
      {bankLeaving && <Confirm title="银行变更待提交" text="银行信息尚未提交审批，已保存内容将保留，可稍后继续处理。" cancelLabel="继续处理" confirmLabel="确认离开" onCancel={() => setBankLeaving(false)} onConfirm={() => { setBankLeaving(false); bankGuard.accept(); go(listReturn.current); }} />}
      {bankDiscarding && <Confirm title="放弃本次变更" text="是否放弃本次全部未提交银行变更？" cancelLabel="继续处理" confirmLabel="放弃变更" danger onCancel={() => setBankDiscarding(false)} onConfirm={() => { try { writeBankDraft(supplier.id, null); } catch { return notify('放弃失败，请重试'); } setBanks(clone(supplier.banks)); bankGuard.accept(); setBankDiscarding(false); notify('已恢复原银行资料'); }} />}

    </>}
    {(scene.startsWith('bank-form') || showBankForm) && <div className={showBankForm ? 'm-fullscreen-panel' : ''}>{showBankForm && <Header title={editingBank < 0 ? "新增银行账户" : "编辑银行账户"} onBack={() => bankFormGuard.leave(() => setShowBankForm(false))} />}<BankFields bank={bankForm} setBank={setBankForm} company={supplier.type === supplierTypes[0]} /><Actions items={[{ label: '取消', onClick: () => showBankForm ? bankFormGuard.leave(() => setShowBankForm(false)) : go('bank') }, { label: '保存此账户', onClick: () => { if (showBankForm) saveBank(); else { const error = bankError(bankForm, supplier.type === supplierTypes[0]); if (error) return notify(error); if (!persistBanks([{ ...bankForm, id: createSessionId(), change: '新增' }, ...banks])) return; bankFormGuard.accept(); go('bank'); } } }]} /></div>}
    {['bank-select', 'branch-select', 'people', 'people-empty'].includes(scene) && <ReferenceList mode={scene.startsWith('people') ? 'confirm' : 'immediate'} kind={scene.startsWith('people') ? 'people' : scene === 'bank-select' ? 'bank' : 'branch'} selected={scene === 'branch-select' ? exampleBank.branch : ''} initialSearch={scene === 'people' ? '周' : ''} onCancel={() => go(scene.startsWith('people') ? 'inviter' : 'bank')} onConfirm={v => { notify('已选择' + v); go(scene.startsWith('people') ? 'inviter-selected' : 'bank-form-selected'); }} />}
    {scene.startsWith('permissions') && <><Section title="供应商信息"><Row label="供应商名称">{supplier.name}</Row><Row label="供应商类型">{supplier.type}</Row></Section><RecordCollection title="分配权限" count={permissions.length} emptyText="暂无权限记录" addLabel="新增权限" onAdd={() => setPermissionForm({ index: -1 })}>{permissions.map((p, i) => <PermissionCard key={p.id} data={p} onEdit={p.change === '删除' ? undefined : () => setPermissionForm({ data: p, index: i })} onDelete={p.change === '删除' ? undefined : () => setConfirm({ type: 'delete-permission', index: i, text: '是否删除该权限？提交后生效。' })} />)}</RecordCollection>{!permissionForm && <Actions items={[{ label: '取消', onClick: () => go('query') }, { label: '提交变更', onClick: () => { if (!permissions.some(p => p.change)) return notify('请先新增、修改或删除权限'); update({ pendingPermissions: clone(permissions), status: '变更中' }); notify('原型演示：权限分配已提交，等待审批'); go(listReturn.current); } }]} />}</>}
    {(scene === 'permission-form' || permissionForm) && <div className={permissionForm ? 'm-fullscreen-panel' : ''}>{permissionForm && <Header title="编辑供应商权限" onBack={() => window.dispatchEvent(new CustomEvent('mobile-close-permission'))} />}<PermissionForm initial={permissionForm?.data} notify={notify} onCancel={() => permissionForm ? setPermissionForm(false) : go('permissions')} onSave={p => { if (permissions.some((x, i) => i !== permissionForm?.index && x.change !== '删除' && x.group === p.group && x.category === p.category)) return notify('该权限已存在'); const next = { ...p, id: permissionForm?.data?.id || createSessionId(), change: permissionForm?.index >= 0 && permissionForm?.data?.change !== '新增' ? '修改' : '新增' }; setPermissions(permissionForm?.index >= 0 ? permissions.map((x, i) => i === permissionForm.index ? next : x) : [next, ...permissions]); permissionForm ? setPermissionForm(false) : go('permissions-added'); }} /></div>}
    {scene.startsWith('inviter') && scene !== 'inviter-batch' && <><Section title="供应商信息"><Row label="供应商名称">{supplier.name}</Row><Row label="供应商类型">{supplier.type}</Row></Section><Section title="申请人信息" className="m-inviter-applicants"><Row label="原邀请人">{supplier.inviter}</Row><Field label="新邀请人" required value={newInviter} onPick={() => setPeoplePicker(true)} /><aside className="m-inviter-note"><p>审批提醒</p><ol><li>原邀请人在职：由原邀请人审批。</li><li>原邀请人离职：由原部门领导审批。</li><li>原部门无法查询：由异常管理员审批。</li><li>发起人是原邀请人：直接通过。</li></ol></aside></Section><Actions items={[{ label: '取消', onClick: () => go(listReturn.current) }, { label: '提交', onClick: () => { if (!newInviter) return notify('请选择新邀请人'); if (newInviter === supplier.inviter) return notify('新邀请人不能与原邀请人相同'); update({ inviter: newInviter, status: supplier.inviter === '陈才慧' ? '已审批' : '变更中' }); notify('原型演示：邀请人变更已提交'); go(listReturn.current); } }]} /></>}
    {scene === 'inviter-batch' && <>
      {views.batchInviterIds?.length ? <>
        <Section title="供应商信息" collapsible={false}><div className="m-batch-supplier-list">{suppliers.filter(s => views.batchInviterIds.includes(s.id)).map(s => <article key={s.id} className="m-batch-supplier"><h3>{s.name}</h3><Row label="供应商类型">{s.type}</Row></article>)}</div></Section>
        <Section title="申请人信息" collapsible={false} className="m-inviter-applicants"><Row label="原邀请人">{[...new Set(suppliers.filter(s => views.batchInviterIds.includes(s.id)).map(s => s.inviter))].join('、')}</Row><Field label="新邀请人" required value={newInviter} onPick={() => setPeoplePicker(true)} /></Section>
        <Actions items={[{ label: '返回', secondary: true, onClick: () => go('mine') }, { label: '提交', onClick: () => { if (!newInviter) return notify('请选择新邀请人'); setConfirm({ type: 'batch-inviter', ids: [...views.batchInviterIds], inviter: newInviter, text: '确认将所选' + views.batchInviterIds.length + '家供应商的邀请人变更为「' + newInviter + '」？' }); } }]} />
      </> : <><Empty text="请先从我的邀请选择供应商" /><Actions items={[{ label: '返回我的邀请', onClick: () => go('mine') }]} /></>}
    </>}
    {peoplePicker && <div className="m-fullscreen-panel"><Header title="选择新邀请人" onBack={() => setPeoplePicker(false)} /><ReferenceList kind="people" mode="confirm" selected={newInviter} onCancel={() => setPeoplePicker(false)} onConfirm={v => { setNewInviter(v); setPeoplePicker(false); }} /></div>}
    {['invite', 'invite-again'].includes(scene) && <InviteForm initial={scene === 'invite-again' ? { type: supplier.type, name: supplier.name, contact: supplier.contact, email: supplier.email, phone: supplier.phone } : undefined} notify={notify} onCancel={() => go(scene === 'invite-again' ? listReturn.current : 'query')} onSave={data => {
      if (scene === 'invite-again') return submitInvitation(data, supplier);
      const candidate = reinviteCandidate(suppliers, data.name, currentInviter);
      if (candidate) {
        setReinvitePrompt({ data: clone(data), recordId: candidate.id });
        return;
      }
      submitInvitation(data);
    }} />}
    {portalRegistration && !accountRegistered && (registrationInvitation ? <SupplierAccountRegistration invitation={registrationInvitation} accounts={[...suppliers.map(s => s.account).filter(Boolean), ...(views.portalRegisteredAccounts || [])]} onComplete={account => {
      views.portalRegistrationAccount = account;
      views.portalRegisteredAccounts = [...(views.portalRegisteredAccounts || []), account.account];
      select(registrationInvitation.id);
      setSuppliers(list => list.map(s => s.id === registrationInvitation.id ? { ...s, account: account.account, status: '注册中', updated: now() } : s));
      runMotion(() => { setAccountRegistered(true); window.scrollTo(0, 0); }, 'forward');
    }} /> : <Empty text="暂无可注册的邀请信息" />)}
    {isRegistration && (!portalRegistration || accountRegistered) && !['address', 'region'].includes(scene) && <>
      {editingRegistration && <div className="m-form-heading">{editingAll ? '修改全部信息' : '修改草稿'}</div>}
      <RegistrationSteps personal={basic.type === supplierTypes[1]} step={step} expanded={stepsExpanded} onExpandedChange={setStepsExpanded} />
      {step === 0 && <BasicFields data={basic} setData={setBasic} identityReadOnly={portalRegistration} hideSupplierType={portalRegistration} shot={!!shot} onAddress={() => setAddressOpen(true)} initialDate={scene === 'expiry'} />}
      {step === 1 && <ContactFields contacts={contacts} setContacts={setContacts} />}
      {step === 2 && <RecordCollection title="银行信息" count={registerBanks.length} emptyText="暂无银行信息" addLabel="添加银行账户" onAdd={() => { setEditingBank(-1); setRegisterBankForm(blankBank(basic.supplierName)); setRegisterBankPicker(true); }}>{registerBanks.map((b, i) => <BankCard key={b.id} bank={b} onPreview={preview} onEdit={() => { setEditingBank(i); setRegisterBankForm(clone(b)); setRegisterBankPicker(true); }} onDelete={() => setConfirm({ type: 'delete-register-bank', index: i, text: '确认删除银行信息' + (i + 1) + '？' })} />)}</RecordCollection>}
      {step === 3 && <RegistrationPreview supplierFacing={portalRegistration} basic={basic} contacts={contacts} banks={registerBanks} mode={portalRegistration ? '邀请注册' : editingRegistration ? supplier.mode : '代注册'} active={previewTab} onTabChange={setPreviewTab} onEdit={next => { setReturnPreview(true); changeStep(next); }} onPreview={preview}>{editingAll && <ChangeComparison before={supplier} after={{ basic, name: basic.supplierName, email: basic.registerEmail, type: basic.type, contacts, banks: registerBanks }} />}</RegistrationPreview>}
      <Actions className="m-registration-actions" items={editingAll ? [{ label: '取消', secondary: true, onClick: () => registrationGuard.leave(() => go(listReturn.current)) }, { label: step === 3 ? '提交' : '下一步（' + (editSteps.indexOf(step) + 1) + '/' + editSteps.length + '）', disabled: saving, onClick: step === 3 ? submitRegister : nextStep }] : [...(step > 0 ? [{ label: '上一步', secondary: true, onClick: () => { changeStep(step === 2 && basic.type === supplierTypes[1] ? 0 : step - 1); } }] : []), ...(!editingAll ? [{ label: '保存草稿', secondary: true, disabled: saving, onClick: saveDraft }] : []), { label: step === 3 ? (portalRegistration ? '提交注册' : '提交') : returnPreview ? '保存并返回预览' : `下一步（${(basic.type === supplierTypes[1] ? [0, 2, 3] : [0, 1, 2, 3]).indexOf(step) + 1}/${basic.type === supplierTypes[1] ? 3 : 4}）`, disabled: saving, onClick: step === 3 ? submitRegister : nextStep }]} />
    </>}
    {addressOpen && <Overlay sheet label="编辑注册地址" onClose={() => window.dispatchEvent(new CustomEvent('mobile-close-address'))}><div className="m-address-editor"><div className="m-picker-title"><strong>编辑注册地址</strong></div><AddressForm initial={basic.address} onConfirm={v => { setBasic({ ...basic, address: v }); setAddressOpen(false); }} onCancel={() => setAddressOpen(false)} /></div></Overlay>}
    {['address', 'region'].includes(scene) && <AddressForm initial={shot ? '云南省/保山市/龙陵县 个哈哈哈哈' : basic.address} startRegion={scene === 'region'} onConfirm={v => { setBasic({ ...basic, address: v }); go('register'); }} onCancel={() => go('register')} />}
    {registerBankPicker && <div className="m-fullscreen-panel"><Header title={portalRegistration ? (editingBank < 0 ? '添加银行账户' : '修改银行账户') : undefined} onBack={() => window.dispatchEvent(new CustomEvent('mobile-close-register-bank'))} /><BankFields onCancel={() => setRegisterBankPicker(false)} bank={registerBankForm} setBank={setRegisterBankForm} company={basic.type === supplierTypes[0]} /><Actions items={[{ label: '取消', onClick: () => window.dispatchEvent(new CustomEvent('mobile-close-register-bank')) }, { label: '添加', onClick: saveRegisterBank }]} /></div>}
    {['ratings', 'my-ratings'].includes(scene) && <RatingWorkspace savedView={views[scene]} onViewChange={value => { views[scene] = { ...views[scene], ...value }; }} mine={scene === 'my-ratings'} records={ratings} filters={filters} go={go} onOpen={(record, readOnly) => { setActiveRating(record); setRatingReturn(scene); go(readOnly ? 'rating-detail' : 'rating-edit'); }} onAdd={() => { setActiveRating(null); setRatingReturn(scene); go('rating-edit'); }} />}
    {['rating-edit', 'rating-detail'].includes(scene) && (scene === 'rating-detail' && !activeRating ? <><Empty text="未选择评分记录，请返回列表重新选择" /><Actions items={[{ label: '返回评分列表', onClick: () => go('my-ratings') }]} /></> : <RatingEditor record={activeRating} supplier={activeRating ? suppliers.find(x => x.name === activeRating.name) || { name: activeRating.name, type: '', status: '', inviter: '', date: '', mode: '' } : supplier} readOnly={scene === 'rating-detail'} notify={notify} onCancel={() => go(ratingReturn)} onSave={record => { setRatings(list => list.some(x => x.id === record.id) ? list.map(x => x.id === record.id ? record : x) : [record, ...list]); notify('演示评分已保存'); go(ratingReturn); }} />)}
    {['rating-filter', 'department'].includes(scene) && <FilterView rating initial={filters} onCancel={() => go(filters.return || 'ratings')} onApply={v => { if (v.start && v.end && v.start > v.end) return notify('评分开始时间不能晚于结束时间'); go((filters.return || 'ratings') + '?' + new URLSearchParams(v).toString()); }} />}
    {scene === 'rating-ops' && <RatingOperations notify={notify} />}
    {scene === 'bank-application' && <div className="m-bank-notice-stage"><BankApplication onApply={() => { views.applicationResult = null; go('bank-application-form'); }} />{views.applicationResult && <button className="m-preview-edit" onClick={() => go('bank-application-form')}>查看本次申请</button>}</div>}
    {['bank-application-form', 'application-empty'].includes(scene) && <BankApplicationForm savedApplication={views.applicationResult} onComplete={data => { views.applicationResult = data; }} notify={notify} onCancel={() => go('bank-application')} />}
    {scene === 'supplier-registration-result' && <section className="m-registration-result" aria-label="注册结果">{views.portalRegistrationSubmitted ? <><div className="m-registration-success"><Check aria-hidden="true" /><h2>注册已提交</h2><p>供应商资料已提交，等待审批</p></div><Section title="注册信息"><Row label="供应商名称">{views.portalRegistrationSubmitted.name}</Row><Row label="供应商账号">{views.portalRegistrationSubmitted.account}</Row><Row label="注册邮箱">{views.portalRegistrationSubmitted.email}</Row><Row label="状态">{views.portalRegistrationSubmitted.status}</Row><Row label="提交时间">{views.portalRegistrationSubmitted.submittedAt}</Row></Section></> : <Empty text="暂无注册提交记录" />}<Actions items={[{ label: '返回协同门户', onClick: () => go('portal') }]} /></section>}
    {scene.startsWith('portal') && <div className="m-portal-login"><div className="m-portal-brand"><span className="m-portal-brand-mark">搜狐</span><span>供应商协同门户</span></div><section className="m-portal-login-card" aria-labelledby="portal-login-heading"><h2 id="portal-login-heading">{passwordScreen ? '修改密码' : portalEmail ? '验证注册邮箱' : '用户登录'}</h2><p className="m-portal-intro">{passwordScreen ? '验证注册邮箱后，设置新的登录密码' : portalEmail ? '请使用注册邮箱完成身份验证' : '使用供应商账号登录协同门户'}</p><div className="m-portal-form">
      {!passwordScreen && !portalEmail && <><Field label="账号" required value={portal.account} onChange={account => setPortal({ ...portal, account })} placeholder="请输入登录账号" /><Field label="密码" required type="password" value={portal.password} onChange={password => setPortal({ ...portal, password })} placeholder="请输入登录密码" /><div className="m-captcha-field"><Field label="验证码" required value={portal.captcha} onChange={v => setPortal({ ...portal, captcha: v })} placeholder="请输入验证码" /><span className="m-captcha">{captcha}</span><button onClick={() => { setCaptcha(captcha === 'cbvs' ? '39qq' : 'cbvs'); setPortal({ ...portal, captcha: '' }); }}>换一张</button></div></>}
      {(portalEmail || passwordScreen) && <><Field label="注册邮箱" required type="email" error={portalErrors.email} value={portal.email} onChange={email => changePortal('email', email)} /><div className="m-login-email-code"><Field label="邮箱验证码" required error={portalErrors.code} value={portal.code} onChange={code => changePortal('code', code)} /><button className="m-send-code" disabled={countdown > 0} onClick={() => { if (!validEmail(portal.email)) return portalError('email', portal.email ? '请输入正确的注册邮箱' : '请填写注册邮箱'); setPortalErrors({}); setCountdown(60); notify('演示验证码：123456；未发送真实邮件'); }}>{countdown ? countdown + ' s 后可重发' : '发送验证码'}</button></div></>}
      {passwordScreen && <Field label="新密码" required type="password" value={newPassword} onChange={setNewPassword} />}
      {(!portalEmail || passwordScreen) && <button className="m-forgot-link" onClick={() => { setPasswordScreen(!passwordScreen); setNewPassword(''); }}>{passwordScreen ? '返回登录' : '修改密码'}</button>}<button className="m-login-button" onClick={() => { if (passwordScreen) { if (!validEmail(portal.email)) return portalError('email', portal.email ? '请输入正确的注册邮箱' : '请填写注册邮箱'); if (portal.code !== '123456') return portalError('code', portal.code ? '邮箱验证码错误' : '请填写邮箱验证码'); if (!newPassword) return notify('请输入新密码'); notify('原型演示：密码修改完成，未更新真实账号'); setPasswordScreen(false); } else if (!portalEmail) { if (!portal.account || !portal.password) return notify('请输入账号和密码'); if (portal.captcha.toLowerCase() !== captcha) return notify('图形验证码错误'); setPortalEmail(true); } else { if (!validEmail(portal.email)) return portalError('email', portal.email ? '请输入正确的注册邮箱' : '请填写注册邮箱'); if (portal.code !== '123456') return portalError('code', portal.code ? '邮箱验证码错误' : '请填写邮箱验证码'); views.portalAccount = { account: portal.account || '演示供应商账号', email: portal.email }; portalGuard.accept(); notify(''); go('workspace-home'); } }}>{passwordScreen ? '提交' : portalEmail ? '登录' : '下一步'}</button>
    </div></section></div>}
    {scene.startsWith('workspace') && <PortalWorkspace accountMenu={portalAccountMenu} setAccountMenu={setPortalAccountMenu} scene={scene} go={go} notify={notify} store={views} onPreview={preview} />}
    </SwipeArea>
    {reinvitePrompt && <Confirm title="重新邀请" className="m-reinvite-prompt" text="您名下存在同名且为草稿或注册驳回的供应商，是否重新进行邀请。" cancelLabel="取消" confirmLabel="重新邀请" onCancel={() => setReinvitePrompt(null)} onConfirm={() => {
      const target = reinviteCandidate(suppliers, reinvitePrompt.data.name, currentInviter);
      if (!target || target.id !== reinvitePrompt.recordId) { setReinvitePrompt(null); return notify('该供应商状态或归属已变化，请重新提交邀请信息'); }
      submitInvitation(reinvitePrompt.data, target);
    }} />}
    {exportOpen && <SupplierExport suppliers={matching} initial={filters} query={search} busy={exportBusy} onExport={performExport} onClose={closeExport} />}
    {sheet === 'more' && <Overlay sheet label="更多操作" onClose={() => setSheet(null)}><div className="m-action-sheet">{canChangeSupplier(supplier) && ['修改银行', '分配权限', '变更邀请人'].map((label, i) => <button key={label} onClick={() => { setSheet(null); go(['bank', 'permissions', 'inviter'][i]); }}>{label}</button>)}{canRateSupplier(supplier) && <button onClick={() => { setSheet(null); startScore(supplier); }}>评分</button>}<button onClick={() => { setSheet(null); go('detail-approval'); }}>审批记录</button><button className="cancel" onClick={() => setSheet(null)}>取消</button></div></Overlay>}
    {sheet?.kind === 'attachment' && <AttachmentViewer value={sheet.name} onClose={() => setSheet(null)} />}
    {batchError && <Overlay label="批量操作校验" onClose={() => setBatchError(null)}><h2>{batchError.title}</h2><p>{batchError.text}</p><div className="m-dialog-actions"><button type="button" onClick={() => setBatchError(null)}>知道了</button></div></Overlay>}
    {confirm && <Confirm danger={confirm.type.startsWith('delete')} text={confirm.text} onCancel={() => setConfirm(null)} onConfirm={runConfirmation} />}
    {tip && <ScreenshotTip onClose={() => setTip(false)} />}
    {shot && <button className={'m-vconsole m-vconsole-' + scene} onClick={() => setDebug(!debug)}>vConsole</button>}
    {debug && <Overlay sheet label="vConsole" onClose={() => setDebug(false)}><div className="m-picker-title"><strong>vConsole</strong><button onClick={() => setDebug(false)}>关闭</button></div><p className="m-debug-note">当前为截图复刻状态，未连接调试服务。</p></Overlay>}
    {shot && <div className="m-android-nav"><span /><i /><b /></div>}
  </div>;
}









