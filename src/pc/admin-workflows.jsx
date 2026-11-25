import React, { useState } from 'react';
import { App, Button, Card, Form, Input, Select } from 'antd-pc';
import { PcModal, PcTable } from '../erp/components.jsx';
import { people, supplierTypes } from '../pages/mobile-data.js';
import { pcPermissionGroups } from './permission-options.js';

const options = (values) => values.map((value) => ({ value }));
const departments = [...new Set(people.map((person) => person.department).filter(Boolean))];
export const demoCompanies = ['演示采购公司', '演示付款公司'];
const demoEntities = ['演示业务实体'];

export function QuickSupplierModal({ onCancel, onSave }) {
  const [form] = Form.useForm();
  const [permissions, setPermissions] = useState([]);
  const [adding, setAdding] = useState(false);
  const columns = [
    { title: '所属权限', dataIndex: 'group' },
    { title: '权限分类', dataIndex: 'category' },
    { title: '备注', dataIndex: 'note' },
    { title: '操作', width: 72, render: (_, row) => <Button size="small" type="link" danger onClick={() => setPermissions(permissions.filter((item) => item.id !== row.id))}>移除</Button> },
  ];
  return <PcModal open title="快速创建供应商" width={800} okText="创建" cancelText="取消" onCancel={onCancel} onOk={() => form.submit()}>
    <Form form={form} layout="horizontal" className="pc-register-form" onFinish={(values) => onSave({ ...values, permissions })}>
      <div className="pc-register-grid">
        <Form.Item name="name" label="供应商名称" rules={[{ required: true, whitespace: true }]}><Input maxLength={120} /></Form.Item>
        <Form.Item name="type" label="供应商类型" rules={[{ required: true }]}><Select options={supplierTypes.map((value) => ({ value, label: value === supplierTypes[2] ? '政府机构或社团' : value }))} /></Form.Item>
        <Form.Item name="address" label="地址" rules={[{ required: true }]}><Select options={options(['待定', 'ACC'])} /></Form.Item>
        <Form.Item name="code" label="统一社会信用代码或证件号码" rules={[{ required: true, whitespace: true }]}><Input maxLength={50} /></Form.Item>
        <Form.Item name="department" label="所属部门" rules={[{ required: true }]}><Select showSearch options={options(departments)} /></Form.Item>
        <Form.Item name="company" label="付款公司" rules={[{ required: true }]}><Select options={options(demoCompanies)} /></Form.Item>
        <Form.Item name="entity" label="业务实体"><Select allowClear options={options(demoEntities)} /></Form.Item>
        <Form.Item name="liabilityAccount" label="负债"><Input /></Form.Item>
        <Form.Item name="prepayAccount" label="预付款"><Input /></Form.Item>
      </div>
    </Form>
    <Card size="small" title="分配权限" extra={<Button onClick={() => setAdding(true)}>添加权限</Button>}>
      <PcTable rowKey="id" pagination={false} dataSource={permissions} columns={columns} />
    </Card>
    {adding && <PermissionModal existing={permissions} onCancel={() => setAdding(false)} onSave={(permission) => {
      setPermissions([...permissions, permission]);
      setAdding(false);
    }} />}
  </PcModal>;
}

export function PermissionModal({ initial, existing, onCancel, onSave }) {
  const [form] = Form.useForm();
  const group = Form.useWatch('group', form);
  const { message } = App.useApp();
  return <PcModal open title={initial ? '修改权限' : '添加权限'} width={560} onCancel={onCancel} onOk={() => form.submit()} okText="保存" cancelText="取消">
    <Form form={form} initialValues={initial} layout="vertical" onFinish={(values) => {
      if (existing.some((row) => row.id !== initial?.id && row.group === values.group && row.category === values.category)) {
        return message.error('该权限分类已存在');
      }
      onSave({ ...initial, ...values, id: initial?.id || crypto.randomUUID() });
    }}>
      <Form.Item name="group" label="所属权限" rules={[{ required: true }]}><Select options={options(Object.keys(pcPermissionGroups))}
        onChange={() => form.setFieldValue('category', undefined)} /></Form.Item>
      <Form.Item name="category" label="权限分类" rules={[{ required: true }]}><Select showSearch options={options(pcPermissionGroups[group] || [])} /></Form.Item>
      <Form.Item name="note" label="备注"><Input.TextArea maxLength={100} rows={3} /></Form.Item>
    </Form>
  </PcModal>;
}
