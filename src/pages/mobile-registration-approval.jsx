import React, { useState } from 'react';
import { Actions, CardActions, RecordCard, RecordCollection, Row, Section } from '../components/mobile/index.js';
import { Field } from './mobile-ui.jsx';
import { permissionGroups } from './mobile-data.js';
import { createSessionId } from './mobile-interaction.jsx';

const stages = ['业务审批', '领导审批', '财务审批'];
const departments = ['演示采购部门', '演示业务部门', '演示财务部门'];
const companies = ['演示采购公司', '演示付款公司'];
const blankAssignment = { group: '', category: '', company: '' };
const groups = Object.keys(permissionGroups).filter(group => group !== '撰稿人权限');

// 独立评审场景。正式审批和结果邮件由工作流办理。
export function RegistrationApprovalDemo() {
  const [stage, setStage] = useState(0);
  const [department, setDepartment] = useState(departments[0]);
  const [draft, setDraft] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [opinion, setOpinion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const change = patch => setDraft({ ...draft, ...patch });
  function saveAssignment() {
    if (!draft.group || !draft.category || !draft.company) { setError('请选择所属权限、权限分类和付款公司'); return; }
    const row = { ...draft, id: createSessionId() };
    setAssignments([...assignments, row]);
    setDraft(null);
    setError('');
  }
  function decide(status) {
    if (status === '同意' && stage === 0 && (draft || !assignments.length)) {
      setError(draft ? '请先保存或取消当前分配业务明细' : '请至少添加一条分配业务记录');
      return;
    }
    setError('');
    if (status === '同意' && stage < stages.length - 1) {
      setStage(stage + 1);
      setOpinion('');
      return;
    }
    if (status === '驳回') { setAssignments([]); setDraft(null); }
    setResult({ status: status === '同意' ? '审批通过' : '审批驳回', opinion: status === '驳回' ? opinion : '' });
  }
  return <>
    <Section title="演示注册申请" collapsible={false}>
      <Row label="邀请人">演示邀请人</Row>
      <Row label="当前节点">{stages[stage]}</Row>
      <Row label="供应商类型">个人供应商</Row>
      <Row label="证件号码">DEMO-20261115001</Row>
    </Section>
    {!result && stage === 0 && <>
      <Section title="归属部门" collapsible={false}>
        <Field label="归属部门" searchable options={departments} value={department} onChange={setDepartment} />
      </Section>
      <RecordCollection title="分配业务" count={assignments.length} emptyText="暂无分配业务记录" addLabel="添加权限" onAdd={draft ? undefined : () => setDraft(blankAssignment)}>
        {assignments.map(item => <RecordCard key={item.id} title={item.group}>
          <Row label="权限分类">{item.category}</Row><Row label="付款公司">{item.company}</Row>
          <CardActions><button type="button" onClick={() => setAssignments(assignments.filter(row => row.id !== item.id))}>移除</button></CardActions>
        </RecordCard>)}
      </RecordCollection>
      {draft && <Section title="新增分配业务" collapsible={false}>
        <Field label="所属权限" required options={groups} value={draft.group} onChange={group => change({ group, category: '' })} />
        <Field label="权限分类" required options={permissionGroups[draft.group] || []} value={draft.category} onChange={category => change({ category })} />
        <Field label="付款公司" required searchable selectionMode="confirm" options={companies} value={draft.company} onChange={company => change({ company })} />
        <Actions flat items={[{ label: '取消新增', onClick: () => { setDraft(null); setError(''); } }, { label: '保存明细', onClick: saveAssignment }]} />
      </Section>}
    </>}
    {error && <p className="m-field-error" role="alert">{error}</p>}
    {result ? <Section title="结果邮件预览" collapsible={false}>
      <Row label="收件人">演示邀请人</Row><Row label="注册审批结果">{result.status}</Row>
      {result.status === '审批驳回' && <Row label="驳回原因">{result.opinion || '—'}</Row>}
      <p className="m-input-note">此处为工作流结果演示，未发送邮件。</p>
    </Section> : <Section title="审批办理" collapsible={false}>
      <Field label="审批意见" multiline value={opinion} onChange={setOpinion} />
      <Actions flat items={[{ label: '驳回', onClick: () => decide('驳回') }, { label: '同意', onClick: () => decide('同意') }]} />
    </Section>}
  </>;
}
