import React from 'react';
import { AttachmentLink, Empty, Row, Section, SupplierIdentityCard } from './mobile-ui.jsx';
import { BankCard, fieldsFor } from './mobile-forms.jsx';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { Tabs } from './mobile-views.jsx';
import { SwipeArea } from './mobile-interaction.jsx';
import { supplierTypes } from './mobile-data.js';

export function RegistrationPreview({ basic, contacts, banks, mode, active, onTabChange, onEdit, onPreview, children }) {
  const personal = basic.type === supplierTypes[1];
  const groups = [{ label: '基本信息', step: 0 }, ...(!personal ? [{ label: '联系人信息', step: 1 }] : []), { label: '银行信息', step: 2 }];
  return <div className="m-detail m-registration-preview">
    <SupplierIdentityCard supplier={{ name: basic.supplierName, type: basic.type, mode }} />
    <Tabs variant="pill" items={groups.map(g => g.label)} active={active} onChange={onTabChange} />
    <div className="m-preview-toolbar"><button type="button" onClick={() => onEdit(groups[active].step)} aria-label={'编辑' + groups[active].label}>编辑</button></div>
    <SwipeArea active={active} count={groups.length} onChange={onTabChange}>
      {children}
      {groups[active].step === 0 && <><Section title="基本信息" collapsible={false}>{fieldsFor(basic.type).filter(([key]) => key !== 'supplierName').map(([key, label]) => <Row key={key} label={label}>{basic[key] || '—'}</Row>)}<Row label="供应商注册邮箱">{basic.registerEmail || '—'}</Row><Row label="证照附件">{basic.proof ? <AttachmentLink value={basic.proof} onPreview={onPreview} /> : '—'}</Row></Section><QualificationInfo records={basic.qualifications} onPreview={onPreview} /></>}
      {groups[active].step === 1 && <Section title="联系人信息" collapsible={false}>{contacts.length ? contacts.map((contact, i) => <article className="m-entity-card" key={contact.id}><h3>{contact.name || '联系人 ' + (i + 1)}</h3>{[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{contact[key] || '—'}</Row>)}</article>) : <Empty text="暂无联系人信息" />}</Section>}
      {groups[active].step === 2 && <Section title="银行信息" collapsible={false}>{banks.length ? banks.map(bank => <BankCard fileProof key={bank.id} bank={bank} onPreview={() => onPreview(bank.proof)} />) : <Empty text="暂无银行信息" />}</Section>}
    </SwipeArea>
  </div>;
}

