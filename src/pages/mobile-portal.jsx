import React, { useState } from 'react';
import { Home, ClipboardList, UserRound, ChevronRight, Plus } from 'lucide-react';
import { Actions, Confirm, Empty, StatusTag, Field, Overlay, Row, Section, SearchBox, UploadField } from './mobile-ui.jsx';
import { AddressForm, BankCard, BankFields, BasicFields, ContactFields, bankError, fieldsFor, filledBasic, blankBank } from './mobile-forms.jsx';
import { exampleBank as sampleBank, supplierTypes } from './mobile-data.js';
import { Tabs, Approval } from './mobile-views.jsx';
import { SwipeArea, useBackLayer, useDirtyForm, attachmentName } from './mobile-interaction.jsx';
import { ChangeComparison } from './mobile-changes.jsx';

const clone = value => structuredClone(value);
const taskTabs = ['报价管理待处理', '报价管理已处理', '价税拆分待处理', '价税拆分已处理'];
const taxFields = [['material', '物料编码'], ['name', '物料名称'], ['category', '物料类别'], ['quantity', '数量'], ['grossUnit', '含税单价'], ['netUnit', '不含税单价'], ['rate', '税率(%)'], ['tax', '税额'], ['net', '不含税金额'], ['gross', '含税金额']];
// 文档样本只用于阅读流程；金额填写及提交等待用户提供现行PC校验与计算规则。
const order = { number: 'DEMO-ORDER-001', material: 'DEMO-MATERIAL-001', name: 'Dell.R740', category: '电子产品', quantity: '2', grossUnit: '38682', netUnit: '', rate: '', tax: '', net: '', gross: '77364' };
// 会话询价样本，字段取自询价DTO；不推断报价计算与提交规则。
const inquiries = [
  { number: 'MOCK-INQ-001', title: '技术服务询价', unit: '演示采购公司', buyer: '采购员甲', type: '技术服务', start: '2026-11-01', end: '2026-11-20', status: '待处理', material: '平台运维服务', quantity: '1', measure: '项', config: '按询价说明提供服务方案', remark: '请核对服务范围与交付要求' },
  { number: 'MOCK-INQ-002', title: '办公设备询价', unit: '演示采购公司', buyer: '采购员乙', type: '电子产品', start: '2026-10-01', end: '2026-10-20', status: '已处理', material: '办公显示器', quantity: '10', measure: '台', config: '27英寸', remark: '报价已处理样例' },
];
function PortalQuotes({ handled, go }) {
  const [query, setQuery] = useState('');
  const records = inquiries.filter(x => (x.status === '已处理') === handled && [x.number, x.title, x.buyer].some(v => v.includes(query.trim())));
  return <><SearchBox value={query} onChange={setQuery} placeholder="搜索询价单号、名称或采购员" />{records.length ? records.map(x => <Section key={x.number} collapsible={false} title={x.title}><div className="m-record-heading"><h3>{x.number}</h3><StatusTag value={x.status} /></div>{[['询价单位', x.unit], ['采购类型', x.type], ['采购员', x.buyer], ['开始日期', x.start], ['结束日期', x.end]].map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}<div className="m-record-actions"><button onClick={() => go('workspace-quote-detail?record=' + x.number)}>查看询价详情</button></div></Section>) : <Empty search text="暂无匹配的询价单" />}</>;
}
function initialProfile() {
  const basic = { ...clone(filledBasic), supplierName: '协同门户演示供应商', registerEmail: 'supplier@example.com', address: '北京市/北京市/朝阳区 演示地址', businessScope: '技术与电子产品服务' };
  return { name: basic.supplierName, type: basic.type, email: basic.registerEmail, basic, status: '已审批', contacts: [{ id: 'portal-contact', name: '演示联系人', phone: '13800000000', email: 'supplier@example.com', department: '', job: '', wechat: '', note: '' }], banks: [{ ...clone(sampleBank), name: basic.supplierName }] };
}
export function PortalWorkspace({ scene, go, notify, store, onPreview }) {
  const [profile] = useState(() => store.portalProfile ||= initialProfile());
  const [draft, setDraft] = useState(() => clone(store.portalDraft || profile));
  const [editing, setEditing] = useState(scene === 'workspace-info' && window.location.hash.endsWith('?edit=1'));
  const [tab, setTab] = useState(store.portalInfoTab || 0);
  const [taskTab, setTaskTab] = useState(store.portalTaskTab ?? 2);
  const [address, setAddress] = useState(false);
  const [bankIndex, setBankIndex] = useState(null);
  const [bank, setBank] = useState(null);
  const [removeBank, setRemoveBank] = useState(null);
  const [logout, setLogout] = useState(false);
  const [bill, setBill] = useState(store.portalBillDraft || { period: '', attachment: '' });
  const billGuard = useDirtyForm(bill, scene === 'workspace-travel');
  const guard = useDirtyForm(draft, editing);
  const bankGuard = useDirtyForm(bank, bankIndex !== null);
  const closeBank = () => bankGuard.leave(() => setBankIndex(null));
  useBackLayer(bankIndex !== null, closeBank);
  const pending = store.portalPending;
  const current = scene === 'workspace-account' ? 2 : scene.startsWith('workspace-task') || scene.startsWith('workspace-tax') || scene.startsWith('workspace-quote') || scene === 'workspace-travel' ? 1 : 0;
  const setInfoTab = i => { store.portalInfoTab = i; setTab(i); };
  const setTasks = i => { store.portalTaskTab = i; setTaskTab(i); };
  const cancel = () => guard.leave(() => { setDraft(clone(store.portalDraft || profile)); setEditing(false); });
  const save = () => {
    if (tab === 0) {
      for (const [key, label, required] of fieldsFor(draft.basic.type)) if (required && !draft.basic[key]?.trim()) return notify('请填写' + label);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.basic.registerEmail || '')) return notify('请输入正确的供应商注册邮箱');
      if (draft.basic.companyPhone && !/^(1\d{10}|\d{3,4}-?\d{8})$/.test(draft.basic.companyPhone)) return notify('公司电话须为11位手机号或区号加8位号码');
      if (draft.basic.capital && !/^\d+$/.test(draft.basic.capital)) return notify('注册资金只支持整数');
      if ([supplierTypes[0], supplierTypes[3]].includes(draft.basic.type) && !draft.basic.proof) return notify('请上传证照附件');
    }
    if (tab === 2) {
      if (!draft.banks.length) return notify('请添加银行信息');
      for (const entry of draft.banks) { const error = bankError(entry, draft.type === supplierTypes[0]); if (error) return notify(error); }
      if (draft.type === supplierTypes[0] && draft.banks.filter(b => b.accountType === '基本账户').length !== 1) return notify('企业供应商必须有且只有一个基本账户');
    }
    const next = { ...draft, name: draft.basic.supplierName, type: draft.basic.type, email: draft.basic.registerEmail };
    if (JSON.stringify(next) === JSON.stringify(profile)) return notify('请先修改信息');
    store.portalDraft = next; guard.accept(); go('workspace-changes');
  };
  const beginBank = (entry, index) => { setBank(clone(entry)); setBankIndex(index); };
  return <div className="m-workspace">
    {scene === 'workspace-home' && <><Section title="首页" collapsible={false}><div className="m-record-heading"><h2 className="m-portal-supplier">{profile.name}</h2><StatusTag value={pending ? '变更中' : profile.status} /></div></Section><div className="m-workspace-menu">{[['供应商信息管理', 'workspace-info'], ['报价与价税拆分', 'workspace-tasks'], ['差旅账单', 'workspace-travel'], ['账户信息', 'workspace-account']].map(([label, route]) => <button key={route} onClick={() => go(route)}>{label}<ChevronRight aria-hidden="true" /></button>)}</div><div className="m-portal-task-grid">{[['待处理报价', inquiries.filter(x => x.status === '待处理').length, 0], ['待处理价税拆分', 1, 2]].map(([label, count, index]) => <button key={label} onClick={() => { store.portalTaskTab = index; go('workspace-tasks'); }}><strong>{count}</strong><span>{label}</span></button>)}</div>{store.portalDraft && !pending && <button className="m-preview-edit" onClick={() => go('workspace-changes')}>继续提交资料修改</button>}{pending && <button className="m-preview-edit" onClick={() => go('workspace-approval')}>查看资料变更审批</button>}</>}
    {scene === 'workspace-account' && <><Section title="账户信息" collapsible={false}><Row label="登录账号">{store.portalAccount?.account || '演示供应商账号'}</Row><Row label="供应商名称">{profile.name}</Row><Row label="注册邮箱">{profile.email}</Row></Section><div className="m-record-actions"><button onClick={() => setLogout(true)}>退出登录</button></div></>}
    {scene === 'workspace-info' && <>
      <Tabs variant="pill" items={['基本信息', '联系人信息', '银行信息']} active={tab} onChange={i => guard.leave(() => { setEditing(false); setDraft(clone(store.portalDraft || profile)); setInfoTab(i); })} />
      <SwipeArea active={tab} count={3} onChange={i => guard.leave(() => { setEditing(false); setDraft(clone(store.portalDraft || profile)); setInfoTab(i); })}>
      {!editing && <>{tab === 0 && <Section title="基本信息" collapsible={false}>{fieldsFor(profile.type).map(([key, label]) => <Row key={key} label={label}>{profile.basic[key] || '—'}</Row>)}<Row label="注册邮箱">{profile.email}</Row><Row label="证照附件">{profile.basic.proof ? <button onClick={() => onPreview(profile.basic.proof)}>{attachmentName(profile.basic.proof)}</button> : '—'}</Row></Section>}{tab === 1 && <Section title="联系人信息" collapsible={false}>{profile.contacts.map(c => <article className="m-contact-summary" key={c.id}><h3>{c.name}</h3>{[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{c[key] || '—'}</Row>)}</article>)}</Section>}{tab === 2 && profile.banks.map(b => <BankCard key={b.id} bank={b} deleteDisabledReason={draft.type === supplierTypes[0] && b.accountType === '基本账户' ? '企业供应商的基本账户不可删除' : ''} onPreview={() => onPreview(b.proof)} />)}<Actions items={[{ label: '返回首页', secondary: true, onClick: () => go('workspace-home') }, pending ? { label: '查看审批', onClick: () => go('workspace-approval') } : { label: '修改', onClick: () => { setDraft(clone(store.portalDraft || profile)); setEditing(true); } }]} /></>}
      {editing && <div className="m-edit-mode"><p className="m-input-note" role="status">正在修改{['基本信息', '联系人信息', '银行信息'][tab]}</p>{tab === 0 && <BasicFields data={draft.basic} setData={basic => setDraft({ ...draft, basic })} onAddress={() => setAddress(true)} />}{tab === 1 && <ContactFields contacts={draft.contacts} setContacts={contacts => setDraft({ ...draft, contacts })} />}{tab === 2 && <>{draft.banks.map((b, i) => <BankCard key={b.id} bank={b} deleteDisabledReason={draft.type === supplierTypes[0] && b.accountType === '基本账户' ? '企业供应商的基本账户不可删除' : ''} onPreview={() => onPreview(b.proof)} onEdit={() => beginBank(b, i)} onDelete={draft.type === supplierTypes[0] && b.accountType === '基本账户' ? undefined : () => setRemoveBank(i)} />)}<button aria-label="添加银行" title="添加银行" className="m-dashed-add m-add-icon" onClick={() => beginBank(blankBank(profile.name), -1)}><Plus aria-hidden="true" /></button></>}<Actions items={[{ label: '取消修改', secondary: true, onClick: cancel }, { label: '保存修改', onClick: save }]} /></div>}
      </SwipeArea>
    </>}
    {scene === 'workspace-changes' && <>{store.portalDraft ? <><ChangeComparison before={profile} after={store.portalDraft} /><Actions items={[{ label: '继续修改', secondary: true, onClick: () => go('workspace-info?edit=1') }, { label: '取消本次修改', secondary: true, onClick: () => { store.portalDraft = null; go('workspace-info'); } }, { label: '提交变更', onClick: () => { store.portalPending = clone(store.portalDraft); store.portalDraft = null; notify('原型演示：资料变更已提交，等待审批'); go('workspace-approval'); } }]} /></> : <><Empty text="没有待提交的修改" /><Actions items={[{ label: '返回供应商信息', onClick: () => go('workspace-info') }]} /></>}</>}
    {scene === 'workspace-approval' && <>{pending ? <><ChangeComparison before={profile} after={pending} /><Row label="审批状态">待审批</Row><Approval supplier={profile} populated={false} type="资料变更" number="" /></> : <Empty text="暂无进行中的资料变更" />}<Actions items={[{ label: '返回供应商信息', onClick: () => go('workspace-info') }]} /></>}
    {scene === 'workspace-tasks' && <><Tabs variant="pill" items={taskTabs} active={taskTab} onChange={setTasks} /><SwipeArea active={taskTab} count={4} onChange={setTasks}>{taskTab === 2 ? <Section title="价税拆分待处理" collapsible={false}><Row label="订单号">{order.number}</Row><Row label="物料名称">{order.name}</Row><Row label="含税金额">{order.gross}</Row><div className="m-record-actions"><button onClick={() => go('workspace-tax-detail')}>查看订单明细</button><button onClick={() => go('workspace-tax-split')}>价税拆分</button></div></Section> : taskTab < 2 ? <PortalQuotes handled={taskTab === 1} go={go} /> : <Empty text="暂无已处理的价税拆分记录" />}</SwipeArea></>}
    {scene === 'workspace-quote-detail' && (() => { const item = inquiries.find(x => x.number === new URLSearchParams(window.location.hash.split('?')[1]).get('record')); return item ? <><Section title={item.title} collapsible={false}>{[['询价单号', item.number], ['询价状态', item.status], ['询价单位', item.unit], ['采购类型', item.type], ['采购员', item.buyer], ['开始日期', item.start], ['结束日期', item.end], ['说明', item.remark]].map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}</Section><Section title="询价明细" collapsible={false}>{[['物料名称', item.material], ['物料类别', item.type], ['数量', item.quantity], ['单位', item.measure], ['配置', item.config], ['税率', '—'], ['含税单价', '—'], ['说明', item.remark]].map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}<Row label="附件">—</Row></Section><Actions items={[{ label: '返回报价列表', onClick: () => go('workspace-tasks') }]} /></> : <><Empty text="未找到询价单" /><Actions items={[{ label: '返回业务任务', onClick: () => go('workspace-tasks') }]} /></>; })()}
    {scene === 'workspace-travel' && <><Section title="差旅账单" collapsible={false}><Field label="账期" placeholder="例如2026-11" value={bill.period} onChange={period => setBill({ ...bill, period })} /><UploadField label="账单文件" value={bill.attachment} onChange={attachment => setBill({ ...bill, attachment })} /></Section><Actions items={[{ label: '返回业务任务', secondary: true, onClick: () => go('workspace-tasks') }, { label: '保存草稿', onClick: () => { store.portalBillDraft = { ...bill }; billGuard.accept(); notify('账单草稿已保存'); } }]} /></>}
    {['workspace-tax-detail', 'workspace-tax-split'].includes(scene) && <><Section title={scene === 'workspace-tax-split' ? '价税拆分' : '订单明细'} collapsible={false}><Row label="订单号">{order.number}</Row>{taxFields.map(([key, label]) => <Row key={key} label={label}>{order[key] || '—'}</Row>)}</Section>{scene === 'workspace-tax-split' && <p className="m-input-note">金额填写与提交暂未开放，待确认现行价税拆分规则。</p>}<Actions items={[{ label: '返回待处理任务', onClick: () => go('workspace-tasks') }]} /></>}
    {address && <Overlay sheet label="编辑注册地址" onClose={() => window.dispatchEvent(new CustomEvent('mobile-close-address'))}><div className="m-address-editor"><div className="m-picker-title"><strong>编辑注册地址</strong><button onClick={() => window.dispatchEvent(new CustomEvent('mobile-close-address'))}>关闭</button></div><AddressForm initial={draft.basic.address} onCancel={() => setAddress(false)} onConfirm={value => { setDraft({ ...draft, basic: { ...draft.basic, address: value } }); setAddress(false); }} /></div></Overlay>}
    {bankIndex !== null && <div className="m-fullscreen-panel" role="dialog" aria-modal="true" aria-label="门户银行编辑"><div className="m-picker-title"><button onClick={closeBank}>取消</button><strong>{bankIndex < 0 ? '新增银行' : '修改银行'}</strong></div><BankFields bank={bank} setBank={setBank} company={profile.type === supplierTypes[0]} /><Actions items={[{ label: '取消', secondary: true, onClick: closeBank }, { label: '保存此账户', onClick: () => { const error = bankError(bank, profile.type === supplierTypes[0]); if (error) return notify(error); if (draft.banks.some((b, i) => i !== bankIndex && b.accountType === '基本账户' && bank.accountType === '基本账户')) return notify('基本账户只能有一个'); const entry = { ...bank, id: bankIndex < 0 ? crypto.randomUUID() : draft.banks[bankIndex].id }; setDraft({ ...draft, banks: bankIndex < 0 ? [...draft.banks, entry] : draft.banks.map((b, i) => i === bankIndex ? entry : b) }); bankGuard.accept(); setBankIndex(null); } }]} /></div>}
    {removeBank !== null && <Confirm text="确认删除此银行账户？" onCancel={() => setRemoveBank(null)} onConfirm={() => { setDraft({ ...draft, banks: draft.banks.filter((_, i) => i !== removeBank) }); setRemoveBank(null); }} />}
    {logout && <Confirm text={store.portalDraft ? '还有尚未提交的资料修改，退出将放弃这些修改。确认退出？' : '确认退出协同门户？'} onCancel={() => setLogout(false)} onConfirm={() => { store.portalDraft = null; store.portalAccount = null; notify('已退出演示登录'); go('portal'); }} />}
    {!editing && ['workspace-home', 'workspace-tasks', 'workspace-account'].includes(scene) && <nav className="m-bottom-nav" aria-label="协同门户导航">{[[Home, '首页', 'workspace-home'], [ClipboardList, '业务任务', 'workspace-tasks'], [UserRound, '账户', 'workspace-account']].map(([Icon, label, route], i) => <button key={route} aria-current={current === i ? 'page' : undefined} onClick={() => go(route)}><Icon aria-hidden="true" /><span>{label}</span></button>)}</nav>}
  </div>;
}


