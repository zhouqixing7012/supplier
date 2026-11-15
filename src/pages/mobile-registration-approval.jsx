import React, { useState } from 'react';
import { Actions, Row, Section } from '../components/mobile/index.js';
import { Field } from './mobile-ui.jsx';
import { RegistrationDetails } from './mobile-registration-preview.jsx';
import { mobileSupplierSamples } from './mobile-supplier-samples.js';

const stages = ['业务审批', '领导审批', '财务审批'];
const companies = ['演示采购公司', '演示付款公司'];

// 独立审批演示，复用登记预览展示本次申请的只读资料。
export function RegistrationApprovalDemo({ sampleId = 'mock-person-id-card', onPreview }) {
  const supplier = mobileSupplierSamples.find(record => record.id === sampleId) || mobileSupplierSamples[0];
  const [stage, setStage] = useState(0);
  const [company, setCompany] = useState('');
  const [opinion, setOpinion] = useState('');
  const [result, setResult] = useState(null);
  const [companyError, setCompanyError] = useState('');

  function decide(approved) {
    if (approved && stage === 0 && !company) {
      setCompanyError('请选择付款公司');
      return;
    }
    if (approved && stage < stages.length - 1) {
      setStage(stage + 1);
      setOpinion('');
      return;
    }
    setResult(approved ? { status: '审批通过' } : { status: '审批驳回', opinion });
  }

  return <>
    <Section title="注册申请" collapsible={false}>
      <Row label="供应商名称">{supplier.name}</Row>
      <Row label="供应商类型">{supplier.type}</Row>
      <Row label="邀请人">{supplier.inviter}</Row>
      <Row label="当前节点">{stages[stage]}</Row>
    </Section>
    <RegistrationDetails basic={supplier.basic} contacts={supplier.contacts} banks={supplier.banks} onPreview={onPreview} />
    {result ? <Section title="结果邮件预览" collapsible={false}>
      <Row label="收件人">{supplier.inviter}</Row>
      <Row label="注册审批结果">{result.status}</Row>
      {result.status === '审批驳回' && <Row label="驳回原因">{result.opinion || '—'}</Row>}
      <p className="m-input-note">此处为工作流结果演示，未发送邮件。</p>
    </Section> : <Section title="审批办理" collapsible={false}>
      {stage === 0 && <Field label="付款公司" required searchable selectionMode="confirm" options={companies}
        value={company} error={companyError} onChange={value => { setCompany(value); setCompanyError(''); }} />}
      <Field label="审批意见" multiline value={opinion} onChange={setOpinion} />
      <Actions flat items={[{ label: '驳回', onClick: () => decide(false) }, { label: '同意', onClick: () => decide(true) }]} />
    </Section>}
  </>;
}
