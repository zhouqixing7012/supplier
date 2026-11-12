import React, { useImperativeHandle, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Select, Space } from 'antd-pc';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { EmptyContent, PcModal, PcTable } from '../erp/components.jsx';
import { people, supplierTypes } from '../pages/mobile-data.js';

const personColumns = [['name', '姓名', 100], ['userCode', '工号', 110], ['phone', '座机', 130],
  ['email', '邮箱', 210], ['job', '职位', 150], ['department', '部门', 230]]
  .map(([dataIndex, title, width]) => ({ dataIndex, title, width }));
const supplierColumns = [['name', '供应商名称', 240], ['type', '供应商类型', 130], ['inviter', '原邀请人', 105], ['inviterDept', '原邀请人部门', 200]]
  .map(([dataIndex, title, width]) => ({ dataIndex, title, width }));

function PersonPicker({ initial, onClose, onConfirm }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(initial?.userCode);
  const keyword = query.trim().toLowerCase();
  const rows = keyword ? people.filter((person) => [person.name, person.userCode, person.phone]
    .some((value) => value?.toLowerCase().includes(keyword))) : [];
  return <PcModal open title="选择人员" width={900} okText="确认" cancelText="取消" onCancel={onClose}
    okButtonProps={{ disabled: !selected }} onOk={() => onConfirm(people.find((person) => person.userCode === selected))}>
    <Input aria-label="搜索人员" placeholder="搜索姓名、工号或座机" allowClear value={query} onChange={(event) => setQuery(event.target.value)} />
    <div className="pc-person-results">
      <PcTable rowKey="userCode" columns={personColumns} dataSource={rows} pagination={false} scroll={{ x: 'max-content' }}
        locale={{ emptyText: <EmptyContent description={keyword ? '没有匹配结果，请调整关键词' : '请输入姓名或工号搜索人员'} /> }}
        rowSelection={{ type: 'radio', selectedRowKeys: selected ? [selected] : [], onChange: ([code]) => setSelected(code) }} />
    </div>
  </PcModal>;
}

export function InviterChangePage({ targets, batch, onBack, check, onSubmit, leaveRef }) {
  const [person, setPerson] = useState(null);
  const [picking, setPicking] = useState(false);
  const [removed, setRemoved] = useState([]);
  const [results, setResults] = useState([]);
  const { modal } = App.useApp();
  const selected = targets.filter((row) => !removed.includes(row.id));
  const leave = (action) => {
    if (!person) return action();
    modal.confirm({ centered: true, className: 'pc-confirm', title: '放弃本次邀请人变更？', okText: '确认离开', cancelText: '继续处理', onOk: action });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));
  if (!targets.length) return <Card size="small"><EmptyContent description="请先从列表选择要变更的供应商" /><Button onClick={onBack}>返回</Button></Card>;

  const submit = () => {
    if (!person) { setResults(['请选择新邀请人']); return; }
    if (!selected.length) { setResults(['请选择要变更的供应商']); return; }
    const ids = selected.map((row) => row.id);
    const errors = check(ids, person);
    setResults(errors);
    if (errors.length) return;
    modal.confirm({
      centered: true, className: 'pc-confirm', width: 610, title: '确认变更邀请人？',
      content: <><p>新邀请人：{person.name}（{person.userCode}）</p><PcTable rowKey="id" dataSource={selected} pagination={false}
        scroll={{ x: 'max-content', y: 230 }} columns={supplierColumns.slice(0, 3)} /></>,
      okText: '确认变更', cancelText: '取消', onCancel: onBack,
      onOk: () => setResults(onSubmit(ids, person)),
    });
  };
  return <div className="pc-page-stack">
    <Card size="small" title={batch ? '供应商信息（已选 ' + selected.length + ' 家）' : '供应商信息'}>
      {batch ? <PcTable rowKey="id" dataSource={targets} columns={supplierColumns} pagination={false} scroll={{ x: 'max-content' }}
        rowSelection={{ selectedRowKeys: selected.map((row) => row.id),
          onChange: (ids) => setRemoved(targets.filter((row) => !ids.includes(row.id)).map((row) => row.id)) }} />
        : <DetailGrid labelWidth={120}><DetailItem label="供应商名称">{targets[0].name}</DetailItem><DetailItem label="供应商类型">{targets[0].type}</DetailItem>
          <DetailItem label="原邀请人">{targets[0].inviter || '—'}</DetailItem><DetailItem label="原邀请人部门">{targets[0].inviterDept || '—'}</DetailItem></DetailGrid>}
      <div className="pc-inviter-selection">
        <DetailGrid columns={1} labelWidth={120}>
          <DetailItem label="新邀请人">
            <Space wrap>
              {person && <span>{[person.name, person.userCode, person.department].filter(Boolean).join(' · ')}</span>}
              <Button aria-label={person ? '重新选择新邀请人' : '选择新邀请人'} onClick={() => setPicking(true)}>
                {person ? '重新选择' : '选择人员'}
              </Button>
            </Space>
          </DetailItem>
        </DetailGrid>
      </div>
      {results.length > 0 && <Alert type="error" showIcon message={<ul>{results.map((error) => <li key={error}>{error}</li>)}</ul>} />}
    </Card>
    <div className="pc-register-actions"><Button onClick={() => leave(onBack)}>返回</Button><Button type="primary" onClick={submit}>提交</Button></div>
    {picking && <PersonPicker initial={person} onClose={() => setPicking(false)}
      onConfirm={(next) => { setPerson(next); setPicking(false); setResults([]); }} />}
  </div>;
}

export function InvitationEditor({ record, onBack, onSubmit, leaveRef }) {
  const [form] = Form.useForm();
  const { modal } = App.useApp();
  const leave = (action) => {
    if (!form.isFieldsTouched()) return action();
    modal.confirm({ centered: true, className: 'pc-confirm', title: '放弃本次邀请填写？', okText: '确认离开', cancelText: '继续填写', onOk: action });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));
  const required = (label) => ({ required: true, whitespace: true, message: '请填写' + label });
  return <div className="pc-page-stack pc-register">
    <Card size="small" title="邀请资料">
      <Form id="pc-invitation-form" form={form} layout="horizontal" className="pc-register-form"
        initialValues={record && { supplierType: record.type, supplierName: record.name, contactName: record.contact, contactEmail: record.email, contactPhone: record.phone }}
        onFinish={onSubmit}>
        <div className="pc-register-grid">
          <Form.Item name="supplierType" label="供应商类型" rules={[{ required: true, message: '请选择供应商类型' }]}>
            <Select options={supplierTypes.map((value) => ({ value }))} disabled={!!record} />
          </Form.Item>
          <Form.Item name="supplierName" label="供应商名称/姓名" rules={[required('供应商名称/姓名')]}><Input maxLength={120} /></Form.Item>
          <Form.Item name="contactName" label="联系人姓名" rules={[required('联系人姓名')]}><Input maxLength={60} /></Form.Item>
          <Form.Item name="contactEmail" label="联系人邮箱" normalize={(value) => value.trim()} rules={[required('联系人邮箱'), { type: 'email', message: '请输入正确的联系人邮箱' }]}><Input maxLength={120} /></Form.Item>
          <Form.Item name="contactPhone" label="联系人手机" normalize={(value) => value.trim()} rules={[required('联系人手机'), { pattern: /^1\d{10}$/, message: '请输入11位手机号' }]}><Input maxLength={20} /></Form.Item>
        </div>
      </Form>
    </Card>
    <Card size="small" title="邀请须知">
      <p>邀请提交后，系统通过邮件向联系人发送邀请注册链接，请通知供应商登录协同门户并填写基本信息、证照、联系人及银行信息。</p>
    </Card>
    <div className="pc-register-actions"><Button onClick={() => leave(onBack)}>取消</Button>
      <Button htmlType="submit" form="pc-invitation-form" type="primary">{record ? '重新邀请' : '提交邀请'}</Button></div>
  </div>;
}
