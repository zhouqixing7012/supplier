import React, { useImperativeHandle, useState } from 'react';
import { App, Button, Card, Form, Input, Select, Space, Steps, Upload } from 'antd-pc';
import { Plus } from 'lucide-react';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { PcModal, PcTable } from '../erp/components.jsx';
import { bankError, blankBank, fieldsFor } from '../pages/mobile-forms.jsx';
import { bankDirectory, branches, supplierTypes } from '../pages/mobile-data.js';

const contactFields = [['name', '姓名', true], ['phone', '电话', true], ['gender', '性别', false, ['男', '女']], ['email', '邮箱', true, 'email'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注', false, 'textarea']];
const qualificationFields = [['name', '资质名称', true], ['level', '资质等级'], ['number', '资质编号'], ['issuer', '颁发单位'], ['start', '有效开始日期', false, 'date'], ['end', '有效结束日期', false, 'date'], ['attachment', '附件', false, 'file']];
const bankFields = [['accountType', '账户类型', true, ['基本账户', '一般账户']], ['bank', '开户银行', true], ['branch', '银行分行', true], ['country', '开户行所在国家/地区', true], ['province', '开户所在省'], ['city', '开户所在市'], ['name', '账户名称', true], ['number', '银行账号', true], ['currency', '币种', true, ['人民币', '美元', '港币']], ['proof', '开户证明', false, 'file'], ['note', '备注', false, 'textarea']];
const profileFields = (type) => [...fieldsFor(type), ['registerEmail', '注册邮箱', true, 'email'], ['proof', '证照附件', false, 'file']];
const valueText = (value) => value?.name || value?.detail || value || '—';

function FileField({ value, onChange, id }) {
  return <Space wrap><Upload beforeUpload={(file) => { onChange(file.name); return false; }} showUploadList={false} maxCount={1}>
    <Button id={id} icon={<Plus size={14} />}>选择附件</Button>
  </Upload>{value && <span>{value} <Button type="link" size="small" onClick={() => onChange('')}>移除</Button></span>}</Space>;
}

export function RecordFields({ fields, value, columns = 3 }) {
  return <DetailGrid columns={columns} className="pc-detail-grid">{fields.map(([key, label, , control]) =>
    <DetailItem key={key} label={label} span={control === 'textarea' ? 3 : undefined}>{valueText(value[key])}</DetailItem>
  )}</DetailGrid>;
}

function FormFields({ fields }) {
  return fields.map(([key, label, required, control]) => <Form.Item key={key} name={key} label={label}
    className={['file', 'textarea'].includes(control) ? 'pc-register-wide' : undefined}
    rules={[{ required: !!required, message: '请填写' + label }, ...(control === 'email' ? [{ type: 'email', message: '请输入正确的邮箱格式' }] : [])]}>
    {Array.isArray(control) ? <Select showSearch options={control.map((value) => ({ value }))} />
      : control === 'file' ? <FileField />
      : control === 'textarea' ? <Input.TextArea rows={3} />
      : <Input type={control === 'date' ? 'date' : undefined} maxLength={key === 'number' ? 50 : undefined} />}
  </Form.Item>);
}

export function RecordTable({ fields, records, onEdit, onRemove, canRemove, numbered = false }) {
  const columns = fields.map(([dataIndex, title]) => ({ dataIndex, title, width: 132, render: valueText }));
  if (numbered) columns.unshift({ title: '序号', width: 60, align: 'center', render: (_, row, index) => index + 1 });
  if (onEdit) columns.push({ key: 'actions', title: '操作', width: 100, fixed: 'right', render: (_, row, index) =>
    <Space size={4}><Button size="small" type="link" onClick={() => onEdit(index)}>编辑</Button>{(!canRemove || canRemove(row)) && <Button size="small" type="link" danger onClick={() => onRemove(index)}>删除</Button>}</Space> });
  return <PcTable rowKey={(row) => row.id || row.rowKey} columns={columns} dataSource={records.map((row, index) => ({ ...row, rowKey: index }))} pagination={false} scroll={{ x: 'max-content' }} />;
}

function CollectionModal({ bank, qualification, company, entry, onCancel, onSave }) {
  const [form] = Form.useForm();
  const bankName = Form.useWatch('bank', form);
  const { message } = App.useApp();
  const fields = bank ? bankFields.filter(([key]) => key !== 'accountType' || company).map((field) => {
    const [key, label, required] = field;
    if (key === 'bank') return [key, label, required, [...new Set(branches.map((item) => item.bank))]];
    return field;
  }) : qualification ? qualificationFields : contactFields;
  const location = new Set(['branch', 'country', 'province', 'city']);
  const branchOptions = branches.filter((item) => item.bank === bankName);
  return <PcModal open title={(entry ? '编辑' : '添加') + (bank ? '银行' : qualification ? '资质' : '联系人')} width={720}
    onCancel={onCancel} onOk={() => form.submit()} okText="保存" cancelText="取消">
    <Form form={form} initialValues={entry || (bank ? blankBank('') : {})} layout="horizontal" className="pc-register-form" onValuesChange={(changed) => {
      if (bank && Object.hasOwn(changed, 'bank')) form.setFieldsValue({ branch: '', country: bankDirectory.find((item) => item.name === changed.bank)?.country || '', province: '', city: '' });
    }} onFinish={(value) => {
      const error = bank && bankError(value, company);
      if (error) return message.error(error);
      onSave({ ...entry, ...value, id: entry?.id || crypto.randomUUID() });
    }}>
      <div className="pc-register-grid">
        <FormFields fields={bank ? fields.filter(([key]) => !location.has(key)) : fields} />
        {bank && <>
          <Form.Item name="branch" label="银行分行" rules={[{ required: true, message: '请选择银行分行' }]}>
            <Select showSearch disabled={!bankName} options={branchOptions.map((item) => ({ value: item.name }))}
              onChange={(value) => {
                const item = branchOptions.find((option) => option.name === value);
                form.setFieldsValue({ country: item.country, province: item.province, city: item.city });
              }} />
          </Form.Item>
          <Form.Item name="country" label="开户行所在国家/地区"><Input readOnly /></Form.Item>
          <Form.Item name="province" label="开户所在省"><Input readOnly /></Form.Item>
          <Form.Item name="city" label="开户所在市"><Input readOnly /></Form.Item>
        </>}
      </div>
    </Form>
  </PcModal>;
}

export function RecordCollectionEditor({ bank = false, qualification = false, type, records, onChange }) {
  const [index, setIndex] = useState(null);
  const { modal } = App.useApp();
  return <Card size="small" title={bank ? '银行信息' : qualification ? '资质信息（选填）' : '联系人信息'} extra={<Button onClick={() => setIndex(records.length)} icon={<Plus size={14} />}>{bank ? '添加银行' : qualification ? '添加资质' : '添加联系人'}</Button>}>
    <RecordTable fields={(bank ? bankFields : qualification ? qualificationFields : contactFields).filter(([key]) => key !== 'accountType' || type === supplierTypes[0])}
      records={records} onEdit={setIndex} canRemove={(row) => !bank || type !== supplierTypes[0] || row.accountType !== '基本账户'} onRemove={(position) => modal.confirm({
        centered: true, className: 'pc-confirm', title: '删除此条资料？', okText: '删除', cancelText: '取消',
        okButtonProps: { danger: true }, onOk: () => onChange(records.filter((_, i) => i !== position)),
      })} />
    {index !== null && <CollectionModal bank={bank} qualification={qualification} company={type === supplierTypes[0]} entry={records[index]} onCancel={() => setIndex(null)}
      onSave={(entry) => { const next = [...records]; next[index] = entry; onChange(next); setIndex(null); }} />}
  </Card>;
}

export function SupplierSnapshot({ profile, section, approval = false }) {
  const basicFields = approval ? [
    ['type', '供应商类型'],
    ...([supplierTypes[0], supplierTypes[3]].includes(profile.type) ? [['proof', profile.type === supplierTypes[0] ? '营业执照' : '证书']] : []),
    ...fieldsFor(profile.type),
  ] : profileFields(profile.type);
  const qualifications = profile.basic.qualifications || [];
  return <div className="pc-page-stack">
    {(!section || section === 'basic') && <Card size="small" title={approval ? "供应商信息" : "基本信息"}><RecordFields columns={approval ? 2 : 3} fields={basicFields} value={{ ...profile.basic, type: profile.type }} /></Card>}
    {(!section || section === 'basic' || section === 'collections') && (approval || qualifications.length > 0) && <Card size="small" title={approval ? "资质信息（选填）" : "资质信息"}>
      <RecordTable fields={qualificationFields} records={qualifications} numbered={approval} />
    </Card>}
    {(!section || section === 'contacts' || section === 'collections') && profile.type !== supplierTypes[1] && <Card size="small" title="联系人信息"><RecordTable fields={approval ? contactFields.filter(([key]) => key !== 'gender') : contactFields} records={profile.contacts || []} numbered={approval} /></Card>}
    {(!section || section === 'banks' || section === 'collections') && <Card size="small" title="银行信息"><RecordTable fields={bankFields} records={profile.banks || []} numbered={approval} /></Card>}
  </div>;
}

export function SupplierProfileEditor({ profile, initialStep = 0, onCancel, onSubmit, leaveRef }) {
  const [original] = useState(profile);
  const [draft, setDraft] = useState(original);
  const [step, setStep] = useState(initialStep);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();
  const personal = profile.type === supplierTypes[1];
  const leave = (afterLeave) => {
    const values = step === 0 && form.isFieldsTouched() ? { ...draft, basic: { ...draft.basic, ...form.getFieldsValue() } } : draft;
    if (JSON.stringify(values) === JSON.stringify(original)) return afterLeave();
    modal.confirm({ centered: true, className: 'pc-confirm', title: '放弃本次修改？', content: '本次编辑中已暂存的联系人、银行及附件修改将一并放弃。', okText: '放弃修改', cancelText: '继续编辑', onOk: afterLeave });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));
  const steps = [0, ...(!personal ? [1] : []), 2, 3];
  const next = () => setStep(steps[steps.indexOf(step) + 1]);
  const previous = () => setStep(steps[steps.indexOf(step) - 1]);
  const changeCollection = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (JSON.stringify(draft) === JSON.stringify(original)) return message.warning('请先修改供应商资料');
    const missing = profileFields(profile.type).find(([key, , required]) => required && !draft.basic[key]);
    if (missing) { setStep(0); return message.error('请填写' + missing[1]); }
    if (!personal && draft.contacts.some((contact) => !contact.name?.trim() || !contact.phone?.trim() || !contact.email?.trim())) {
      setStep(1); return message.error('请补齐联系人姓名、电话及邮箱');
    }
    const error = draft.banks.map((bank) => bankError(bank, profile.type === supplierTypes[0])).find(Boolean);
    if (error) { setStep(2); return message.error(error); }
    if (profile.type === supplierTypes[0] && draft.banks.filter((bank) => bank.accountType === '基本账户').length !== 1) {
      setStep(2);
      return message.error('企业供应商有效银行账户必须且只能有一个基本账户');
    }
    onSubmit(draft);
  };
  return <div className="pc-page-stack pc-register">
    <Card size="small"><Steps current={steps.indexOf(step)} size="small" items={steps.map((id) => ({ title: ['基本信息', '联系人信息', '银行信息', '预览提交'][id] }))} /></Card>
    {step === 0 && <Card size="small" title="基本信息"><Form form={form} className="pc-register-form" initialValues={draft.basic} onFinish={(basic) => { setDraft((current) => ({ ...current, basic: { ...current.basic, ...basic } })); next(); }}>
      <div className="pc-register-grid"><FormFields fields={profileFields(profile.type)} /></div>
      <div className="pc-workflow-actions"><Space><Button onClick={() => leave(onCancel)}>取消</Button><Button type="primary" htmlType="submit">下一步</Button></Space></div>
    </Form></Card>}
    {step === 0 && <RecordCollectionEditor qualification type={profile.type} records={draft.basic.qualifications || []}
      onChange={(qualifications) => setDraft((current) => ({ ...current, basic: { ...current.basic, qualifications } }))} />}
    {step === 1 && <RecordCollectionEditor key="contacts" type={profile.type} records={draft.contacts} onChange={(value) => changeCollection('contacts', value)} />}
    {step === 2 && <RecordCollectionEditor key="banks" bank type={profile.type} records={draft.banks} onChange={(value) => changeCollection('banks', value)} />}
    {step === 3 && <SupplierSnapshot profile={draft} />}
    {step !== 0 && <div className="pc-workflow-actions"><Space><Button onClick={() => leave(onCancel)}>取消</Button><Button onClick={previous}>上一步</Button><Button type="primary" onClick={step === 3 ? submit : next}>{step === 3 ? '提交变更' : '下一步'}</Button></Space></div>}
  </div>;
}
