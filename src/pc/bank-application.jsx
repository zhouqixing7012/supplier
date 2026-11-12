import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Select } from 'antd-pc';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { PcModal } from '../erp/components.jsx';
import ApplicationAttachment from './AttachmentField.jsx';
import { bankApplicationFields, bankApplicationNotice, bankApplicationRequired } from '../pages/bank-application.js';

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });

export function BankApplicationPage({ currentUser, department, application, onSave, onBack, leaveRef, view = 'notice', onViewChange }) {
  const [form] = Form.useForm();
  const [date, setDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const { modal } = App.useApp();
  const editing = view === 'form';
  const leave = (afterLeave) => {
    if (saving.current) return;
    if (!editing || !Object.values(form.getFieldsValue()).some(Boolean)) {
      afterLeave();
      return;
    }
    modal.confirm({
      centered: true, className: 'pc-confirm', title: '放弃本次申请？', content: '本次填写的信息尚未提交。',
      okText: '放弃修改', cancelText: '继续填写', onOk: afterLeave,
    });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));

  useEffect(() => {
    if (view === 'result' && !application) onViewChange('notice', { replace: true });
  }, [view, application, onViewChange]);

  const submit = async (values) => {
    if (saving.current) return;
    saving.current = true;
    setSubmitting(true);
    setError('');
    try {
      await onSave({ ...values, date, applicant: currentUser, department });
      onViewChange('result', { replace: true });
    } catch (reason) {
      setError(reason?.message || '申请未能保存，请重试。');
    } finally {
      saving.current = false;
      setSubmitting(false);
    }
  };

  if (view === 'notice' || (view === 'result' && !application)) return (
    <PcModal open title="申请须知" width={480} okText="确认申请" cancelText="取消"
      onCancel={onBack} onOk={() => {
        setDate(today());
        setError('');
        onViewChange('form', { replace: true });
      }}>
      <p>{bankApplicationNotice}</p>
      {application && <Button type="link" onClick={() => onViewChange('result', { replace: true })}>查看本次申请</Button>}
    </PcModal>
  );

  return <div className="pc-page-stack pc-register">
    {!editing && <Alert type="info" showIcon title="申请信息已暂存" />}
    <Card size="small" title="申请信息">
      <DetailGrid className="pc-detail-grid">
        <DetailItem label="申请人员">{editing ? currentUser : application.applicant}</DetailItem>
        <DetailItem label="人员部门">{editing ? department : application.department}</DetailItem>
        <DetailItem label="申请日期">{editing ? date : application.date}</DetailItem>
      </DetailGrid>
    </Card>
    <Card size="small" title="银行信息">
      {editing ? <Form form={form} name="bank-application" clearOnDestroy layout="horizontal" className="pc-register-form"
        disabled={submitting} scrollToFirstError={{ block: 'center', focus: true }} onFinish={submit}>
        <div className="pc-register-grid">
          {bankApplicationFields.map((field) => <Form.Item key={field.key} name={field.key} label={field.label}
            className={field.multiline ? 'pc-register-wide' : undefined}
            rules={[{ required: true, whitespace: true, message: bankApplicationRequired(field) }]}>
            {field.options ? <Select options={field.options.map((value) => ({ value }))} />
              : field.multiline ? <Input.TextArea maxLength={field.maxLength} rows={3} showCount />
              : <Input maxLength={field.maxLength} placeholder={field.placeholder} />}
          </Form.Item>)}
          <Form.Item name="attachment" label="附件"><ApplicationAttachment /></Form.Item>
        </div>
        {error && <Alert type="error" showIcon title={error} />}
      </Form> : <DetailGrid className="pc-detail-grid" columns={2} labelWidth={144}>
        {bankApplicationFields.map(({ key, label, multiline }) => <DetailItem key={key} label={label} span={multiline ? 2 : 1}>
          {application[key] || '—'}
        </DetailItem>)}
        <DetailItem label="附件"><ApplicationAttachment value={application.attachment} readOnly /></DetailItem>
      </DetailGrid>}
    </Card>
    <div className="pc-register-actions">
      <Button disabled={submitting} onClick={() => leave(onBack)}>{editing ? '取消' : '返回'}</Button>
      {editing && <Button type="primary" loading={submitting} onClick={() => form.submit()}>提交</Button>}
    </div>
  </div>;
}
