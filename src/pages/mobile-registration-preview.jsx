import React from 'react';
import { AttachmentLink, RecordCard, RecordCollection, Row, Section, Tabs } from '../components/mobile/index.js';
import { SupplierIdentityCard } from './mobile-ui.jsx';
import { BankCard, fieldsFor } from './mobile-forms.jsx';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { SwipeArea } from './mobile-interaction.jsx';
import { supplierTypes } from './mobile-data.js';
import { personalCertificatePhotoFields } from './mobile-edit-rules.js';

export function CertificateAttachmentRows({ basic, type = basic.type, onPreview }) {
  const [enterprise, personal, , foreign] = supplierTypes;
  const fields = type === personal ? personalCertificatePhotoFields(basic.certificateType) : {
    [enterprise]: [['proof', '营业执照']],
    [foreign]: [['proof', '证书']],
  }[type] || [];
  return fields.map(([key, label]) => <Row key={key} label={label}>{basic[key] ? <AttachmentLink value={basic[key]} onPreview={onPreview} /> : '—'}</Row>);
}

export function RegistrationDetails({ basic, contacts, banks, onPreview, step }) {
  const personal = basic.type === supplierTypes[1];
  const show = section => step === undefined || step === section;
  return <>
    {show(0) && <>
      <Section title="基本信息" collapsible={false}>
        {fieldsFor(basic.type).filter(([key]) => key !== 'supplierName').map(([key, label]) => <Row key={key} label={label}>{basic[key] || '—'}</Row>)}
        <Row label="供应商注册邮箱">{basic.registerEmail || '—'}</Row>
        <CertificateAttachmentRows basic={basic} onPreview={onPreview} />
      </Section>
      {basic.type === supplierTypes[0] && <QualificationInfo records={basic.qualifications} onPreview={onPreview} />}
    </>}
    {!personal && show(1) && <RecordCollection title="联系人信息" count={contacts.length} emptyText="暂无联系人信息">
      {contacts.map((contact, i) => <RecordCard key={contact.id} title={contact.name || '联系人 ' + (i + 1)}>
        {[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{contact[key] || '—'}</Row>)}
      </RecordCard>)}
    </RecordCollection>}
    {show(2) && <RecordCollection title="银行信息" count={banks.length} emptyText="暂无银行信息">
      {banks.map(bank => <BankCard fileProof key={bank.id} bank={bank} onPreview={() => onPreview(bank.proof)} />)}
    </RecordCollection>}
  </>;
}

export function RegistrationPreview({ basic, contacts, banks, mode, active, onTabChange, onPreview, children, supplierFacing = false }) {
  const personal = basic.type === supplierTypes[1];
  const groups = [{ label: '基本信息', step: 0 }, ...(!personal ? [{ label: '联系人信息', step: 1 }] : []), { label: '银行信息', step: 2 }];
  return <div className="m-detail m-registration-preview">
    <SupplierIdentityCard showMeta={!supplierFacing} supplier={{ name: basic.supplierName, type: basic.type, mode }} />
    <Tabs variant="pill" items={groups.map(g => g.label)} active={active} onChange={onTabChange} />
    <SwipeArea active={active} count={groups.length} onChange={onTabChange}>
      {children}
      <RegistrationDetails basic={basic} contacts={contacts} banks={banks} onPreview={onPreview} step={groups[active].step} />
    </SwipeArea>
  </div>;
}

