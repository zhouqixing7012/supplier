import { portalTaskTabFor } from './mobile-portal-filters.js';
import { readMobileSearch } from './mobile-prototype-runtime.js';
import { usePanelState } from './mobile-motion.jsx';
import { AddressForm, Actions, PickerHeading, RecordCard, RecordCollection, Confirm, Empty, Overlay, Row, Section, Tabs } from '../components/mobile/index.js';
import { focusFormError } from '../components/mobile/validation.js';
import { regionData } from './registration-regions.js';
import React, { useEffect, useRef, useState } from 'react';
import { Building2, Store, FolderClock, FolderCheck, ReceiptText, Receipt, Plane, Train, Hotel, Car, Upload, Download, LoaderCircle, Plus, Mail, MailCheck, KeyRound, LockKeyhole, ChevronRight, X, LogOut } from 'lucide-react';
import { RegistrationSteps, StatusTag } from './mobile-ui.jsx';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { BankCard, BankFields, BasicFields, ContactFields, bankFieldError, fieldsFor, blankBank, registrationBasicError, registrationBankError, registrationContactError } from './mobile-forms.jsx';
import { supplierTypes } from './mobile-data.js';
import { Approval } from './mobile-views.jsx';
import { CertificateAttachmentRows } from './mobile-registration-preview.jsx';
import { createSessionId, SwipeArea, useBackLayer, useDirtyForm } from './mobile-interaction.jsx';
import { informationSteps, isEffectiveBasicBankAccount, effectiveBasicBankDeleteError } from './mobile-edit-rules.js';
import { RegistrationPreview } from './mobile-registration-preview.jsx';
import { ChangeComparison } from './mobile-changes.jsx';
import { AccountSecurityForm } from './mobile-account.jsx';
import { PortalTaskList } from './mobile-portal-tasks.jsx';
import { PortalPricingDetail } from './mobile-portal-pricing.jsx';
import { readProcurementNotice } from './mobile-portal-procurement.js';

const clone = value => structuredClone(value);
const homeGroups = [
  { title: '信息管理', entries: [
    { label: '供应商信息管理', lines: ['供应商', '信息管理'], icon: Store, color: 'blue', route: 'workspace-info' },
    { label: '修改密码', lines: ['修改密码'], icon: LockKeyhole, color: 'blue', route: 'workspace-account-password' },
    { label: '修改注册邮箱', lines: ['修改', '注册邮箱'], icon: MailCheck, color: 'blue', route: 'workspace-account-email' },
  ] },
  { title: '采购报价管理', entries: [
    { label: '报价管理待处理', lines: ['报价管理', '待处理'], icon: FolderClock, color: 'orange', route: 'workspace-tasks', task: 0 },
    { label: '报价管理已处理', lines: ['报价管理', '已处理'], icon: FolderCheck, color: 'green', route: 'workspace-tasks', task: 1 },
  ] },
  { title: '采购价税拆分', entries: [
    { label: '价税拆分待处理', lines: ['价税拆分', '待处理'], icon: ReceiptText, color: 'orange', route: 'workspace-tasks', task: 2 },
    { label: '价税拆分已处理', lines: ['价税拆分', '已处理'], icon: Receipt, color: 'green', route: 'workspace-tasks', task: 3 },
  ] },
];
const travelEntryDefinitions = [
  { key: 'train', label: '火车账单', Icon: Train },
  { key: 'hotel', label: '酒店账单', Icon: Hotel },
  { key: 'flight', label: '飞机账单', Icon: Plane },
  { key: 'rental', label: '租车账单', Icon: Car },
];
function TravelBillUploadEntry({ entry, notify, api }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [fileNames, setFileNames] = useState([]);
  const selectFiles = async event => {
    const selected = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (!selected.length) return;
    setFileNames(selected.map(file => file.name));
    setStatus('uploading');
    setMessage('正在上传…');
    try {
      await api.uploadTravelBill(entry.key, selected);
      setStatus('success');
      setMessage(`上传成功，共 ${selected.length} 个附件`);
      notify(entry.label + '上传成功');
    } catch (error) {
      const reason = error instanceof Error && error.message ? error.message : '上传失败，请重试';
      setStatus('error');
      setMessage(reason);
      notify(reason);
    }
  };
  return <div className="m-travel-upload-entry" data-travel-type={entry.key} data-upload-status={status}>
    <input ref={inputRef} className="m-file-input" type="file" multiple aria-label={entry.label + '附件'} onChange={selectFiles} />
    <button type="button" className="m-travel-upload-button" aria-label={entry.label + '上传附件'} disabled={status === 'uploading'} onClick={() => inputRef.current?.click()}>
      <span className="m-travel-entry-icon"><entry.Icon aria-hidden="true" /></span>
      <span className="m-travel-entry-copy"><strong>{entry.label}</strong><small>{status === 'uploading' ? '正在上传…' : '点击选择文件'}</small></span>
      {status === 'uploading' ? <LoaderCircle className="m-travel-upload-spinner" aria-hidden="true" /> : <Upload aria-hidden="true" />}
    </button>
    {message && <p className="m-travel-upload-message" data-status={status} aria-live="polite">{message}</p>}
    {fileNames.length > 0 && <p className="m-travel-upload-files">{fileNames.join('、')}</p>}
  </div>;
}

function TravelTemplateDownload({ notify, api }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const file = await api.downloadTravelTemplate();
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url; link.download = file.name; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      notify(error instanceof Error ? error.message : '模板下载失败，请重试');
    } finally { setLoading(false); }
  };
  return <div className="m-travel-template"><p>上传文件格式为xls、xlsx</p><button type="button" onClick={download} disabled={loading}><Download aria-hidden="true" />{loading ? '下载中' : '模板下载'}</button></div>;
}

function PortalProcurementNotice({ go, notify, store, onPreview, api }) {
  const notice = readProcurementNotice(readMobileSearch());
  const account = api.getAccount();
  const loginRoute = notice && !account ? 'portal?' + new URLSearchParams(notice) : '';
  useEffect(() => {
    if (!loginRoute) return;
    const next = setTimeout(() => go(loginRoute), 0);
    return () => clearTimeout(next);
  }, [go, loginRoute]);

  if (loginRoute) return <Empty text="请先登录供应商协同门户" />;
  const quote = notice?.task === 'quote';
  const record = api.getProcurementNotice(notice);
  if (!record) return <>
    <Empty text="找不到该采购任务，或当前账号无权查看" />
    <Actions items={[{ label: account ? '返回工作台' : '返回登录', onClick: () => go(account ? 'workspace-home' : 'portal') }]} />
  </>;

  store.portalTaskTab = (quote ? 0 : 2) + Number(record.status === '已处理');
  return <PortalPricingDetail quote={quote} api={api} record={record} store={store} go={go} notify={notify} onPreview={onPreview} />;
}

export function PortalWorkspace(props) {
  return props.scene === 'workspace-procurement'
    ? <div className="m-workspace"><PortalProcurementNotice {...props} /></div>
    : <PortalWorkspaceContent {...props} />;
}

function PortalWorkspaceContent({ scene, go, notify, store, onPreview, accountMenu, setAccountMenu, api, mapParams = {} }) {
  const profile = api.getProfile();
  const savedProfileDraft = api.getProfileDraft();
  const [draft, setDraft] = useState(() => clone(savedProfileDraft || profile));
  const [editing, setEditing] = useState(scene === 'workspace-info' && new URLSearchParams(readMobileSearch()).get('edit') === '1');
  const [tab, setTab] = useState(/^[0-3]$/.test(mapParams.step ?? mapParams.tab) ? Number(mapParams.step ?? mapParams.tab) : Math.min(store.portalInfoTab || 0, 2));
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const editSteps = informationSteps(draft.basic.type === supplierTypes[1]);
  const [taskTab, setTaskTab] = useState(() => portalTaskTabFor(mapParams.tab, store.portalTaskTab));
  const [address, setAddress] = usePanelState(editing && mapParams.panel === 'address');
  const [bankIndex, setBankIndex] = usePanelState(mapParams.panel === 'bank' ? -1 : null);
  const [bank, setBank] = useState(() => mapParams.panel === 'bank' ? blankBank(profile.name) : null);
  const [invalidContact, setInvalidContact] = useState(null);
  const [removeBank, setRemoveBank] = useState(null);
  const isOriginalBasicBank = bank => isEffectiveBasicBankAccount(bank, profile.banks, profile.type === supplierTypes[0]);
  const [logout, setLogout] = useState(mapParams.panel === 'logout');
  const guard = useDirtyForm(draft, editing);
  const bankGuard = useDirtyForm(bank, bankIndex !== null);
  const closeBank = () => bankGuard.leave(() => setBankIndex(null));
  useBackLayer(bankIndex !== null, closeBank);
  const pending = api.getPendingProfile() || (scene === 'workspace-approval' && mapParams.map
    ? { ...profile, basic: { ...profile.basic, businessScope: '技术服务与项目交付' } }
    : null);
  const setInfoTab = i => { store.portalInfoTab = i; setTab(i); };
  const setTasks = i => { store.portalTaskTab = i; setTaskTab(i); };
  const cancel = () => guard.leave(() => {
    api.discardProfileDraft(); setDraft(clone(profile)); setEditing(false); setInfoTab(0);
  });
  const validateStep = index => {
    if (index === 0) return registrationBasicError(draft.basic);
    if (index === 1) return registrationContactError(draft.contacts, false);
    if (index === 2) return registrationBankError(draft.banks, draft.basic.type === supplierTypes[0], profile.banks);
  };
  const showValidation = (index, error) => {
    notify(error.message, false);
    setInfoTab(index);
    if (index === 1 && error.index !== undefined) {
      setInvalidContact(error);
      return;
    }
    if (index === 2 && error.index !== undefined) beginBank(draft.banks[error.index], error.index);
    focusFormError(error);
  };
  const showPreview = () => {
    for (const index of editSteps.slice(0, -1)) {
      const error = validateStep(index);
      if (error) return showValidation(index, error);
    }
    setInfoTab(3);
  };
  const changeInformationStep = index => {
    if (index === 3) { showPreview(); return; }
    setStepsExpanded(index === 0); setInfoTab(index);
  };
  const next = () => {
    const error = validateStep(tab); if (error) return showValidation(tab, error);
    changeInformationStep(editSteps[editSteps.indexOf(tab) + 1]);
  };
  const submit = () => {
    for (const index of editSteps.slice(0, -1)) {
      const error = validateStep(index); if (error) return showValidation(index, error);
    }
    const next = { ...draft, name: draft.basic.supplierName, type: draft.basic.type, email: draft.basic.registerEmail.trim(), basic: { ...draft.basic, registerEmail: draft.basic.registerEmail.trim() } };
    if (JSON.stringify(next) === JSON.stringify(profile)) return notify('请先修改信息');
    api.submitProfile(next);
    store.portalInfoTab = 0;
    guard.accept(); notify('原型演示：资料变更已提交，等待审批'); go('workspace-approval');
  };
  const backFromInformation = () => {
    if (!editing) return go('workspace-home');
    const position = editSteps.indexOf(tab);
    if (position > 0) changeInformationStep(editSteps[position - 1]); else cancel();
  };
  useBackLayer(editing && scene === 'workspace-info', backFromInformation);
  useEffect(() => {
    window.addEventListener('mobile-portal-info-back', backFromInformation);
    return () => window.removeEventListener('mobile-portal-info-back', backFromInformation);
  });
  const pendingCounts = scene === 'workspace-home' || scene === 'workspace-account' ? {
    0: api.listPricingTasks({ quote: true, handled: false }).length,
    2: api.listPricingTasks({ quote: false, handled: false }).length,
  } : {};
  const beginBank = (entry, index) => { setBank(clone(entry)); setBankIndex(index); };
  return <div className="m-workspace">
    {['workspace-home', 'workspace-account'].includes(scene) && <div className="m-portal-home">
      <section className="m-portal-home-identity" aria-label="当前供应商"><div className="m-portal-identity-heading"><Building2 aria-hidden="true" /><h2>{profile.name}</h2><StatusTag value={pending ? '变更中' : profile.status} /></div><div className="m-portal-identity-details"><Row label="账号">{api.getAccount()?.account || '演示供应商账号'}</Row><Row label="注册邮箱">{profile.email}</Row></div></section>
      {savedProfileDraft && !pending && <button className="m-preview-edit" onClick={() => go('workspace-changes')}>继续提交资料修改</button>}
      {pending && <button className="m-preview-edit" onClick={() => go('workspace-approval')}>查看资料变更审批</button>}
      {homeGroups.map(group => <section className="m-portal-home-group" key={group.title} aria-label={group.title}><h2>{group.title}</h2><div className="m-portal-entry-grid">{group.entries.map(({ label, lines, icon: Icon, color, route, task }) => <button key={label} aria-label={label} onClick={() => { if (task !== undefined) store.portalTaskTab = task; if (route.startsWith('workspace-account-')) { store.portalSecurityReturn = 'workspace-home'; } go(route); }}><span className={'m-portal-entry-icon is-' + color}><Icon aria-hidden="true" />{pendingCounts[task] > 0 && <span className="m-portal-pending-count" aria-label={pendingCounts[task] + '项待处理'}>{pendingCounts[task]}</span>}</span><span className="m-portal-entry-label">{lines.map(line => <span key={line}>{line}</span>)}</span></button>)}</div></section>)}
      <p className="m-portal-travel-note">差旅服务请在电脑端协同门户办理。</p>
    </div>}

    {['workspace-account-email', 'workspace-account-password'].includes(scene) && <AccountSecurityForm api={api} initialStep={mapParams.step === '1' ? 1 : 0} kind={scene.endsWith('email') ? 'email' : 'password'} email={profile.email} onCancel={() => { go(store.portalSecurityReturn || 'workspace-home'); }} onComplete={value => {
      if (scene.endsWith('email')) {
        api.updateEmail(value);
        notify('注册邮箱已更新');
      } else { api.markPasswordChanged(); notify('密码已修改'); }
      go(store.portalSecurityReturn || 'workspace-home');
    }} />}
    {scene === 'workspace-info' && <>
      {editing ? <RegistrationSteps personal={draft.basic.type === supplierTypes[1]} step={tab} expanded={stepsExpanded} onExpandedChange={setStepsExpanded} /> : <Tabs showDirectory={false} stretch variant="pill" items={['基本信息', '联系人信息', '银行信息']} active={tab} onChange={setInfoTab} />}
      <SwipeArea active={editing ? 0 : tab} count={editing ? 1 : 3} onChange={i => editing ? changeInformationStep(editSteps[i]) : setInfoTab(i)}>
      {!editing && <>{tab === 0 && <><Section title="基本信息" collapsible={false}>{fieldsFor(profile.type).map(([key, label]) => <Row key={key} label={label}>{profile.basic[key] || '—'}</Row>)}<Row label="注册邮箱">{profile.email}</Row><CertificateAttachmentRows basic={profile.basic} type={profile.type} onPreview={onPreview} /></Section>{profile.type === supplierTypes[0] && <QualificationInfo records={profile.basic.qualifications} onPreview={onPreview} />}</>}{tab === 1 && <RecordCollection title="联系人信息" count={profile.contacts.length} emptyText="暂无联系人信息">{profile.contacts.map(c => <RecordCard key={c.id} title={c.name}>{[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{c[key] || '—'}</Row>)}</RecordCard>)}</RecordCollection>}{tab === 2 && <RecordCollection title="银行信息" count={profile.banks.length} emptyText="暂无银行信息">{profile.banks.map(b => <BankCard showProof={false} key={b.id} bank={b} />)}</RecordCollection>}<Actions items={[pending ? { label: '查看审批', onClick: () => go('workspace-approval') } : { label: '修改', onClick: () => { setDraft(clone(savedProfileDraft || profile)); setInfoTab(editSteps.includes(tab) ? tab : 0); setStepsExpanded(!editSteps.includes(tab) || tab === 0); setPreviewTab(0); setEditing(true); } }]} /></>}
      {editing && <div className="m-edit-mode">{tab === 0 && <BasicFields initialPanel={mapParams.panel} hideSupplierType data={draft.basic} setData={basic => setDraft({ ...draft, basic })} onAddress={() => setAddress(true)} />}{tab === 1 && <ContactFields initialPanel={mapParams.panel} contacts={draft.contacts} setContacts={contacts => setDraft({ ...draft, contacts })} validation={invalidContact} onValidationHandled={() => setInvalidContact(null)} />}{tab === 2 && <RecordCollection title="银行信息" count={draft.banks.length} emptyText="暂无银行信息" addLabel="添加银行账户" onAdd={() => beginBank(blankBank(profile.name), -1)}>{draft.banks.map((b, i) => <BankCard key={b.id} bank={b} deleteDisabledReason={isOriginalBasicBank(b) ? effectiveBasicBankDeleteError : ''} onPreview={() => onPreview(b.proof)} onEdit={() => beginBank(b, i)} onDelete={isOriginalBasicBank(b) ? undefined : () => setRemoveBank(i)} />)}</RecordCollection>}{tab === 3 && <RegistrationPreview supplierFacing basic={draft.basic} contacts={draft.contacts} banks={draft.banks} active={previewTab} onTabChange={setPreviewTab} onPreview={onPreview}><ChangeComparison before={profile} after={{ ...draft, name: draft.basic.supplierName, type: draft.basic.type, email: draft.basic.registerEmail }} /></RegistrationPreview>}<Actions className="m-registration-actions m-info-edit-actions" items={[{ label: '取消', secondary: true, onClick: cancel }, { label: tab === 3 ? '提交' : '下一步（' + (editSteps.indexOf(tab) + 1) + '/' + editSteps.length + '）', onClick: tab === 3 ? submit : next }]} /></div>}
      </SwipeArea>
    </>}
    {scene === 'workspace-changes' && <>{savedProfileDraft ? <><ChangeComparison before={profile} after={savedProfileDraft} /><Actions items={[{ label: '继续修改', secondary: true, onClick: () => go('workspace-info?edit=1') }, { label: '取消本次修改', secondary: true, onClick: () => { api.discardProfileDraft(); go('workspace-info'); } }, { label: '提交变更', onClick: () => { api.submitProfile(savedProfileDraft); notify('原型演示：资料变更已提交，等待审批'); go('workspace-approval'); } }]} /></> : <><Section title="资料变更" collapsible={false}><Empty text="没有待提交的修改" /></Section></>}</>}
    {scene === 'workspace-approval' && <>{pending ? <><ChangeComparison before={profile} after={pending} /><Section title="办理状态" collapsible={false}><Row label="审批状态">待审批</Row></Section><Approval supplier={profile} populated={false} type="资料变更" number="" /></> : <Section title="当前审批进度" collapsible={false}><Empty text="暂无进行中的资料变更" /></Section>}</>}
    {scene === 'workspace-tasks' && <><Tabs showDirectory={false} stretch items={['待处理', '已处理']} active={taskTab % 2} onChange={i => setTasks((taskTab < 2 ? 0 : 2) + i)} /><SwipeArea active={taskTab % 2} count={2} onChange={i => setTasks((taskTab < 2 ? 0 : 2) + i)}><PortalTaskList initialFilterOpen={mapParams.panel === 'filter'} key={taskTab} tab={taskTab} api={api} store={store} go={go} /></SwipeArea></>}

    {scene === 'workspace-quote-detail' && <PortalPricingDetail mapParams={mapParams} quote api={api} store={store} go={go} notify={notify} onPreview={onPreview} />}
    {scene === 'workspace-travel' && <div className="m-travel-page"><TravelTemplateDownload api={api} notify={notify} /><div className="m-travel-entry-list">{travelEntryDefinitions.map(entry => <TravelBillUploadEntry api={api} key={entry.key} entry={entry} notify={notify} />)}</div></div>}
    {['workspace-tax-detail', 'workspace-tax-split'].includes(scene) && <PortalPricingDetail mapParams={mapParams} api={api} store={store} go={go} notify={notify} onPreview={onPreview} />}
    {address && <AddressForm sheet regions={regionData} initial={draft.basic.address} onCancel={() => setAddress(false)} onConfirm={value => { setDraft({ ...draft, basic: { ...draft.basic, address: value } }); setAddress(false); }} />}
    {bankIndex !== null && <div className="m-fullscreen-panel" role="dialog" aria-modal="true" aria-label="门户银行编辑"><PickerHeading title={bankIndex < 0 ? '新增银行' : '修改银行'} /><BankFields layout="stacked" bank={bank} setBank={setBank} company={profile.type === supplierTypes[0]} /><Actions items={[{ label: '取消', secondary: true, onClick: closeBank }, { label: '保存此账户', onClick: () => { const hasOtherBasicAccount = draft.banks.some((b, i) => i !== bankIndex && b.accountType === '基本账户'); const error = bankFieldError(bank, profile.type === supplierTypes[0], hasOtherBasicAccount); if (error) return focusFormError(error); const entry = { ...bank, id: bankIndex < 0 ? createSessionId() : draft.banks[bankIndex].id }; setDraft({ ...draft, banks: bankIndex < 0 ? [...draft.banks, entry] : draft.banks.map((b, i) => i === bankIndex ? entry : b) }); bankGuard.accept(); setBankIndex(null); } }]} /></div>}
    {removeBank !== null && <Confirm danger text="确认删除此银行账户？" onCancel={() => setRemoveBank(null)} onConfirm={() => { if (isOriginalBasicBank(draft.banks[removeBank])) { setRemoveBank(null); return notify(effectiveBasicBankDeleteError); } setDraft({ ...draft, banks: draft.banks.filter((_, i) => i !== removeBank) }); setRemoveBank(null); }} />}
    {logout && <Confirm title="退出登录？" confirmLabel="退出登录" text={savedProfileDraft ? '还有尚未提交的资料修改，退出将放弃这些修改。确认退出？' : '确认退出协同门户？'} onCancel={() => setLogout(false)} onConfirm={() => { api.logout(); notify('已退出登录'); go('portal'); }} />}
    {accountMenu && <Overlay sheet label="账户设置" onClose={() => setAccountMenu(false)}><div className="m-portal-account-panel"><div className="m-picker-title"><strong>账户设置</strong><button type="button" aria-label="关闭账户设置" onClick={() => setAccountMenu(false)}><X /></button></div><div className="m-account-panel-menu">{[[KeyRound, '修改密码', 'workspace-account-password'], [Mail, '修改注册邮箱', 'workspace-account-email']].map(([Icon, label, route]) => <button type="button" key={route} onClick={() => { store.portalSecurityReturn = 'workspace-home'; setAccountMenu(false); go(route); }}><Icon aria-hidden="true" /><span>{label}</span><ChevronRight aria-hidden="true" /></button>)}</div><div className="m-account-panel-logout"><button type="button" onClick={() => { setAccountMenu(false); setLogout(true); }}><LogOut aria-hidden="true" />退出登录</button></div></div></Overlay>}
  </div>;
}





