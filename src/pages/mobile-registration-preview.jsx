import React from 'react';
import { AttachmentLink, RecordCard, RecordCollection, Row, Section, Tabs } from '../components/mobile/index.js';
import { SupplierIdentityCard } from './mobile-ui.jsx';
import { BankCard, fieldsFor } from './mobile-forms.jsx';
import { QualificationInfo, qualificationFields } from './mobile-qualifications.jsx';
import { ChangeBadge, contactFields, informationChangeGroups, InlineChangeField } from './mobile-changes.jsx';
import { SwipeArea } from './mobile-interaction.jsx';
import { supplierTypes } from './mobile-data.js';
import { personalCertificatePhotoFields, showRegistrationEmail } from './mobile-edit-rules.js';

function certificateFields(basic, type = basic.type) {
  const [enterprise, personal, , foreign] = supplierTypes;
  return type === personal ? personalCertificatePhotoFields(basic.certificateType) : {
    [enterprise]: [['proof', '营业执照']],
    [foreign]: [['proof', '证书']],
  }[type] || [];
}

const attachment = (value, onPreview) => value ? <AttachmentLink value={value} onPreview={onPreview} /> : '—';

export function CertificateAttachmentRows({ basic, type = basic.type, onPreview }) {
  return certificateFields(basic, type).map(([key, label]) => <Row key={key} label={label}>{attachment(basic[key], onPreview)}</Row>);
}

function previewRow(group, onPreview) {
  return (key, label, value, compact = false) => {
    const field = group?.fields.find(item => item.key === key && item.changed);
    return field
      ? <InlineChangeField key={key} field={field} label={label} onPreview={onPreview} />
      : <Row key={key} label={label} compact={compact}>{value || '—'}</Row>;
  };
}

const recordKey = (record, i, kind) => record.id || kind + '-' + i;
const withDeleted = (entries, previous, kind, changes) => [
  ...entries, ...previous.filter((entry, i) => changes.get(kind + '-' + recordKey(entry, i, kind))?.action === '删除'),
];

export function RegistrationDetails({ basic, contacts, banks, onPreview, step, invited = false, before, portalView = false }) {
  const personal = basic.type === supplierTypes[1];
  const show = section => step === undefined || step === section;
  const changes = new Map(before ? informationChangeGroups(before, { basic, contacts, banks }).map(group => [group.key, group]) : []);
  const basicChange = changes.get('basic');
  const basicRow = previewRow(basicChange, onPreview);
  const displayedBasicFields = [...new Map([
    ...fieldsFor(basic.type),
    ...(basicChange?.fields.filter(field => field.changed && !['registerEmail', 'type', 'proof', 'personalSupplierBackPicture'].includes(field.key))
      .map(field => [field.key, field.label]) || []),
  ].map(([key, label]) => [key, label]))].filter(([key]) =>
    key !== 'supplierName' || portalView || basicChange?.fields.some(field => field.key === key && field.changed));
  if (basicChange?.fields.some(field => field.key === 'type' && field.changed)) displayedBasicFields.unshift(['type', '供应商类型']);
  const certificates = new Map(certificateFields(basic));
  if (before?.basic) {
    for (const [key, label] of certificateFields(before.basic, before.type)) {
      if (!certificates.has(key) && basicChange?.fields.some(field => field.key === key && field.changed)) certificates.set(key, label);
    }
  }
  const allContacts = withDeleted(contacts, before?.contacts || [], 'contacts', changes);
  const allBanks = withDeleted(banks, before?.banks || [], 'banks', changes);
  const allQualifications = withDeleted(basic.qualifications || [], before?.basic?.qualifications || [], 'qualifications', changes);
  return <>
    {show(0) && <>
      <Section title="基本信息" collapsible={false} className="m-preview-basic" status={<ChangeBadge action={basicChange?.action} />}>
        {displayedBasicFields.map(([key, label]) => basicRow(key, label, basic[key]))}
        {(portalView || showRegistrationEmail(basic.type, invited)) && basicRow('registerEmail', '注册邮箱', basic.registerEmail)}
        {[...certificates].map(([key, label]) => basicRow(key, label, attachment(basic[key], onPreview)))}
      </Section>
      {(basic.type === supplierTypes[0] || allQualifications.length > 0) && <QualificationInfo records={allQualifications} onPreview={onPreview}
        renderRecord={before ? (record, i) => {
          const id = recordKey(record, i, 'qualifications');
          const change = changes.get('qualifications-' + id);
          const row = previewRow(change, onPreview);
          return <RecordCard key={id} title={record.qualificationName || '资质信息 ' + (i + 1)} status={<ChangeBadge action={change?.action} />}>
            {change?.fields.some(field => field.key === 'qualificationName' && field.changed) && row('qualificationName', '资质名称', record.qualificationName)}
            {qualificationFields.slice(1).map(([key, label]) => row(key, label, record[key]))}
            {row('qualificationCertificatePicture', '附件', attachment(record.qualificationCertificatePicture, onPreview))}
          </RecordCard>;
        } : undefined} />}
    </>}
    {(!personal || portalView || allContacts.length > 0) && show(1) && <RecordCollection title="联系人信息" count={allContacts.length} emptyText="暂无联系人信息">
      {allContacts.map((contact, i) => {
        const id = recordKey(contact, i, 'contacts');
        const change = changes.get('contacts-' + id);
        const row = previewRow(change, onPreview);
        return <RecordCard key={id} title={contact.name || '联系人 ' + (i + 1)} status={<ChangeBadge action={change?.action} />}>
          {change?.fields.some(field => field.key === 'name' && field.changed) && row('name', '姓名', contact.name)}
          {contactFields.slice(1).map(([key, label]) => row(key, label, contact[key]))}
        </RecordCard>;
      })}
    </RecordCollection>}
    {show(2) && <RecordCollection title="银行信息" count={allBanks.length} emptyText="暂无银行信息">
      {allBanks.map((bank, i) => {
        const id = recordKey(bank, i, 'banks');
        const change = changes.get('banks-' + id);
        return <BankCard key={id} bank={bank} onPreview={onPreview} showProof={!portalView}
          status={change && <ChangeBadge action={change.action} />} renderField={previewRow(change, onPreview)} />;
      })}
    </RecordCollection>}
  </>;
}

export function RegistrationPreview({ basic, contacts, banks, mode, active, onTabChange, onPreview, before, supplierFacing = false, invited = false }) {
  const personal = basic.type === supplierTypes[1];
  const tabs = [{ label: '基本信息', step: 0 }, ...(!personal ? [{ label: '联系人信息', step: 1 }] : []), { label: '银行信息', step: 2 }];
  const index = Math.min(active, tabs.length - 1);
  return <div className="m-detail m-registration-preview">
    <SupplierIdentityCard showMeta={!supplierFacing} supplier={{ name: basic.supplierName, type: basic.type, mode }} />
    <Tabs variant="pill" items={tabs.map(tab => tab.label)} active={index} onChange={onTabChange} />
    <SwipeArea active={index} count={tabs.length} onChange={onTabChange}>
      <RegistrationDetails basic={basic} contacts={contacts} banks={banks} onPreview={onPreview} step={tabs[index].step} invited={invited} before={before} />
    </SwipeArea>
  </div>;
}
