import { readMobileSearch } from './mobile-prototype-runtime.js';
import { usePanelState } from './mobile-motion.jsx';
import { AddressForm, Actions, PickerHeading, RecordCard, RecordCollection, Confirm, Empty, Overlay, Row, Section, Tabs } from '../components/mobile/index.js';
import { regionData } from './registration-regions.js';
import React, { useEffect, useRef, useState } from 'react';
import { Building2, Store, FolderClock, FolderCheck, ReceiptText, Receipt, PlaneTakeoff, Plane, Train, Hotel, Car, Upload, Download, LoaderCircle, Plus, Mail, MailCheck, KeyRound, LockKeyhole, ChevronRight, X, LogOut } from 'lucide-react';
import { RegistrationSteps, StatusTag, Field, SearchBox } from './mobile-ui.jsx';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { BankCard, BankFields, BasicFields, ContactFields, bankError, fieldsFor, filledBasic, blankBank } from './mobile-forms.jsx';
import { exampleBank as sampleBank, supplierTypes } from './mobile-data.js';
import { Approval } from './mobile-views.jsx';
import { CertificateAttachmentRows } from './mobile-registration-preview.jsx';
import { createSessionId, SwipeArea, useBackLayer, useDirtyForm } from './mobile-interaction.jsx';
import { informationSteps, registrationEmailError, bankAccountsError, isEffectiveBasicBankAccount, effectiveBasicBankDeleteError, personalCertificatePhotoError } from './mobile-edit-rules.js';
import { RegistrationPreview } from './mobile-registration-preview.jsx';
import { ChangeComparison } from './mobile-changes.jsx';
import { AccountSecurityForm } from './mobile-account.jsx';
import { PortalTaskList } from './mobile-portal-tasks.jsx';
import { PortalPricingDetail } from './mobile-portal-pricing.jsx';
import { portalPricingRecords } from './mobile-portal-records.js';
import { findDemoProcurementTask, readProcurementNotice } from './mobile-portal-procurement.js';

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
  { title: '差旅服务', entries: [{ label: '差旅账单录入', lines: ['差旅账单', '录入'], icon: PlaneTakeoff, color: 'blue', route: 'workspace-travel' }] },
];
const travelEntryDefinitions = [
  { key: 'train', label: '火车账单', Icon: Train },
  { key: 'hotel', label: '酒店账单', Icon: Hotel },
  { key: 'flight', label: '飞机账单', Icon: Plane },
  { key: 'rental', label: '租车账单', Icon: Car },
];
async function forwardTravelBill(type, files) {
  const adapter = window.__PORTAL_TRAVEL_UPLOAD__;
  // 演示原型默认完成本地上传交互；接入宿主服务后按真实回执反馈。
  if (typeof adapter !== 'function') return { success: true, demo: true };
  const result = await adapter({ type, files, timeoutMs: 180000 });
  if (result === false || result?.success === false) throw new Error(result?.message || '差旅系统未确认上传成功');
  return result;
}

function TravelBillUploadEntry({ entry, notify }) {
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
      await forwardTravelBill(entry.key, selected);
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

function TravelTemplateDownload({ notify }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const adapter = window.__PORTAL_TRAVEL_TEMPLATE__;
      if (typeof adapter !== 'function') throw new Error('模板暂不可用，请联系管理员');
      const file = await adapter();
      if (!(file?.blob instanceof Blob) || !file.blob.size || !file.name) throw new Error('模板文件获取失败，请重试');
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

function initialProfile() {
  const basic = { ...clone(filledBasic), supplierName: '协同门户演示供应商', registerEmail: 'supplier@example.com', address: '北京市/北京市/朝阳区 演示地址', businessScope: '技术与电子产品服务', cooperation: '平台技术服务', businessAdvantage: '技术服务与项目交付经验' };
  return { name: basic.supplierName, type: basic.type, email: basic.registerEmail, basic, status: '已审批', contacts: [{ id: 'portal-contact', name: '演示联系人', phone: '13800000000', email: 'supplier@example.com', department: '', job: '', wechat: '', note: '' }], banks: [{ ...clone(sampleBank), name: basic.supplierName }] };
}
function PortalProcurementNotice({ go, notify, store, onPreview }) {
  const notice = readProcurementNotice(readMobileSearch());
  const account = store.portalAccount;
  const loginRoute = notice && !account ? 'portal?' + new URLSearchParams(notice) : '';
  useEffect(() => {
    if (!loginRoute) return;
    const next = setTimeout(() => go(loginRoute), 0);
    return () => clearTimeout(next);
  }, [go, loginRoute]);

  if (loginRoute) return <Empty text="请先登录供应商协同门户" />;
  const quote = notice?.task === 'quote';
  const pricing = portalPricingRecords(store);
  const records = quote ? pricing.inquiries : pricing.orders;
  const record = findDemoProcurementTask(notice, account, records);
  if (!record) return <>
    <Empty text="找不到该采购任务，或当前账号无权查看" />
    <Actions items={[{ label: account ? '返回工作台' : '返回登录', onClick: () => go(account ? 'workspace-home' : 'portal') }]} />
  </>;

  store.portalTaskTab = (quote ? 0 : 2) + Number(record.status === '已处理');
  return <PortalPricingDetail quote={quote} records={records} store={store} go={go} notify={notify} onPreview={onPreview} />;
}

export function PortalWorkspace(props) {
  return props.scene === 'workspace-procurement'
    ? <div className="m-workspace"><PortalProcurementNotice {...props} /></div>
    : <PortalWorkspaceContent {...props} />;
}

function PortalWorkspaceContent({ scene, go, notify, store, onPreview, accountMenu, setAccountMenu, mapParams = {} }) {
  const { inquiries, orders } = portalPricingRecords(store);
  const [profile] = useState(() => store.portalProfile ||= initialProfile());
  const [draft, setDraft] = useState(() => clone(store.portalDraft || profile));
  const [editing, setEditing] = useState(scene === 'workspace-info' && new URLSearchParams(readMobileSearch()).get('edit') === '1');
  const [tab, setTab] = useState(/^[0-3]$/.test(mapParams.step ?? mapParams.tab) ? Number(mapParams.step ?? mapParams.tab) : Math.min(store.portalInfoTab || 0, 2));
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const editSteps = informationSteps(draft.basic.type === supplierTypes[1]);
  const [taskTab, setTaskTab] = useState(/^[0-3]$/.test(mapParams.tab) ? Number(mapParams.tab) : store.portalTaskTab ?? 2);
  const [address, setAddress] = usePanelState(editing && mapParams.panel === 'address');
  const [bankIndex, setBankIndex] = usePanelState(mapParams.panel === 'bank' ? -1 : null);
  const [bank, setBank] = useState(() => mapParams.panel === 'bank' ? blankBank(profile.name) : null);
  const [removeBank, setRemoveBank] = useState(null);
  const isOriginalBasicBank = bank => isEffectiveBasicBankAccount(bank, profile.banks, profile.type === supplierTypes[0]);
  const [logout, setLogout] = useState(mapParams.panel === 'logout');
  const guard = useDirtyForm(draft, editing);
  const bankGuard = useDirtyForm(bank, bankIndex !== null);
  const closeBank = () => bankGuard.leave(() => setBankIndex(null));
  useBackLayer(bankIndex !== null, closeBank);
  const pending = store.portalPending || (scene === 'workspace-approval' && mapParams.map
    ? { ...profile, basic: { ...profile.basic, businessScope: '技术服务与项目交付' } }
    : null);
  const setInfoTab = i => { store.portalInfoTab = i; setTab(i); };
  const setTasks = i => { store.portalTaskTab = i; setTaskTab(i); };
  const cancel = () => guard.leave(() => {
    store.portalDraft = null; setDraft(clone(profile)); setEditing(false); setInfoTab(0);
  });
  const validateStep = index => {
    if (index === 0) {
      for (const [key, label, required] of fieldsFor(draft.basic.type)) if (required && !draft.basic[key]?.trim()) return '请填写' + label;
      if (registrationEmailError(draft.basic.registerEmail)) return registrationEmailError(draft.basic.registerEmail);
      if (draft.basic.companyPhone && !/^(1\d{10}|\d{3,4}-?\d{8})$/.test(draft.basic.companyPhone)) return '公司电话须为11位手机号或区号加8位号码';
      if (draft.basic.capital && !/^\d+$/.test(draft.basic.capital)) return '注册资金只支持整数';
      if ([supplierTypes[0], supplierTypes[3]].includes(draft.basic.type) && !draft.basic.proof) return '请上传证照附件';
      if (draft.basic.type === supplierTypes[1]) {
        const error = personalCertificatePhotoError(draft.basic);
        if (error) return error;
      }
    }
    if (index === 1 && draft.contacts.some(contact => !contact.name?.trim() || !contact.phone?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email || ''))) return '请填写联系人的姓名、电话和正确邮箱';
    if (index === 2) {
      if (!draft.banks.length) return '请添加银行信息';
      for (const entry of draft.banks) { const error = bankError(entry, draft.basic.type === supplierTypes[0]); if (error) return error; }
      return bankAccountsError(draft.banks, draft.basic.type === supplierTypes[0], profile.banks);
    }
    return '';
  };
  const showPreview = () => {
    for (const index of editSteps.slice(0, -1)) {
      const error = validateStep(index);
      if (error) { setInfoTab(index); notify(error); return; }
    }
    setInfoTab(3);
  };
  const changeInformationStep = index => {
    if (index === 3) { showPreview(); return; }
    setStepsExpanded(index === 0); setInfoTab(index);
  };
  const next = () => {
    const error = validateStep(tab); if (error) return notify(error);
    changeInformationStep(editSteps[editSteps.indexOf(tab) + 1]);
  };
  const submit = () => {
    for (const index of editSteps.slice(0, -1)) {
      const error = validateStep(index); if (error) { setInfoTab(index); return notify(error); }
    }
    const next = { ...draft, name: draft.basic.supplierName, type: draft.basic.type, email: draft.basic.registerEmail.trim(), basic: { ...draft.basic, registerEmail: draft.basic.registerEmail.trim() } };
    if (JSON.stringify(next) === JSON.stringify(profile)) return notify('请先修改信息');
    store.portalPending = clone(next); store.portalDraft = null;
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
  const pendingCount = task => task === 0 ? inquiries.filter(record => record.status === '待处理').length : task === 2 ? orders.filter(record => record.status === '待处理').length : 0;
  const beginBank = (entry, index) => { setBank(clone(entry)); setBankIndex(index); };
  return <div className="m-workspace">
    {['workspace-home', 'workspace-account'].includes(scene) && <div className="m-portal-home">
      <section className="m-portal-home-identity" aria-label="当前供应商"><div className="m-portal-identity-heading"><Building2 aria-hidden="true" /><h2>{profile.name}</h2><StatusTag value={pending ? '变更中' : profile.status} /></div><dl className="m-portal-identity-details"><div><dt>账号</dt><dd>{store.portalAccount?.account || '演示供应商账号'}</dd></div><div><dt>注册邮箱</dt><dd>{profile.email}</dd></div></dl></section>
      {store.portalDraft && !pending && <button className="m-preview-edit" onClick={() => go('workspace-changes')}>继续提交资料修改</button>}
      {pending && <button className="m-preview-edit" onClick={() => go('workspace-approval')}>查看资料变更审批</button>}
      {homeGroups.map(group => <section className="m-portal-home-group" key={group.title} aria-label={group.title}><h2>{group.title}</h2><div className="m-portal-entry-grid">{group.entries.map(({ label, lines, icon: Icon, color, route, task }) => <button key={label} aria-label={label} onClick={() => { if (task !== undefined) store.portalTaskTab = task; if (route.startsWith('workspace-account-')) { store.portalSecurityReturn = 'workspace-home'; } go(route); }}><span className={'m-portal-entry-icon is-' + color}><Icon aria-hidden="true" />{pendingCount(task) > 0 && <span className="m-portal-pending-count" aria-label={pendingCount(task) + '项待处理'}>{pendingCount(task)}</span>}</span><span className="m-portal-entry-label">{lines.map(line => <span key={line}>{line}</span>)}</span></button>)}</div></section>)}
    </div>}

    {['workspace-account-email', 'workspace-account-password'].includes(scene) && <AccountSecurityForm initialStep={mapParams.step === '1' ? 1 : 0} kind={scene.endsWith('email') ? 'email' : 'password'} email={profile.email} onCancel={() => { go(store.portalSecurityReturn || 'workspace-home'); }} onComplete={value => {
      if (scene.endsWith('email')) {
        const sync = record => record ? { ...record, email: value, basic: { ...record.basic, registerEmail: value } } : record;
        store.portalProfile = sync(profile); store.portalDraft = sync(store.portalDraft); store.portalPending = sync(store.portalPending);
        if (store.portalAccount) store.portalAccount = { ...store.portalAccount, email: value };
        notify('注册邮箱已更新');
      } else { store.portalPasswordChangedAt = new Date().toISOString(); notify('密码已修改'); }
      go(store.portalSecurityReturn || 'workspace-home');
    }} />}
    {scene === 'workspace-info' && <>
      {editing ? <RegistrationSteps personal={draft.basic.type === supplierTypes[1]} step={tab} expanded={stepsExpanded} onExpandedChange={setStepsExpanded} /> : <Tabs showDirectory={false} stretch variant="pill" items={['基本信息', '联系人信息', '银行信息']} active={tab} onChange={setInfoTab} />}
      <SwipeArea active={editing ? 0 : tab} count={editing ? 1 : 3} onChange={i => editing ? changeInformationStep(editSteps[i]) : setInfoTab(i)}>
      {!editing && <>{tab === 0 && <><Section title="基本信息" collapsible={false}>{fieldsFor(profile.type).map(([key, label]) => <Row key={key} label={label}>{profile.basic[key] || '—'}</Row>)}<Row label="注册邮箱">{profile.email}</Row><CertificateAttachmentRows basic={profile.basic} type={profile.type} onPreview={onPreview} /></Section>{profile.type === supplierTypes[0] && <QualificationInfo records={profile.basic.qualifications} onPreview={onPreview} />}</>}{tab === 1 && <RecordCollection title="联系人信息" count={profile.contacts.length} emptyText="暂无联系人信息">{profile.contacts.map(c => <RecordCard key={c.id} title={c.name}>{[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{c[key] || '—'}</Row>)}</RecordCard>)}</RecordCollection>}{tab === 2 && <RecordCollection title="银行信息" count={profile.banks.length} emptyText="暂无银行信息">{profile.banks.map(b => <BankCard fileProof key={b.id} bank={b} onPreview={() => onPreview(b.proof)} />)}</RecordCollection>}<Actions items={[pending ? { label: '查看审批', onClick: () => go('workspace-approval') } : { label: '修改', onClick: () => { setDraft(clone(store.portalDraft || profile)); setInfoTab(editSteps.includes(tab) ? tab : 0); setStepsExpanded(!editSteps.includes(tab) || tab === 0); setPreviewTab(0); setEditing(true); } }]} /></>}
      {editing && <div className="m-edit-mode">{tab === 0 && <BasicFields initialPanel={mapParams.panel} hideSupplierType data={draft.basic} setData={basic => setDraft({ ...draft, basic })} onAddress={() => setAddress(true)} />}{tab === 1 && <ContactFields initialPanel={mapParams.panel} contacts={draft.contacts} setContacts={contacts => setDraft({ ...draft, contacts })} />}{tab === 2 && <RecordCollection title="银行信息" count={draft.banks.length} emptyText="暂无银行信息" addLabel="添加银行账户" onAdd={() => beginBank(blankBank(profile.name), -1)}>{draft.banks.map((b, i) => <BankCard fileProof key={b.id} bank={b} deleteDisabledReason={isOriginalBasicBank(b) ? effectiveBasicBankDeleteError : ''} onPreview={() => onPreview(b.proof)} onEdit={() => beginBank(b, i)} onDelete={isOriginalBasicBank(b) ? undefined : () => setRemoveBank(i)} />)}</RecordCollection>}{tab === 3 && <RegistrationPreview supplierFacing basic={draft.basic} contacts={draft.contacts} banks={draft.banks} active={previewTab} onTabChange={setPreviewTab} onPreview={onPreview}><ChangeComparison before={profile} after={{ ...draft, name: draft.basic.supplierName, type: draft.basic.type, email: draft.basic.registerEmail }} /></RegistrationPreview>}<Actions className="m-registration-actions m-info-edit-actions" items={[{ label: '取消', secondary: true, onClick: cancel }, { label: tab === 3 ? '提交' : '下一步（' + (editSteps.indexOf(tab) + 1) + '/' + editSteps.length + '）', onClick: tab === 3 ? submit : next }]} /></div>}
      </SwipeArea>
    </>}
    {scene === 'workspace-changes' && <>{store.portalDraft ? <><ChangeComparison before={profile} after={store.portalDraft} /><Actions items={[{ label: '继续修改', secondary: true, onClick: () => go('workspace-info?edit=1') }, { label: '取消本次修改', secondary: true, onClick: () => { store.portalDraft = null; go('workspace-info'); } }, { label: '提交变更', onClick: () => { store.portalPending = clone(store.portalDraft); store.portalDraft = null; notify('原型演示：资料变更已提交，等待审批'); go('workspace-approval'); } }]} /></> : <><Section title="资料变更" collapsible={false}><Empty text="没有待提交的修改" /></Section></>}</>}
    {scene === 'workspace-approval' && <>{pending ? <><ChangeComparison before={profile} after={pending} /><Section title="办理状态" collapsible={false}><Row label="审批状态">待审批</Row></Section><Approval supplier={profile} populated={false} type="资料变更" number="" /></> : <Section title="当前审批进度" collapsible={false}><Empty text="暂无进行中的资料变更" /></Section>}</>}
    {scene === 'workspace-tasks' && <><Tabs showDirectory={false} stretch items={['待处理', '已处理']} active={taskTab % 2} onChange={i => setTasks((taskTab < 2 ? 0 : 2) + i)} /><SwipeArea active={taskTab % 2} count={2} onChange={i => setTasks((taskTab < 2 ? 0 : 2) + i)}><PortalTaskList initialFilterOpen={mapParams.panel === 'filter'} key={taskTab} tab={taskTab} inquiries={inquiries} orders={orders} store={store} go={go} /></SwipeArea></>}

    {scene === 'workspace-quote-detail' && <PortalPricingDetail mapParams={mapParams} quote records={inquiries} store={store} go={go} notify={notify} onPreview={onPreview} />}
    {scene === 'workspace-travel' && <div className="m-travel-page"><TravelTemplateDownload notify={notify} /><div className="m-travel-entry-list">{travelEntryDefinitions.map(entry => <TravelBillUploadEntry key={entry.key} entry={entry} notify={notify} />)}</div></div>}
    {['workspace-tax-detail', 'workspace-tax-split'].includes(scene) && <PortalPricingDetail mapParams={mapParams} records={orders} store={store} go={go} notify={notify} onPreview={onPreview} />}
    {address && <AddressForm sheet regions={regionData} initial={draft.basic.address} onCancel={() => setAddress(false)} onConfirm={value => { setDraft({ ...draft, basic: { ...draft.basic, address: value } }); setAddress(false); }} />}
    {bankIndex !== null && <div className="m-fullscreen-panel" role="dialog" aria-modal="true" aria-label="门户银行编辑"><PickerHeading title={bankIndex < 0 ? '新增银行' : '修改银行'} /><BankFields layout="stacked" bank={bank} setBank={setBank} company={profile.type === supplierTypes[0]} /><Actions items={[{ label: '取消', secondary: true, onClick: closeBank }, { label: '保存此账户', onClick: () => { const error = bankError(bank, profile.type === supplierTypes[0]); if (error) return notify(error); if (draft.banks.some((b, i) => i !== bankIndex && b.accountType === '基本账户' && bank.accountType === '基本账户')) return notify('基本账户只能有一个'); const entry = { ...bank, id: bankIndex < 0 ? createSessionId() : draft.banks[bankIndex].id }; setDraft({ ...draft, banks: bankIndex < 0 ? [...draft.banks, entry] : draft.banks.map((b, i) => i === bankIndex ? entry : b) }); bankGuard.accept(); setBankIndex(null); } }]} /></div>}
    {removeBank !== null && <Confirm danger text="确认删除此银行账户？" onCancel={() => setRemoveBank(null)} onConfirm={() => { if (isOriginalBasicBank(draft.banks[removeBank])) { setRemoveBank(null); return notify(effectiveBasicBankDeleteError); } setDraft({ ...draft, banks: draft.banks.filter((_, i) => i !== removeBank) }); setRemoveBank(null); }} />}
    {logout && <Confirm title="退出登录？" confirmLabel="退出登录" text={store.portalDraft ? '还有尚未提交的资料修改，退出将放弃这些修改。确认退出？' : '确认退出协同门户？'} onCancel={() => setLogout(false)} onConfirm={() => { store.portalDraft = null; store.portalAccount = null; notify('已退出登录'); go('portal'); }} />}
    {accountMenu && <Overlay sheet label="账户设置" onClose={() => setAccountMenu(false)}><div className="m-portal-account-panel"><div className="m-picker-title"><strong>账户设置</strong><button type="button" aria-label="关闭账户设置" onClick={() => setAccountMenu(false)}><X /></button></div><div className="m-account-panel-menu">{[[KeyRound, '修改密码', 'workspace-account-password'], [Mail, '修改注册邮箱', 'workspace-account-email']].map(([Icon, label, route]) => <button type="button" key={route} onClick={() => { store.portalSecurityReturn = 'workspace-home'; setAccountMenu(false); go(route); }}><Icon aria-hidden="true" /><span>{label}</span><ChevronRight aria-hidden="true" /></button>)}</div><div className="m-account-panel-logout"><button type="button" onClick={() => { setAccountMenu(false); setLogout(true); }}><LogOut aria-hidden="true" />退出登录</button></div></div></Overlay>}
  </div>;
}





