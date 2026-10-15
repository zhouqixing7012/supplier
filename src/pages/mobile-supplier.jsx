import React, { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardPlus, Filter, List, Plus, Search, Signal, Wifi, Battery, X, MoreHorizontal } from 'lucide-react';
import { Actions, Confirm, Empty, Field, Header, Overlay, Row, ScreenshotTip, SearchBox, Section } from './mobile-ui.jsx';
import { AddressForm, BankCard, BankFields, BasicFields, ContactFields, InviteForm, PermissionForm, ReferenceList, bankError, blankBank, fieldsFor, filledBasic } from './mobile-forms.jsx';
import { Approval, BankApplication, FilterView, PermissionCard, RatingList, SupplierDetail, SupplierList, Tabs } from './mobile-views.jsx';
import { bankNames, cooperation, exampleBank, initialSuppliers, screenshotScenes, supplierTypes } from './mobile-data.js';
import { BankApplicationForm, RatingEditor, RatingOperations, RatingWorkspace, initialRatings } from './mobile-workflows.jsx';
import './mobile-supplier.css';

const clone = value => structuredClone(value);
const readRoute = () => decodeURIComponent(window.location.hash.replace(/^#\/mobile\/?/, '')) || 'query';
const now = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');

function SceneGallery() {
  return <main className="m-scene-gallery"><header><a href="#/mobile">返回移动端原型</a><a href="#/login">电脑端</a><h1>移动端截图复刻</h1><p>47 张截图对应 47 个独立页面或状态。业务内容均为原型演示样本。</p></header><ol>{screenshotScenes.map(s => <li key={s.time}><a href={s.href}><span>{String(s.index).padStart(2, '0')}</span><strong>{s.title}</strong><small>{s.filename}</small></a></li>)}</ol></main>;
}

export default function MobileSupplier() {
  const [route, setRoute] = useState(readRoute);
  const [suppliers, setSuppliers] = useState(() => clone(initialSuppliers));
  const [ratings, setRatings] = useState(() => clone(initialRatings));
  const [activeRating, setActiveRating] = useState(null);
  const [ratingReturn, setRatingReturn] = useState('my-ratings');
  const [selected, setSelected] = useState('733324');
  const [message, setMessage] = useState('');
  useEffect(() => { const change = () => setRoute(readRoute()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change); }, []);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 4500); return () => clearTimeout(timer); }, [message]);
  const shot = route.startsWith('shot/') ? screenshotScenes.find(s => s.time === route.split('/')[1]) : null;
  const scene = shot?.scene || route.split('?')[0];
  const go = next => { window.location.hash = '/mobile/' + next; };
  const notify = text => setMessage(text);
  const update = patch => setSuppliers(list => list.map(s => s.id === selected ? { ...s, ...patch, updated: patch.status ? now() : s.updated } : s));
  return <>{scene === 'scenes' ? <SceneGallery /> : <><aside className="m-preview-nav" aria-label="原型导航"><a href="#/mobile/scenes">47 张截图</a><span>演示数据</span><a href="#/login">电脑端</a></aside><MobileSurface key={route} scene={scene} shot={shot} ratings={ratings} setRatings={setRatings} activeRating={activeRating} setActiveRating={setActiveRating} ratingReturn={ratingReturn} setRatingReturn={setRatingReturn} suppliers={suppliers} setSuppliers={setSuppliers} selectedId={selected} select={setSelected} update={update} go={go} notify={notify} /></>}{message && <div className="m-toast" role="status">{message}</div>}</>;
}

function MobileSurface({ scene, shot, ratings, setRatings, activeRating, setActiveRating, ratingReturn, setRatingReturn, suppliers, setSuppliers, selectedId, select, update, go, notify }) {
  const supplier = suppliers.find(s => s.id === selectedId) || suppliers[0] || clone(initialSuppliers[0]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() => Object.fromEntries(new URLSearchParams(window.location.hash.split('?')[1] || '')));
  const [filtering, setFiltering] = useState(false);
  const [expanded, setExpanded] = useState(['query-add', 'query-export'].includes(scene));
  const [batch, setBatch] = useState(['query-batch', 'mine-batch'].includes(scene));
  const [checked, setChecked] = useState([]);
  const [sheet, setSheet] = useState(scene === 'query-more' ? 'more' : null);
  const [confirm, setConfirm] = useState(scene === 'export' ? { type: 'export', text: '请确定是否要导出当前查询条件下的所有明细？' } : null);
  const [tip, setTip] = useState(['bank-tip', 'approval-tip'].includes(scene));
  const [debug, setDebug] = useState(false);
  const [banks, setBanks] = useState(() => clone(supplier.pendingBanks || supplier.banks));
  const [editingBank, setEditingBank] = useState(-1);
  const [bankForm, setBankForm] = useState(() => scene === 'bank-form-selected' ? { ...clone(exampleBank), name: '', number: '', currency: '', proof: '' } : { ...blankBank(''), accountType: '基本账户' });
  const [showBankForm, setShowBankForm] = useState(false);
  const [permissions, setPermissions] = useState(() => scene === 'permissions-added' ? [{ id: 'p2', group: '集团权限', category: '集团其他业务', note: '', change: '新增' }, ...clone(supplier.permissions)] : clone(supplier.permissions));
  const [permissionForm, setPermissionForm] = useState(false);
  const [newInviter, setNewInviter] = useState(scene === 'inviter-selected' ? '周辉' : '');
  const [peoplePicker, setPeoplePicker] = useState(false);
  const editingRegistration = ['register-edit', 'register-edit-all'].includes(scene);
  const editingAll = scene === 'register-edit-all';
  const isRegistration = scene.startsWith('register') || ['expiry', 'address', 'region'].includes(scene);
  const [step, setStep] = useState(scene.includes('contacts') ? 1 : scene.includes('banks') ? 2 : 0);
  const [basic, setBasic] = useState(() => scene === 'expiry' ? { ...clone(filledBasic), supplierName: 'Gys', creditCode: 'qqq', establishedAt: '2026-10-14', licenseUntil: '2036-12-31', legalRepresentative: '', companyPhone: '', proof: '' } : shot ? clone(filledBasic) : editingRegistration ? { ...(supplier.basic || {}), type: supplier.type, supplierName: supplier.name, registerEmail: supplier.email, creditCode: supplier.code } : { type: supplierTypes[0], supplierName: '', registerEmail: '' });
  const [contacts, setContacts] = useState(() => scene === 'register-contacts' ? [{ id: 'c1', name: '', phone: '', email: '' }, { id: 'c2', name: '', phone: '', email: '' }] : editingRegistration ? clone(supplier.contacts || []) : []);
  const [registerBanks, setRegisterBanks] = useState(() => scene === 'register-banks' ? [{ ...clone(exampleBank), accountType: '一般账户', name: '1', number: '1', country: '', province: '', city: '', proof: '开户证明.png' }] : editingRegistration ? clone(supplier.banks) : []);
  const [addressOpen, setAddressOpen] = useState(false);
  const [registerBankPicker, setRegisterBankPicker] = useState(false);
  const [registerBankForm, setRegisterBankForm] = useState(blankBank(basic.supplierName));
  const [saving, setSaving] = useState(false);
  const [portalEmail, setPortalEmail] = useState(scene === 'portal-email');
  const [portal, setPortal] = useState({ account: '', password: scene === 'portal-email' ? 'prototype123' : '', captcha: scene === 'portal-email' ? '39qq' : '', email: scene === 'portal-email' ? '675756300@qq.com' : '', code: '' });
  const [countdown, setCountdown] = useState(scene === 'portal-email' ? 55 : 0);
  const [captcha, setCaptcha] = useState(scene === 'portal-email' ? '39qq' : 'cbvs');
  const [passwordScreen, setPasswordScreen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [ratingQuery, setRatingQuery] = useState(false);
  const [ratingRange, setRatingRange] = useState(['', '']);

  // 独立填写页打开时，背景内容不能被键盘或辅助技术继续操作。
  useEffect(() => {
    const panel = document.querySelector('.m-fullscreen-panel');
    if (!panel) return;
    const siblings = [...document.querySelector('.mobile-page').children].filter(node => node !== panel && !node.contains(panel));
    siblings.forEach(node => { node.inert = true; node.setAttribute('aria-hidden', 'true'); });
    return () => siblings.forEach(node => { node.inert = false; node.removeAttribute('aria-hidden'); });
  }, [showBankForm, permissionForm, peoplePicker, addressOpen, registerBankPicker, filtering]);

  useEffect(() => { if (!countdown) return; const timer = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(timer); }, [countdown]);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (shot && ['detail-bank', 'detail-approval-empty', 'mine', 'expiry'].includes(scene)) {
      const timer = setTimeout(() => {
        const target = scene.startsWith('detail') ? document.querySelector('.m-detail .m-tabs') : scene === 'mine' ? document.querySelectorAll('.m-supplier-card')[1] : scene === 'portal-email' ? document.querySelector('.m-captcha-field') : document.querySelector('.m-field-divider');
        if (target) { const top = scene === 'detail-approval-empty' ? 365 : scene === 'detail-bank' ? 150 : scene === 'mine' ? 200 - 170 : 94; window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - top)); }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scene, shot]);

  const mine = scene.startsWith('mine') || scene === 'export';
  const listScene = scene.startsWith('query') || mine;
  const adminScene = !!shot && shot.index >= 25;
  const tab = mine ? 1 : scene === 'my-ratings' ? 2 : ['ratings', 'rating-filter', 'department'].includes(scene) ? 3 : scene === 'rating-ops' ? 4 : ['bank-application', 'application-empty'].includes(scene) ? 5 : 0;
  const fixtureList = useMemo(() => {
    let list = clone(suppliers);
    if (!shot) return (mine ? list.filter(s => s.inviter === '陈才慧') : list).sort((a, b) => b.date.localeCompare(a.date));
    if (scene === 'query-old') return [list.find(x => x.id === 'old'), list.find(x => x.id === 'person')].filter(Boolean);
    if (scene === 'mine-empty') return [];
    if (scene === 'query-changing' || mine || ['query-batch', 'query-export'].includes(scene)) list = list.map(x => x.id === '733324' ? { ...x, status: '变更中', updated: '2026-10-14 19:58:23' } : x);
    if (mine || ['query-batch', 'query-export'].includes(scene)) list.sort((a, b) => ['733324', '000253', '557348'].indexOf(a.id) - ['733324', '000253', '557348'].indexOf(b.id));
    if (['query-add', 'query-more'].includes(scene)) list.sort((a, b) => a.id === '557348' ? -1 : b.id === '557348' ? 1 : 0);
    return list.filter(x => !['draft', 'old', 'person'].includes(x.id));
  }, [suppliers, shot, scene, mine]);
  const list = fixtureList.filter(s => (!search || [s.name, s.inviter].some(x => x.includes(search))) && (!filters.type || s.type === filters.type) && (!filters.status || s.status === filters.status) && (!filters.recommended || s.recommended === filters.recommended) && (!filters.inviter || s.inviter.includes(filters.inviter)) && (!filters.start || s.date.slice(0, 10) >= filters.start) && (!filters.end || s.date.slice(0, 10) <= filters.end));
  const pick = (s, next) => { select(s.id); go(next); };
  const back = () => ['rating-edit', 'rating-detail'].includes(scene) ? go(ratingReturn) : isRegistration && step > 0 ? setStep(step - 1) : go(editingRegistration ? 'mine' : 'query');
  const preview = name => setSheet({ kind: 'attachment', name });
  function exportDemo() {
    const rows = [['供应商名称', '供应商类型', '审批状态', '邀请人', '邀请时间'], ...list.map(s => [s.name, s.type, s.status, s.inviter, s.date])];
    const safe = v => { const text = String(v); return '"' + (/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"'; };
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = '供应商-演示数据.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('已导出' + list.length + '条演示记录');
  }
  function runConfirmation() {
    const action = confirm; setConfirm(null);
    if (action.type === 'export') return exportDemo();
    if (action.type === 'delete') {
      if (!action.ids.length) return notify('请选择草稿供应商');
      if (suppliers.some(s => action.ids.includes(s.id) && s.status !== '草稿')) return notify('仅草稿供应商可以删除');
      setSuppliers(suppliers.filter(s => !action.ids.includes(s.id))); setChecked([]); notify('演示草稿已删除');
    }
    if (action.type === 'reinvite') {
      setSuppliers(suppliers.map(s => s.id === action.id ? { ...s, status: '邀请中', code: '', banks: [], permissions: [], basic: undefined, contacts: [], updated: now() } : s));
      notify('原型演示：已重新邀请，未发送真实邮件');
    }
    if (action.type === 'delete-bank') setBanks(banks.flatMap((b, i) => i !== action.index ? [b] : b.change === '新增' ? [] : [{ ...b, change: '删除' }]));
    if (action.type === 'delete-permission') setPermissions(permissions.flatMap((p, i) => i !== action.index ? [p] : p.change === '新增' ? [] : [{ ...p, change: '删除' }]));
  }
  function saveBank() {
    const error = bankError(bankForm, supplier.type === supplierTypes[0]); if (error) return notify(error);
    if (banks.some((b, i) => i !== editingBank && b.change !== '删除' && b.accountType === '基本账户' && bankForm.accountType === '基本账户')) return notify('基本账户只能有一个');
    const entry = { ...bankForm, id: editingBank < 0 ? crypto.randomUUID() : banks[editingBank].id, change: editingBank < 0 || banks[editingBank].change === '新增' ? '新增' : '修改' };
    setBanks(editingBank < 0 ? [entry, ...banks] : banks.map((b, i) => i === editingBank ? entry : b)); setShowBankForm(false); setEditingBank(-1);
  }
  function nextStep() {
    if (step === 0) {
      for (const [key, label, required] of fieldsFor(basic.type)) if (required && !basic[key]?.trim()) return notify('请填写' + label);
      if ([supplierTypes[0], supplierTypes[3]].includes(basic.type) && !basic.proof) return notify('请上传证照附件');
      if (!shot && !validEmail(basic.registerEmail)) return notify('请输入正确的供应商注册邮箱');
      if (basic.email && !validEmail(basic.email)) return notify('请输入正确的邮箱格式');
      if (basic.capital && !/^\d+$/.test(basic.capital)) return notify('注册资金只支持整数');
      if (basic.companyPhone && !/^(1\d{10}|\d{3,4}-?\d{8})$/.test(basic.companyPhone)) return notify('公司电话须为11位手机号或区号加8位号码');
      if (suppliers.some(x => x.id !== selectedId && ((basic.type !== supplierTypes[1] && x.name === basic.supplierName) || (basic.creditCode && x.code === basic.creditCode)))) return notify('供应商名称或证件号码已存在');
    }
    if (step === 1 && contacts.some(c => !c.name || !c.phone || !validEmail(c.email))) return notify('请填写联系人的姓名、电话和正确邮箱');
    if (step === 2) {
      if (!registerBanks.length) return notify('请添加银行信息');
      if (basic.type === supplierTypes[0] && registerBanks.filter(b => b.accountType === '基本账户').length !== 1) return notify('企业供应商必须有且只有一个基本账户');
      for (const b of registerBanks) { const error = bankError(b, basic.type === supplierTypes[0]); if (error) return notify(error); }
    }
    setStep(step === 0 && basic.type === supplierTypes[1] ? 2 : step + 1); window.scrollTo(0, 0);
  }
  function submitRegister() {
    if (saving) return; setSaving(true);
    const patch = { name: basic.supplierName, type: basic.type, code: basic.creditCode || '', email: basic.registerEmail || '', contact: contacts[0]?.name || '', phone: contacts[0]?.phone || '', banks: clone(registerBanks), basic: clone(basic), contacts: clone(contacts) };
    if (editingAll) {
      update({ pendingInformation: patch, status: '变更中' });
      notify('原型演示：信息变更已提交，等待审批');
    } else if (editingRegistration) {
      update({ ...patch, status: '审批中' }); notify('原型演示：草稿已提交，等待审批');
    } else {
      const id = crypto.randomUUID();
      setSuppliers([{ ...patch, id, status: '审批中', mode: '代注册', inviter: '陈才慧', date: now(), updated: now(), score: '未评分', permissions: [] }, ...suppliers]); select(id);
      notify('原型演示：注册已提交，等待审批');
    }
    go('mine');
  }
  function saveDraft() {
    const patch = { basic: clone(basic), name: basic.supplierName, type: basic.type, email: basic.registerEmail, code: basic.creditCode || '', banks: clone(registerBanks), contacts: clone(contacts), updated: now() };
    if (editingRegistration && !editingAll) update(patch);
    else { const id = crypto.randomUUID(); setSuppliers([{ ...patch, id, status: '草稿', inviter: '陈才慧', mode: '代注册', date: now(), permissions: [], score: '未评分' }, ...suppliers]); select(id); }
    notify('演示草稿已保存'); go('mine');
  }

  function saveRegisterBank() {
    const error = bankError(registerBankForm, basic.type === supplierTypes[0]); if (error) return notify(error);
    if (registerBanks.some(b => b.accountType === '基本账户' && registerBankForm.accountType === '基本账户')) return notify('基本账户只能有一个');
    setRegisterBanks([...registerBanks, { ...registerBankForm, id: crypto.randomUUID() }]); setRegisterBankPicker(false);
  }

  return <div className={'mobile-page ' + (shot ? 'm-shot ' : '') + (shot?.sourceHeight > 2340 ? 'm-long-shot ' : '') + (listScene ? 'm-list-page' : '')} data-scene={scene}>
    {shot && <div className="m-watermark" aria-hidden="true">{Array.from({ length: 60 }, (_, i) => <span key={i}>{shot.index < 25 ? '孙志强213852' : '陈才慧208660'}</span>)}</div>}
    {shot && <div className="m-status-bar"><span>{shot.time.slice(0, 2)}:{shot.time.slice(2, 4)}</span><div><Signal /><Wifi /><Battery /><small>67</small></div></div>}
    <Header onBack={back} title={scene.startsWith('portal') ? '协同门户-登录' : '供应商管理平台'} close={scene.startsWith('portal') ? () => go('query') : undefined} />
    {(listScene || ['ratings', 'my-ratings', 'rating-ops', 'bank-application'].includes(scene)) && <Tabs active={tab} onChange={i => go(['query', 'mine', 'my-ratings', 'ratings', 'rating-ops', 'bank-application'][i])} />}
    {listScene && <>
      <SearchBox value={search} onChange={setSearch}><button className="m-icon-button" aria-label="筛选供应商" onClick={() => setFiltering(true)}><Filter /></button>{(mine || adminScene) && <button className="m-icon-button" aria-label={batch ? '退出批量选择' : '批量选择'} onClick={() => { setBatch(!batch); setChecked([]); }}>{batch ? <X /> : <List />}</button>}</SearchBox>
      <SupplierList suppliers={list} mine={mine} batch={batch} checked={checked} setChecked={setChecked} admin={adminScene} onDetail={s => pick(s, 'detail')} onBank={s => pick(s, 'bank')} onMore={(s, approval) => { select(s.id); approval ? go('approval') : setSheet('more'); }} onInviter={s => pick(s, 'inviter')} onReinvite={s => setConfirm({ type: 'reinvite', id: s.id, text: '重新邀请将清除已填写信息，是否继续？' })} onEdit={s => pick(s, 'register-edit')} onEditAll={s => pick(s, 'register-edit-all')} onDelete={s => setConfirm({ type: 'delete', ids: [s.id], text: '确认删除该草稿供应商？删除后原有信息全部作废。' })} />
      {!batch && <div className="m-fab-group">{expanded && <div className="m-fab-menu"><button onClick={() => go('invite')}><span><ClipboardPlus /></span>邀请注册</button><button onClick={() => go('register')}><span><ClipboardPlus /></span>代注册</button>{(scene === 'query-export' || (adminScene && mine)) && <button onClick={() => setConfirm({ type: 'export', text: '请确定是否要导出当前查询条件下的所有明细？' })}><span><ClipboardPlus /></span>导出</button>}</div>}<button className="m-fab m-fab-blue" aria-label={expanded ? '收起新增入口' : '新增供应商'} onClick={() => setExpanded(!expanded)}>{expanded ? <X /> : <Plus />}</button></div>}
      {batch && <footer className="m-batch-actions"><label className="m-checkbox"><input type="checkbox" aria-label="全选" checked={!!list.length && checked.length === list.length} onChange={e => setChecked(e.target.checked ? list.map(x => x.id) : [])} /><span>{checked.length === list.length && !!list.length && <Check />}</span>全选</label><button onClick={() => { if (!checked.length) return notify('请选择供应商'); if (mine) notify('批量变更规则待确认，当前可逐条变更邀请人'); else if (adminScene) setConfirm({ type: 'delete', ids: checked, text: '仅删除选中的草稿供应商，确认继续？' }); }}>{mine ? '邀请人批量变更' : '删除'}</button></footer>}
    </>}
    {(scene === 'filter' || filtering) && <div className={filtering ? 'm-fullscreen-panel' : ''}>{filtering && <Header onBack={() => setFiltering(false)} />}<FilterView initial={filters} onApply={v => { if (v.start && v.end && v.start > v.end) return notify('开始时间不能晚于结束时间'); setFilters(v); filtering ? setFiltering(false) : go('query'); }} onCancel={() => filtering ? setFiltering(false) : go('query')} /></div>}
    {scene.startsWith('detail') && <SupplierDetail supplier={supplier} initialTab={scene === 'detail-bank' ? 2 : scene === 'detail-approval-empty' ? 6 : scene === 'detail-ratings' ? 7 : 0} approvalEmpty={scene === 'detail-approval-empty'} onPreview={preview} ratings={ratings} onScore={() => { setActiveRating(null); setRatingReturn('detail-ratings'); go('rating-edit'); }} onRatingOpen={(record, readOnly) => { setActiveRating(record); setRatingReturn('detail-ratings'); go(readOnly ? 'rating-detail' : 'rating-edit'); }} />}
    {scene.startsWith('approval') && <Approval supplier={{ ...supplier, name: '北京初然文化传媒有限公司827583' }} history={scene === 'approval-history'} number={shot?.time === '194516' ? 'SUP202610140006' : 'SUP202610140004'} showSupplier={!shot || shot.time !== '194516'} />}
    {['bank', 'bank-tip'].includes(scene) && <>
      <Section title="供应商信息"><Row label="供应商名称" required>{supplier.name}</Row><Row label="供应商类型" required>{supplier.type}</Row></Section>
      <Section title="银行信息">{banks.map((b, i) => <BankCard key={b.id} bank={b} onPreview={() => preview(b.proof)} onEdit={b.change === '删除' ? undefined : () => { setEditingBank(i); setBankForm(clone(b)); setShowBankForm(true); }} onDelete={supplier.type === supplierTypes[0] && b.accountType === '基本账户' || b.change === '删除' ? undefined : () => setConfirm({ type: 'delete-bank', index: i, text: '是否将该银行账户标记为删除？' })} />)}<Empty text="暂无更多相关数据" /></Section>
      <button className="m-fab m-fab-white" aria-label="新增银行信息" onClick={() => { setEditingBank(-1); setBankForm(blankBank(supplier.name)); setShowBankForm(true); }}><ClipboardPlus /></button>{!showBankForm && <Actions items={[{ label: '取消', onClick: () => { update({ pendingBanks: undefined }); go('query'); } }, { label: '提交', onClick: () => { if (!banks.some(x => x.change)) return notify('请先修改银行信息'); if (supplier.type === supplierTypes[0] && banks.filter(b => b.change !== '删除' && b.accountType === '基本账户').length !== 1) return notify('企业供应商必须有且只有一个基本账户'); update({ pendingBanks: clone(banks), status: '变更中' }); notify('原型演示：银行变更已提交，等待审批'); go('query'); } }]} />}
    </>}
    {(scene.startsWith('bank-form') || showBankForm) && <div className={showBankForm ? 'm-fullscreen-panel' : ''}>{showBankForm && <Header onBack={() => setShowBankForm(false)} />}<BankFields bank={bankForm} setBank={setBankForm} company={supplier.type === supplierTypes[0]} /><Actions items={[{ label: '取消', onClick: () => showBankForm ? setShowBankForm(false) : go('bank') }, { label: '提交', onClick: () => { if (showBankForm) saveBank(); else { const error = bankError(bankForm, supplier.type === supplierTypes[0]); if (error) return notify(error); update({ pendingBanks: [{ ...bankForm, id: crypto.randomUUID(), change: '新增' }, ...supplier.banks] }); notify('银行信息已暂存'); go('bank'); } } }]} /></div>}
    {['bank-select', 'branch-select', 'people', 'people-empty'].includes(scene) && <ReferenceList kind={scene.startsWith('people') ? 'people' : scene === 'bank-select' ? 'bank' : 'branch'} selected={scene === 'branch-select' ? exampleBank.branch : ''} initialSearch={scene === 'people' ? '周' : ''} onCancel={() => go(scene.startsWith('people') ? 'inviter' : 'bank')} onConfirm={v => { notify('已选择' + v); go(scene.startsWith('people') ? 'inviter-selected' : 'bank-form-selected'); }} />}
    {scene.startsWith('permissions') && <><Section title="供应商信息"><Row label="供应商名称">{supplier.name}</Row><Row label="供应商类型">{supplier.type}</Row></Section><Section title="分配权限">{permissions.map((p, i) => <PermissionCard key={p.id} data={p} onEdit={p.change === '删除' ? undefined : () => setPermissionForm({ data: p, index: i })} onDelete={p.change === '删除' ? undefined : () => setConfirm({ type: 'delete-permission', index: i, text: '是否删除该权限？提交后生效。' })} />)}<Empty text="暂无更多相关数据" /></Section><button className="m-fab m-fab-white" aria-label="新增权限" onClick={() => setPermissionForm({ index: -1 })}><ClipboardPlus /></button>{!permissionForm && <Actions items={[{ label: '取消', onClick: () => go('query') }, { label: '提交', onClick: () => { if (!permissions.some(p => p.change)) return notify('请先新增、修改或删除权限'); update({ pendingPermissions: clone(permissions), status: '变更中' }); notify('原型演示：权限分配已提交，等待审批'); go('query'); } }]} />}</>}
    {(scene === 'permission-form' || permissionForm) && <div className={permissionForm ? 'm-fullscreen-panel' : ''}>{permissionForm && <Header onBack={() => setPermissionForm(false)} />}<PermissionForm initial={permissionForm?.data} notify={notify} onCancel={() => permissionForm ? setPermissionForm(false) : go('permissions')} onSave={p => { if (permissions.some((x, i) => i !== permissionForm?.index && x.change !== '删除' && x.group === p.group && x.category === p.category)) return notify('该权限已存在'); const next = { ...p, id: permissionForm?.data?.id || crypto.randomUUID(), change: permissionForm?.index >= 0 && permissionForm?.data?.change !== '新增' ? '修改' : '新增' }; setPermissions(permissionForm?.index >= 0 ? permissions.map((x, i) => i === permissionForm.index ? next : x) : [next, ...permissions]); permissionForm ? setPermissionForm(false) : go('permissions-added'); }} /></div>}
    {scene.startsWith('inviter') && <><Section title="供应商信息"><Row label="供应商名称" required>{supplier.name}</Row><Row label="供应商类型" required>{supplier.type}</Row></Section><Section title="申请人信息"><Row label="原邀请人" required>{supplier.inviter}</Row><div className="m-field-divider" /><Field label="新邀请人" required value={newInviter} onPick={() => setPeoplePicker(true)} /><p className="m-inviter-note">审批提醒：原邀请人在职时由原邀请人审批；离职时由原部门领导审批；部门无法查询时由异常管理员审批。发起人是原邀请人时直接通过。</p></Section><Actions items={[{ label: '取消', onClick: () => go('query') }, { label: '提交', onClick: () => { if (!newInviter) return notify('请选择新邀请人'); if (newInviter === supplier.inviter) return notify('新邀请人不能与原邀请人相同'); update({ inviter: newInviter, status: supplier.inviter === '陈才慧' ? '已审批' : '变更中' }); notify('原型演示：邀请人变更已提交'); go('query'); } }]} /></>}
    {peoplePicker && <div className="m-fullscreen-panel"><Header onBack={() => setPeoplePicker(false)} /><ReferenceList kind="people" onCancel={() => setPeoplePicker(false)} onConfirm={v => { setNewInviter(v); setPeoplePicker(false); }} /></div>}
    {scene === 'invite' && <InviteForm notify={notify} onCancel={() => go('query')} onSave={data => { if (data.type !== supplierTypes[1] && suppliers.some(s => s.name === data.name)) return notify('供应商名称已存在'); setSuppliers([{ ...data, id: crypto.randomUUID(), status: '邀请中', mode: '邀请注册', inviter: '陈才慧', date: now(), updated: now(), score: '未评分', code: '', banks: [], permissions: [] }, ...suppliers]); notify('原型演示：邀请已暂存，未发送真实邮件'); go('mine'); }} />}
    {isRegistration && !['address', 'region'].includes(scene) && <>
      {editingRegistration && <div className="m-form-heading">{editingAll ? '修改全部信息' : '修改草稿'}</div>}
      <div className="m-steps">{(basic.type === supplierTypes[1] ? ['基本信息', '银行信息', '预览提交'] : ['基本信息', '联系人信息', '银行信息', '预览提交']).map((label, i) => { const real = basic.type === supplierTypes[1] && i > 0 ? i + 1 : i; return <div className={real <= step ? 'done' : ''} key={label}><span>{label}</span><i>{real === step ? <Check /> : <b />}</i><small>{['营业执照、证书、合作内容等', '供应商联系人电话及邮箱等', '银行账号、开户证明等', ''][real]}</small></div>; })}</div>
      {step === 0 && <BasicFields data={basic} setData={setBasic} shot={!!shot} onAddress={() => setAddressOpen(true)} initialDate={scene === 'expiry'} />}
      {step === 1 && <ContactFields contacts={contacts} setContacts={setContacts} />}
      {step === 2 && <div className="m-register-banks">{registerBanks.map((b, i) => <div className="m-inline-bank" key={b.id}><h2 className="m-form-heading">银行信息 {i + 1}</h2><button className="m-delete-contact" aria-label={'删除银行' + (i + 1)} onClick={() => setRegisterBanks(registerBanks.filter((_, n) => n !== i))}><X /></button><BankFields bank={b} setBank={v => setRegisterBanks(registerBanks.map((x, n) => n === i ? v : x))} company={basic.type === supplierTypes[0]} /></div>)}<button className="m-dashed-add" onClick={() => { setRegisterBankForm(blankBank(basic.supplierName)); setRegisterBankPicker(true); }}><Plus />添加</button></div>}
      {step === 3 && <div className="m-register-preview"><Section title="基本信息">{fieldsFor(basic.type).map(([key, label]) => <Row key={key} label={label}>{basic[key]}</Row>)}<Row label="供应商注册邮箱">{basic.registerEmail}</Row>{basic.proof && <Row label="证照附件"><button onClick={() => preview(basic.proof)}>{basic.proof}</button></Row>}</Section>{basic.type !== supplierTypes[1] && <Section title="联系人信息">{contacts.map(c => <div key={c.id}>{[['name', '姓名'], ['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{c[key]}</Row>)}</div>)}</Section>}<Section title="银行信息">{registerBanks.map(b => <BankCard key={b.id} bank={b} onPreview={() => preview(b.proof)} />)}</Section></div>}
      <Actions items={[...(!editingAll ? [{ label: '保存草稿', secondary: true, onClick: saveDraft }] : []), ...(step > 0 ? [{ label: '上一步', secondary: true, onClick: () => { setStep(step === 2 && basic.type === supplierTypes[1] ? 0 : step - 1); window.scrollTo(0, 0); } }] : []), { label: step === 3 ? '提交' : '下一步 (' + (basic.type === supplierTypes[1] ? step === 0 ? 1 : 2 : step + 1) + ' / ' + (basic.type === supplierTypes[1] ? 3 : 4) + ')', disabled: saving, onClick: step === 3 ? submitRegister : nextStep }]} />
    </>}
    {(addressOpen || ['address', 'region'].includes(scene)) && <div className={addressOpen ? 'm-fullscreen-panel' : ''}>{addressOpen && <Header onBack={() => setAddressOpen(false)} />}<AddressForm initial={shot ? '云南省/保山市/龙陵县 个哈哈哈哈' : basic.address} startRegion={scene === 'region'} onConfirm={v => { setBasic({ ...basic, address: v }); addressOpen ? setAddressOpen(false) : go('register'); }} onCancel={() => setAddressOpen(false)} /></div>}
    {registerBankPicker && <div className="m-fullscreen-panel"><Header onBack={() => setRegisterBankPicker(false)} /><BankFields bank={registerBankForm} setBank={setRegisterBankForm} company={basic.type === supplierTypes[0]} /><Actions items={[{ label: '取消', onClick: () => setRegisterBankPicker(false) }, { label: '添加以上信息', onClick: saveRegisterBank }]} /></div>}
    {['ratings', 'my-ratings'].includes(scene) && <RatingWorkspace mine={scene === 'my-ratings'} records={ratings} filters={filters} go={go} onOpen={(record, readOnly) => { setActiveRating(record); setRatingReturn(scene); go(readOnly ? 'rating-detail' : 'rating-edit'); }} onAdd={() => { setActiveRating(null); setRatingReturn(scene); go('rating-edit'); }} />}
    {['rating-edit', 'rating-detail'].includes(scene) && (scene === 'rating-detail' && !activeRating ? <><Empty text="未选择评分记录，请返回列表重新选择" /><Actions items={[{ label: '返回评分列表', onClick: () => go('my-ratings') }]} /></> : <RatingEditor record={activeRating} supplier={activeRating ? suppliers.find(x => x.name === activeRating.name) || { name: activeRating.name, type: '', status: '', inviter: '', date: '', mode: '' } : supplier} readOnly={scene === 'rating-detail'} notify={notify} onCancel={() => go(ratingReturn)} onSave={record => { setRatings(list => list.some(x => x.id === record.id) ? list.map(x => x.id === record.id ? record : x) : [record, ...list]); notify('演示评分已保存'); go(ratingReturn); }} />)}
    {['rating-filter', 'department'].includes(scene) && <FilterView rating initial={filters} onCancel={() => go(filters.return || 'ratings')} onApply={v => { if (v.start && v.end && v.start > v.end) return notify('评分开始时间不能晚于结束时间'); go((filters.return || 'ratings') + '?' + new URLSearchParams(v).toString()); }} />}
    {scene === 'rating-ops' && <RatingOperations notify={notify} />}
    {scene === 'bank-application' && <BankApplication onApply={() => go('bank-application-form')} />}
    {['bank-application-form', 'application-empty'].includes(scene) && <BankApplicationForm notify={notify} onCancel={() => go('bank-application')} />}
    {scene.startsWith('portal') && <div className="m-legacy-portal"><div className="m-sohu-logo"><img src="/mobile-assets/logo-source.jpg" alt="搜狐 SOHU.com" /></div><h2><i className="m-blue-mark" />{passwordScreen ? '修改密码' : '用户登录'}</h2><p className="m-login-english">Please login or register</p><div className="m-portal-form">
      {!passwordScreen && <><Field label="账号" required value={portal.account} onChange={account => setPortal({ ...portal, account })} placeholder="请输入登录账号" /><Field label="密码" required type="password" value={portal.password} onChange={password => setPortal({ ...portal, password })} placeholder="请输入登录密码" /><div className="m-captcha-field"><Field label="验证码" required value={portal.captcha} onChange={v => setPortal({ ...portal, captcha: v })} placeholder="请输入验证码" /><span className="m-captcha">{captcha}</span><button onClick={() => { setCaptcha(captcha === 'cbvs' ? '39qq' : 'cbvs'); setPortal({ ...portal, captcha: '' }); }}>换一张</button></div></>}
      {(portalEmail || passwordScreen) && <><Field label="注册邮箱" required type="email" value={portal.email} onChange={email => setPortal({ ...portal, email })} /><button className="m-send-code" disabled={countdown > 0} onClick={() => { if (!validEmail(portal.email)) return notify('请输入正确的注册邮箱'); setCountdown(60); notify('演示验证码：123456；未发送真实邮件'); }}>{countdown ? countdown + ' s 后可重发' : '发送验证码'}</button><Field label="邮箱验证码" required value={portal.code} onChange={code => setPortal({ ...portal, code })} /></>}
      {passwordScreen && <Field label="新密码" required type="password" value={newPassword} onChange={setNewPassword} />}
      <button className="m-forgot-link" onClick={() => { setPasswordScreen(!passwordScreen); setNewPassword(''); }}>{passwordScreen ? '返回登录' : '修改密码'}</button><button className="m-login-button" onClick={() => { if (passwordScreen) { if (!validEmail(portal.email)) return notify('请填写注册邮箱'); if (portal.code !== '123456') return notify('邮箱验证码错误'); if (!newPassword) return notify('请输入新密码'); notify('原型演示：密码修改完成，未更新真实账号'); setPasswordScreen(false); } else if (!portalEmail) { if (!portal.account || !portal.password) return notify('请输入账号和密码'); if (portal.captcha.toLowerCase() !== captcha) return notify('图形验证码错误'); setPortalEmail(true); } else { if (!validEmail(portal.email)) return notify('请填写注册邮箱'); if (portal.code !== '123456') return notify('邮箱验证码错误'); notify('原型演示：邮箱验证通过，未登录真实系统'); go('query'); } }}>{passwordScreen ? '提交' : portalEmail ? '登录' : '下一步'}</button>
    </div></div>}
    {sheet === 'more' && <Overlay sheet label="更多操作" onClose={() => setSheet(null)}><div className="m-action-sheet">{['分配权限', '变更邀请人', '审批记录'].map((label, i) => <button key={label} onClick={() => { setSheet(null); go(['permissions', 'inviter', 'approval'][i]); }}>{label}</button>)}<button className="cancel" onClick={() => setSheet(null)}>取消</button></div></Overlay>}
    {sheet?.kind === 'attachment' && <Overlay label="查看附件" onClose={() => setSheet(null)}><h2>查看附件</h2><p>{sheet.name}</p>{sheet.name === '开户证明.png' ? <span className="m-proof-large"><img src="/mobile-assets/bank-proof-source.jpg" alt="开户证明" /></span> : <p>该演示样本没有附件原件</p>}<div className="m-dialog-actions"><button onClick={() => setSheet(null)}>关闭</button></div></Overlay>}
    {confirm && <Confirm text={confirm.text} onCancel={() => setConfirm(null)} onConfirm={runConfirmation} />}
    {tip && <ScreenshotTip onClose={() => setTip(false)} />}
    {shot && <button className={'m-vconsole m-vconsole-' + scene} onClick={() => setDebug(!debug)}>vConsole</button>}
    {debug && <Overlay sheet label="vConsole" onClose={() => setDebug(false)}><div className="m-picker-title"><strong>vConsole</strong><button onClick={() => setDebug(false)}>关闭</button></div><p className="m-debug-note">当前为截图复刻状态，未连接调试服务。</p></Overlay>}
    {shot && <div className="m-android-nav"><span /><i /><b /></div>}
  </div>;
}

