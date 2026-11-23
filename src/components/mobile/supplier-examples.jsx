import React, { useState } from 'react';
import { Actions, AddressForm, FullscreenPanel, Section, Tabs } from './index.js';
import {
  AccountSecurityForm, Approval, BankCard, BankFields, BasicFields, ChangeComparison, ContactFields,
  PermissionCard, PermissionForm, QualificationInfo, RegistrationPreview, SupplierIdentityCard,
} from './supplier.js';
import { bankError } from '../../pages/mobile-forms.jsx';
import { regionData } from '../../pages/registration-regions.js';
import { createPortalMockApi } from '../../api/mobile/mock-portal.js';

const exampleBasic = {
  type: '企业供应商', supplierName: '示例办公用品供应商', registerEmail: 'contact@example.com',
  country: '国内', address: '北京市/北京市/朝阳区 示例路 1 号',
};
const exampleSupplier = {
  name: exampleBasic.supplierName, type: exampleBasic.type, mode: '代注册', status: '已审批',
  basic: exampleBasic,
  approvalNumber: 'SUP-DEMO-001',
  approvalNodes: [
    { id: 'start', name: '提交注册', status: '已审批', person: '示例申请人', time: '2026-11-15' },
    { id: 'finance', name: '财务审批', status: '待审批', person: '示例审批人' },
  ],
};
const exampleBank = {
  id: 'bank', accountType: '基本账户', bank: '中国农业发展银行', branch: '北京市分行',
  country: '中国', province: '北京市', city: '北京市', name: exampleSupplier.name,
  number: '0000000001234', currency: '人民币', proof: '', note: '',
};

function BasicExample() {
  const [basic, setBasic] = useState(exampleBasic);
  const [addressOpen, setAddressOpen] = useState(false);
  return <>
    <SupplierIdentityCard supplier={{ ...exampleSupplier, name: basic.supplierName }} />
    <Section title="基本信息填写" collapsible={false}>
      <BasicFields data={basic} setData={setBasic} onAddress={() => setAddressOpen(true)} />
    </Section>
    {addressOpen && <AddressForm sheet regions={regionData} initial={basic.address}
      onCancel={() => setAddressOpen(false)}
      onConfirm={address => { setBasic({ ...basic, address }); setAddressOpen(false); }} />}
  </>;
}

function RecordsExample() {
  const [contacts, setContacts] = useState([{ id: 'contact', name: '示例联系人', phone: '000-00000000', email: 'contact@example.com' }]);
  const [records, setRecords] = useState([{ id: 'qualification', qualificationName: '示例资质' }]);
  return <>
    <ContactFields contacts={contacts} setContacts={setContacts} />
    <QualificationInfo records={records} onChange={setRecords} />
  </>;
}

function BankExample() {
  const [account, setAccount] = useState(exampleBank);
  const [draft, setDraft] = useState(exampleBank);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const close = () => setOpen(false);
  const requestClose = () => window.dispatchEvent(new CustomEvent('mobile-close-register-bank'));
  const save = () => {
    const message = bankError(draft);
    if (message) { setError(message); return; }
    setAccount(draft);
    close();
  };
  return <>
    <Section title="银行账户" collapsible={false}>
      <BankCard bank={account} onEdit={() => { setDraft(account); setError(''); setOpen(true); }} />
    </Section>
    {open && <FullscreenPanel title="编辑银行账户" onBack={requestClose}>
      <BankFields bank={draft} setBank={setDraft} onCancel={close} />
      {error && <p role="alert" className="m-catalog-note">{error}</p>}
      <Actions items={[{ label: '保存此账户', onClick: save }]} />
    </FullscreenPanel>}
  </>;
}

function PermissionsExample() {
  const [record, setRecord] = useState({ group: '差旅权限', category: '火车', note: '' });
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState('');
  return <>
    <Section title="供应商权限" collapsible={false}>
      <PermissionCard data={record} onEdit={() => { setMessage(''); setDraft(record); }} />
    </Section>
    {draft && <FullscreenPanel title="编辑供应商权限"
      onBack={() => window.dispatchEvent(new CustomEvent('mobile-close-permission'))}>
      <PermissionForm initial={draft} onCancel={() => setDraft(null)} notify={setMessage}
        onSave={data => { setRecord(data); setDraft(null); }} />
      {message && <p role="alert" className="m-catalog-note">{message}</p>}
    </FullscreenPanel>}
  </>;
}

const supplierExamples = [
  ['基本信息', BasicExample], ['联系人与资质', RecordsExample], ['银行账户', BankExample], ['供应商权限', PermissionsExample],
];

export function SupplierExamples() {
  const [active, setActive] = useState(0);
  const Example = supplierExamples[active][1];
  return <>
    <Tabs items={supplierExamples.map(([label]) => label)} active={active} onChange={setActive}
      label="供应商资料示例" showDirectory={false} />
    <Example />
  </>;
}

export function WorkflowExamples() {
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState(0);
  const [result, setResult] = useState('');
  const [portalApi] = useState(createPortalMockApi);
  return <>
    <Tabs items={['审批进度', '资料变更', '注册预览', '账户安全']}
      active={active} onChange={value => { setActive(value); setResult(''); }}
      label="业务组件示例" showDirectory={false} />
    {active === 0 && <Approval supplier={exampleSupplier} />}
    {active === 1 && <ChangeComparison before={exampleSupplier}
      after={{ ...exampleSupplier, basic: { ...exampleBasic, address: '北京市/北京市/海淀区 示例路 2 号' } }} />}
    {active === 2 && <RegistrationPreview basic={exampleBasic} contacts={[]} banks={[exampleBank]}
      mode={exampleSupplier.mode} active={preview} onTabChange={setPreview} />}
    {active === 3 && <AccountSecurityForm api={portalApi} kind="password" email={exampleBasic.registerEmail}
      onCancel={() => setActive(0)} onComplete={() => setResult('已完成密码修改示例')} />}
    {result && <p role="status" className="m-catalog-note">{result}</p>}
  </>;
}
