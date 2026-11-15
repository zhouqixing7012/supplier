import React from 'react';
import { AttachmentLink, RecordCard, RecordCollection, Empty, Row, Section, Tabs } from '../components/mobile/index.js';
import { SupplierIdentityCard } from './mobile-ui.jsx';
import { BankCard, fieldsFor } from './mobile-forms.jsx';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { SwipeArea } from './mobile-interaction.jsx';
import { supplierTypes } from './mobile-data.js';

export function RegistrationPreview({ basic, contacts, banks, mode, active, onTabChange, onPreview, children, supplierFacing = false }) {
  const personal = basic.type === supplierTypes[1];
  const groups = [{ label: '基本信息', step: 0 }, ...(!personal ? [{ label: '联系人信息', step: 1 }] : []), { label: '银行信息', step: 2 }];
  return <div className="m-detail m-registration-preview">
    <SupplierIdentityCard showMeta={!supplierFacing} supplier={{ name: basic.supplierName, type: basic.type, mode }} />
    <Tabs variant="pill" items={groups.map(g => g.label)} active={active} onChange={onTabChange} />
    <SwipeArea active={active} count={groups.length} onChange={onTabChange}>
      {children}
      {groups[active].step === 0 && <><Section title="基本信息" collapsible={false}>{fieldsFor(basic.type).filter(([key]) => key !== 'supplierName').map(([key, label]) => <Row key={key} label={label}>{basic[key] || '—'}</Row>)}<Row label="供应商注册邮箱">{basic.registerEmail || '—'}</Row><Row label="证照附件">{basic.proof ? <AttachmentLink value={basic.proof} onPreview={onPreview} /> : '—'}</Row></Section><QualificationInfo records={basic.qualifications} onPreview={onPreview} /></>}
      {groups[active].step === 1 && <RecordCollection title="联系人信息" count={contacts.length} emptyText="暂无联系人信息">{contacts.map((contact, i) => <RecordCard key={contact.id} title={contact.name || '联系人 ' + (i + 1)}>{[['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label]) => <Row key={key} label={label}>{contact[key] || '—'}</Row>)}</RecordCard>)}</RecordCollection>}
      {groups[active].step === 2 && <RecordCollection title="银行信息" count={banks.length} emptyText="暂无银行信息">{banks.map(bank => <BankCard fileProof key={bank.id} bank={bank} onPreview={() => onPreview(bank.proof)} />)}</RecordCollection>}
    </SwipeArea>
  </div>;
}

