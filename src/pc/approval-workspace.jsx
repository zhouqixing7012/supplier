import React, { useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Select, Space, Steps, Tooltip } from 'antd-pc';
import { Plus } from 'lucide-react';
import QueryBar, { QueryItem } from '../erp/QueryBar.jsx';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { EmptyContent, PcTable, QueryResults, StatusTag } from '../erp/components.jsx';
import { informationChangeGroups } from '../pages/mobile-changes.jsx';
import { filledBasic } from '../pages/mobile-forms.jsx';
import { exampleBank, people } from '../pages/mobile-data.js';
import { demoCompanies, PermissionModal } from './admin-workflows.jsx';
import { SupplierSnapshot } from './record-editor.jsx';

const nodes = ['开始', '业务审批', '领导审批', '财务审批'];
const department = people.find((person) => person.name === '陈才慧')?.department || '集团总部.ERP部.平台技术部';
const columns = (fields) => fields.map(([dataIndex, title, width]) => ({ dataIndex, title, width }));

export function createApprovalTask({ number, type, submittedAt, applicant, profile, before, permissions = [], affiliation }) {
  return {
    number, type, submittedAt, applicant, profile, before, permissions,
    department: affiliation || department,
    status: '待审批',
  };
}

export function initialApprovalTasks() {
  const profile = {
    type: filledBasic.type,
    basic: {
      ...filledBasic, supplierName: '演示注册供应商', legalRepresentative: '演示法人',
      creditCode: 'MOCK-CREDIT-001', companyPhone: '010-00000000',
      address: '北京市海淀区演示地址', cooperation: '企业应用开发服务',
      businessScope: '软件开发、技术咨询与技术服务', businessAdvantage: '提供应用开发、部署及维护服务',
      proof: '演示营业执照.jpg',
    },
    contacts: [{ id: 'demo-contact', name: '演示联系人', phone: '13800000000', email: 'contact@example.invalid' }],
    banks: [{ ...exampleBank, name: '演示注册供应商', number: '****4174', proof: '演示开户证明.jpg' }],
  };
  const registration = createApprovalTask({
    number: 'MOCK-SUP-001', type: '注册', submittedAt: '2026-11-10 17:00:53', applicant: '供应商', profile,
  });
  const change = createApprovalTask({
    number: 'MOCK-SUP-002', type: '资料变更', submittedAt: '2026-11-11 10:00:00', applicant: '供应商',
    before: profile, profile: { ...profile, basic: { ...profile.basic, businessScope: '软件开发、技术咨询与系统维护' } },
  });
  return [registration, change, {
    ...registration, number: 'MOCK-SUP-003', status: '同意', handledAt: '2026-11-11 09:30:00',
    opinion: '资料已核对。', company: demoCompanies[0],
  }];
}

export function ApprovalTaskList({ tasks, processed, onOpen, view, setView }) {
  const [query, setQuery] = useState(view.query || '');
  const reset = () => { setQuery(''); setView({}); };
  const rows = tasks.filter((task) => (task.status !== '待审批') === processed &&
    [task.number, task.profile.basic.supplierName].some((value) => value?.includes(view.query || '')));
  const taskColumns = [
    { title: '审批单号', dataIndex: 'number', width: 160, render: (number) =>
      <Button type="link" size="small" onClick={() => onOpen(number)}>{number}</Button> },
    ...columns([['supplier', '供应商名称', 210], ['type', '审批类型', 120], ['applicant', '申请人', 120], ['submittedAt', '申请时间', 172]]),
    { title: '审批节点', width: 110, render: () => nodes[1] },
    { title: '办理状态', dataIndex: 'status', width: 100, render: (status) => <StatusTag value={status} /> },
    ...(processed ? columns([['handledAt', '办理时间', 172]]) : []),
  ];
  return <div className="pc-page-stack">
    <QueryBar onQuery={() => setView({ query: query.trim() })} onReset={reset}>
      <QueryItem label="供应商名称或审批单号"><Input allowClear value={query} onChange={(event) => setQuery(event.target.value)}
        onPressEnter={() => setView({ query: query.trim() })} /></QueryItem>
    </QueryBar>
    <QueryResults total={rows.length} conditions={view.query ? [['供应商名称或审批单号', view.query]] : []} onClear={reset}>
      <PcTable rowKey="number" scroll={{ x: 'max-content' }} columns={taskColumns} filtered={Boolean(view.query)}
        dataSource={rows.map((task) => ({ ...task, supplier: task.profile.basic.supplierName }))} />
    </QueryResults>
  </div>;
}

export function Changes({ before, after }) {
  const groups = informationChangeGroups(before, after);
  if (before.permissions && after.permissions) {
    const old = new Map(before.permissions.map((row) => [row.id, row]));
    const next = new Map(after.permissions.map((row) => [row.id, row]));
    for (const id of new Set([...old.keys(), ...next.keys()])) {
      const previous = old.get(id);
      const current = next.get(id);
      const fields = [['group', '所属权限'], ['category', '权限分类'], ['note', '备注']].map(([key, label]) => ({
        key, label, previous: previous?.[key] || '', next: current?.[key] || '',
      })).filter((field) => field.previous !== field.next).map((field) => ({ ...field, changed: true, value: field.next || field.previous }));
      if (fields.length) groups.push({ key: 'permission:' + id, title: '分配权限', action: !previous ? '新增' : !current ? '删除' : '变更', fields });
    }
  }
  return <Card size="small" title="变更对比">
    {groups.length ? <PcTable rowKey="key" pagination={false} scroll={{ x: 'max-content' }}
      columns={columns([['section', '资料', 180], ['changeType', '变更类型', 94], ['label', '字段', 140], ['previous', '修改前', 215], ['next', '修改后', 215]])}
      dataSource={groups.flatMap((group) => group.fields.filter((field) => group.action === '变更' ? field.changed : field.value)
        .map((field) => ({ ...field, key: group.key + '-' + field.key, section: group.title, changeType: group.action })))} /> : <EmptyContent description="没有信息变更" />}
  </Card>;
}

function ApprovalHistory({ task, approver }) {
  const handled = task.status !== '待审批';
  const approved = task.status === '同意';
  return <Card size="small" title="审批历史" className="pc-approval-history">
    <Steps size="small" current={approved ? 2 : 1} status={task.status === '驳回' ? 'error' : 'process'}
      items={nodes.map((title) => ({ title }))} />
    <PcTable rowKey="node" pagination={false} scroll={{ x: 'max-content' }}
      columns={columns([['person', '申请/审批人', 140], ['agent', '代理人', 110], ['node', '审批节点', 110], ['time', '审批时间', 170], ['status', '审批状态', 100], ['opinion', '审批意见', 220]])}
      dataSource={[
        { person: task.applicant, node: nodes[0], time: task.submittedAt, status: '已提交' },
        { person: approver, node: nodes[1], time: task.handledAt, status: task.status, opinion: task.opinion },
      ]} />
  </Card>;
}

export function ApprovalTaskDetail({ task, approver, onBack, onComplete }) {
  const [form] = Form.useForm();
  const [permissionEditor, setPermissionEditor] = useState(null);
  const [permissions, setPermissions] = useState(task?.permissions || []);
  const [permissionError, setPermissionError] = useState(false);
  const { modal } = App.useApp();
  if (!task) return <Card size="small"><EmptyContent description="审批任务不存在" /><Button onClick={onBack}>返回</Button></Card>;
  const pending = task.status === '待审批';
  const registration = task.type === '注册';

  const decide = async (status) => {
    if (status === '同意' && registration) {
      const companyValid = await form.validateFields(['company']).then(() => true, () => false);
      setPermissionError(!permissions.length);
      if (!permissions.length || !companyValid) {
        if (!permissions.length) document.getElementById('approval-permissions')?.scrollIntoView?.({ block: 'center' });
        else form.scrollToField('company', { focus: true });
        return;
      }
    }
    modal.confirm({
      title: '确认' + status + '本次审批？', centered: true, className: 'pc-confirm',
      okText: status, cancelText: '取消', okButtonProps: { danger: status === '驳回' },
      onOk: () => onComplete({ status, opinion: form.getFieldValue('opinion') || '', company: form.getFieldValue('company'), permissions }),
    });
  };

  return <div className="pc-page-stack pc-register">
    <Card size="small" title={task.profile.basic.supplierName} extra={<Space><StatusTag value={task.status} /><Button onClick={onBack}>返回</Button></Space>}>
      <DetailGrid className="pc-detail-grid">
        <DetailItem label="审批单号">{task.number}</DetailItem>
        <DetailItem label="审批类型">{task.type}</DetailItem>
        <DetailItem label="申请时间">{task.submittedAt}</DetailItem>
        <DetailItem label="来源">供应商系统</DetailItem>
      </DetailGrid>
    </Card>
    <SupplierSnapshot profile={task.profile} approval />
    {pending && task.before && <Changes before={task.before} after={task.profile} />}
    <Form name="supplier-approval" form={form} initialValues={{ opinion: task.opinion, company: task.company }}
      layout="vertical" className="pc-page-stack">
      {registration && <div id="approval-permissions">
        <Card size="small" title="分配权限" extra={pending && <Button icon={<Plus size={14} />} onClick={() => setPermissionEditor({})}>添加权限</Button>}>
          {permissionError && <Alert type="error" message="请至少添加一条分配业务记录" showIcon />}
          <PcTable rowKey="id" pagination={false} scroll={{ x: 'max-content' }} dataSource={permissions} columns={[
            { title: '序号', width: 60, render: (_, row, index) => index + 1 },
            ...columns([['group', '所属权限', 160], ['category', '权限分类', 160], ['note', '备注', 190]]),
            ...(pending ? [{ title: '操作', width: 100, render: (_, row) => <Space size={4}>
              <Button size="small" type="link" danger onClick={() => setPermissions((current) => current.filter((item) => item.id !== row.id))}>移除</Button>
              <Button size="small" type="link" onClick={() => setPermissionEditor({ row })}>修改</Button>
            </Space> }] : []),
          ]} />
          <div className="pc-workflow-grid pc-approval-assignment">
            <Form.Item label="归属部门"><Input readOnly value={task.department} /></Form.Item>
            <Form.Item name="company" label="付款公司" rules={pending ? [{ required: true, message: '请选择付款公司' }] : undefined}>
              <Select disabled={!pending} placeholder="请选择付款公司" options={demoCompanies.map((value) => ({ value }))} />
            </Form.Item>
          </div>
        </Card>
      </div>}
      <ApprovalHistory task={task} approver={approver} />
      {pending && <Card size="small">
        <Form.Item name="opinion" label="审批意见"><Input.TextArea rows={3} maxLength={1000} showCount /></Form.Item>
        <Space wrap>
          <Button type="primary" onClick={() => decide('同意')}>同意</Button>
          <Button danger onClick={() => decide('驳回')}>驳回</Button>
          {['加签', '延期'].map((label) => <Tooltip title={label + '办理规则待确认'} key={label}>
            <span tabIndex={0}><Button disabled>{label}</Button></span>
          </Tooltip>)}
        </Space>
      </Card>}
    </Form>
    {permissionEditor && <PermissionModal initial={permissionEditor.row} existing={permissions} onCancel={() => setPermissionEditor(null)}
      onSave={(entry) => {
        setPermissions((current) => permissionEditor.row ? current.map((item) => item.id === entry.id ? entry : item) : [...current, entry]);
        setPermissionError(false);
        setPermissionEditor(null);
      }} />}
  </div>;
}
