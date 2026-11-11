import React, { useState } from 'react';
import { App, Button, Card, DatePicker, Form, Input, Select, Space, Steps, Tabs, Typography, Upload } from 'antd-pc';
import { RecordCollectionEditor, RecordFields, SupplierSnapshot } from '../pc/record-editor.jsx';
import { bankError } from './mobile-forms.jsx';
import { supplierTypes } from './mobile-data.js';
import { Plus } from 'lucide-react';
import './supplier-register.css';

const REGISTER_EMAIL_TIP = '用于供应商登录协同门户及修改密码时接收验证码';

const TYPE_OPTIONS = [
  { value: 'company', label: '企业供应商' },
  { value: 'personal', label: '个人供应商' },
  { value: 'government', label: '政府机构或社团' },
  { value: 'foreign', label: '国外供应商' },
];

const FOUR_STEPS = [
  { title: '基本信息', description: '营业执照、证书、合作内容等' },
  { title: '联系人信息', description: '供应商联系人电话及邮箱等' },
  { title: '银行信息', description: '银行账号、开户证明等' },
  { title: '预览提交' },
];

const PERSONAL_STEPS = [
  { title: '基本信息', description: '证件、联系方式、合作内容等' },
  { title: '银行信息', description: '银行账号、开户证明等' },
  { title: '预览提交' },
];

const COMMON = {
  registerEmail: {
    key: 'registerEmail',
    label: '供应商注册邮箱',
    required: true,
    type: 'email',
    placeholder: '请输入供应商注册邮箱',
    tooltip: REGISTER_EMAIL_TIP,
  },
  countryDomestic: {
    key: 'country',
    label: '国家',
    required: true,
    type: 'select',
    placeholder: '请选择国家',
    defaultValue: 'domestic',
    options: [
      { value: 'domestic', label: '国内' },
      { value: 'foreign', label: '国外' },
    ],
  },
  address: {
    key: 'address',
    label: '注册地址',
    required: true,
    type: 'address',
  },
};

const PAGE_CONFIG = {
  company: {
    label: '企业供应商',
    steps: FOUR_STEPS,
    upload: {
      label: '营业执照',
      required: true,
    },
    fields: [
      { key: 'supplierName', label: '供应商名称', required: true, placeholder: '请输入供应商名称' },
      COMMON.registerEmail,
      { key: 'creditCode', label: '统一社会信用代码', required: true, placeholder: '请输入统一社会信用代码' },
      { key: 'establishedAt', label: '成立日期', required: true, type: 'date' },
      { key: 'licenseUntil', label: '证件有效期至', required: true, type: 'date' },
      { key: 'legalRepresentative', label: '法人代表', required: true, placeholder: '请输入法人代表' },
      { key: 'companyPhone', label: '公司电话', placeholder: '请输入公司电话' },
      {
        key: 'companyType', label: '企业类型', required: true, type: 'select', placeholder: '请选择企业类型',
        options: [{ value: 'limited', label: '有限责任公司' }, { value: 'joint', label: '股份有限公司' }],
      },
      {
        key: 'industry', label: '所属行业', required: true, type: 'select', placeholder: '请选择所属行业',
        options: [{ value: 'it', label: '信息技术服务业' }, { value: 'media', label: '文化传媒业' }],
      },
      { key: 'capital', label: '注册资金', required: true, placeholder: '请输入注册资金' },
      {
        key: 'currency', label: '注册币种', required: true, type: 'select', placeholder: '请选择注册币种',
        options: [{ value: 'cny', label: '人民币' }, { value: 'usd', label: '美元' }, { value: 'eur', label: '欧元' }],
      },
      COMMON.countryDomestic,
      COMMON.address,
      { key: 'invoiceAddress', label: '接收发票地址', placeholder: '请输入接收发票地址' },
      { key: 'website', label: '公司网址', placeholder: '请输入公司网址' },
      {
        key: 'taxpayer', label: '纳税人资格', type: 'select', placeholder: '请选择纳税人资格',
        options: [{ value: 'general', label: '一般纳税人' }, { value: 'small', label: '小规模纳税人' }],
      },
      { key: 'businessScope', label: '经营范围', required: true, type: 'textarea', placeholder: '请输入经营范围', maxLength: 4000, full: true },
    ],
  },
  personal: {
    label: '个人供应商',
    steps: PERSONAL_STEPS,
    fields: [
      {
        key: 'certificateType', label: '证件类型', required: true, type: 'select', placeholder: '请选择证件类型', full: true,
        options: [{ value: 'id', label: '身份证' }, { value: 'passport', label: '护照' }],
      },
      { key: 'name', label: '姓名', required: true, placeholder: '请输入姓名' },
      COMMON.registerEmail,
      {
        key: 'gender', label: '性别', required: true, type: 'select', placeholder: '请选择性别',
        options: [{ value: 'male', label: '男' }, { value: 'female', label: '女' }],
      },
      { key: 'certificateNumber', label: '证件号码', required: true, placeholder: '请输入证件号码' },
      { key: 'certificateStart', label: '证件有效起始日期', required: true, type: 'date' },
      { key: 'certificateEnd', label: '证件有效截止日期', required: true, type: 'date' },
      COMMON.countryDomestic,
      COMMON.address,
      { key: 'email', label: '邮箱', required: true, type: 'email', placeholder: '请输入邮箱' },
      { key: 'mobile', label: '手机', required: true, placeholder: '请输入手机' },
      { key: 'qq', label: 'QQ', placeholder: '请输入QQ' },
      { key: 'wechat', label: '微信', placeholder: '请输入微信' },
      { key: 'cooperation', label: '与搜狐合作事项', required: true, type: 'textarea', placeholder: '请输入与搜狐合作事项', maxLength: 500, full: true },
      { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注', maxLength: 500, full: true },
    ],
  },
  government: {
    label: '政府机构或社团',
    steps: FOUR_STEPS,
    fields: [
      { key: 'supplierName', label: '供应商名称', required: true, placeholder: '请输入供应商名称' },
      COMMON.registerEmail,
      COMMON.countryDomestic,
      COMMON.address,
      { key: 'cooperation', label: '与搜狐合作事项', required: true, type: 'textarea', placeholder: '请输入与搜狐合作事项', maxLength: 500, full: true },
      { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注', maxLength: 500, full: true },
    ],
  },
  foreign: {
    label: '国外供应商',
    steps: FOUR_STEPS,
    upload: { label: '证书', required: true },
    fields: [
      { key: 'supplierName', label: '供应商名称', required: true, placeholder: '请输入供应商名称' },
      COMMON.registerEmail,
      { key: 'certificateNumber', label: '证件号码', required: true, placeholder: '请输入证件号码' },
      { key: 'establishedAt', label: '成立日期', required: true, type: 'date' },
      { key: 'licenseUntil', label: '证件有效期至', required: true, type: 'date' },
      { key: 'legalRepresentative', label: '法人代表', required: true, placeholder: '请输入法人代表' },
      { key: 'companyPhone', label: '公司电话', placeholder: '请输入公司电话' },
      { key: 'capital', label: '注册资金', required: true, placeholder: '请输入注册资金' },
      {
        key: 'currency', label: '注册币种', required: true, type: 'select', placeholder: '请选择注册币种',
        options: [{ value: 'usd', label: '美元' }, { value: 'eur', label: '欧元' }, { value: 'cny', label: '人民币' }],
      },
      {
        key: 'country', label: '国家', required: true, type: 'select', placeholder: '请选择国家', defaultValue: 'foreign',
        options: [{ value: 'foreign', label: '国外' }, { value: 'domestic', label: '国内' }],
      },
      { key: 'address', label: '注册地址', required: true, placeholder: '请输入注册地址' },
      { key: 'cooperation', label: '与搜狐合作事项', required: true, type: 'textarea', placeholder: '请输入与搜狐合作事项', maxLength: 500, full: true },
      { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注', maxLength: 500, full: true },
    ],
  },
};

function fieldRules(field) {
  const rules = [];
  if (field.type === 'address' && field.required) {
    return [{ required: true, validator: (_, value) => value?.detail?.trim()
      ? Promise.resolve()
      : Promise.reject(new Error(`请输入${field.label}`)) }];
  }
  if (field.required) rules.push({ required: true, message: `请${field.type === 'select' || field.type === 'date' ? '选择' : '输入'}${field.label}` });
  if (field.type === 'email') rules.push({ type: 'email', message: '请输入正确的邮箱格式' });
  return rules;
}

function FieldControl({ field, value, onChange, ...controlProps }) {
  const props = { ...controlProps, value, onChange };

  if (field.type === 'select') {
    return <Select {...props} placeholder={field.placeholder} options={field.options || []} />;
  }

  if (field.type === 'date') {
    return <DatePicker {...props} placeholder={`请选择${field.label}`} />;
  }

  if (field.type === 'textarea') {
    return <Input.TextArea {...props} rows={3} placeholder={field.placeholder} maxLength={field.maxLength} showCount />;
  }

  if (field.type === 'address') {
    const address = value || {};
    return (
      <Space.Compact block>
        <Select
          className="pc-register-region"
          aria-label="地区"
          value={address.region}
          placeholder="请选择地区"
          options={[
            { value: 'haidian', label: '北京市 / 北京市 / 海淀区' },
            { value: 'chaoyang', label: '北京市 / 北京市 / 朝阳区' },
          ]}
          onChange={(region) => onChange?.({ ...address, region })}
        />
        <Input {...controlProps} value={address.detail || ''} placeholder="请输入详细地址" maxLength={50}
          onChange={(event) => onChange?.({ ...address, detail: event.target.value })} />
      </Space.Compact>
    );
  }

  return <Input {...props} type={field.type === 'email' ? 'email' : 'text'} placeholder={field.placeholder} />;
}

function UploadField({ upload, file, setFile }) {
  return (
    <Form.Item label={upload.label} required={upload.required} className="pc-register-wide">
      <Space orientation="vertical" size={4}>
        <Upload beforeUpload={() => false} fileList={file} onChange={({ fileList }) => setFile(fileList)} maxCount={1} accept=".jpg,.jpeg,.png,.pdf">
          <Button icon={<Plus size={14} />}>上传{upload.label}</Button>
        </Upload>
        {upload.note && <Typography.Text type="danger">{upload.note}</Typography.Text>}
        <Typography.Text type="secondary">支持 JPG、PNG、PDF 文件</Typography.Text>
      </Space>
    </Form.Item>
  );
}

export function registerTypeFromHash(path) {
  const type = path.split('/').at(-1);
  return Object.hasOwn(PAGE_CONFIG, type) ? type : 'company';
}

export function SupplierRegisterPage({ initialType = 'company', onBack, onSubmit }) {
  const [type, setType] = useState(initialType);
  const [step, setStep] = useState(0);
  const [basic, setBasic] = useState({});
  const [file, setFile] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const { message } = App.useApp();
  const config = PAGE_CONFIG[type];
  const tabItems = TYPE_OPTIONS.map(({ value, label }) => ({ key: value, label }));
  const title = config.steps[step].title;
  const supplierType = supplierTypes[TYPE_OPTIONS.findIndex((option) => option.value === type)];
  const preview = Object.fromEntries(config.fields.map((field) => {
    const value = basic[field.key];
    const label = field.options?.find((item) => item.value === value)?.label;
    return [field.key, label || (value?.format ? value.format('YYYY-MM-DD') : value?.detail || value)];
  }));
  const next = () => {
    if (title === '银行信息') {
      if (!banks.length) return message.error('请至少添加一条有效银行账户');
      const error = banks.map((bank) => bankError(bank, type === 'company')).find(Boolean);
      if (error) return message.error(error);
      if (type === 'company' && banks.filter((bank) => bank.accountType === '基本账户').length !== 1) {
        return message.error('企业供应商有效银行账户必须且只能有一个基本账户');
      }
    }
    setStep(step + 1);
  };
  const back = () => step > 0 ? setStep(step - 1) : onBack();
  const changeType = (value) => {
    setType(value);
    setStep(0);
    setBasic({});
    setFile([]);
    setContacts([]);
    setBanks([]);
    setQualifications([]);
  };

  return (
    <div className="pc-page-stack pc-register">
      <Card size="small" className="pc-detail-tabs-card">
        <Tabs activeKey={type} items={tabItems.map((item) => ({ ...item, disabled: step > 0 }))} onChange={changeType} className="pc-detail-tabs" />
        <Steps current={step} items={config.steps} responsive size="small" />
      </Card>
      {step === 0 && <Card size="small" title="基本信息">
        <Form key={type} id="pc-supplier-registration" className="pc-register-form" layout="horizontal" labelAlign="right" initialValues={basic}
          onFinish={(value) => {
            if (config.upload?.required && !file.length) return message.error('请上传' + config.upload.label);
            setBasic(value);
            next();
          }}>
          <div className="pc-register-grid">
            {config.upload && <UploadField upload={config.upload} file={file} setFile={setFile} />}
            {config.fields.map((field) => (
              <Form.Item
                key={field.key}
                className={field.full ? 'pc-register-wide' : undefined}
                name={field.key}
                label={field.label}
                tooltip={field.tooltip}
                rules={fieldRules(field)}
                initialValue={field.defaultValue}
              >
                <FieldControl field={field} />
              </Form.Item>
            ))}
          </div>
        </Form>
      </Card>}
      {step === 0 && <RecordCollectionEditor qualification type={supplierType} records={qualifications} onChange={setQualifications} />}
      {title === '联系人信息' && <RecordCollectionEditor type={supplierType} records={contacts} onChange={setContacts} />}
      {title === '银行信息' && <RecordCollectionEditor bank type={supplierType} records={banks} onChange={setBanks} />}
      {title === '预览提交' && <>
        <Card size="small" title="基本信息"><RecordFields fields={config.fields.map(({ key, label }) => [key, label])} value={preview} /></Card>
        <SupplierSnapshot profile={{ type: supplierType, basic: { ...preview, qualifications }, contacts, banks }} section="collections" />
      </>}
      <div className="pc-register-actions">
        <Button onClick={back}>{step === 0 ? '返回' : '上一步'}</Button>
        {step === 0 ? <Button type="primary" htmlType="submit" form="pc-supplier-registration">下一步</Button> : title === '预览提交' ? <Button type="primary" onClick={() => onSubmit({
          type: supplierType, basic: {
            ...preview,
            supplierName: preview.supplierName || preview.name,
            creditCode: preview.creditCode || preview.certificateNumber,
            establishedAt: preview.establishedAt || preview.certificateStart,
            licenseUntil: preview.licenseUntil || preview.certificateEnd,
            proof: file[0]?.name,
            qualifications,
          },
          contacts, banks,
        })}>提交</Button> : <Button type="primary" onClick={next}>下一步</Button>}
      </div>
    </div>
  );
}
