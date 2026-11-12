import React, { useImperativeHandle, useState } from 'react';
import { App, Button, Card, Cascader, DatePicker, Form, Input, Select, Space, Steps, Typography, Upload } from 'antd-pc';
import { RecordCollectionEditor, RecordFields, SupplierSnapshot } from '../pc/record-editor.jsx';
import CertificateExpiry, { certificateExpiryRules, DATE_FORMAT, LONG_TERM } from '../pc/CertificateExpiry.jsx';
import { bankError, fieldsFor } from './mobile-forms.jsx';
import dayjs from 'dayjs';
import { registrationEmailError, validEmail } from './mobile-edit-rules.js';
import { supplierTypes } from './mobile-data.js';
import { regionData } from './registration-regions.js';
import { Plus } from 'lucide-react';
import './supplier-register.css';

const REGISTER_EMAIL_TIP = '用于供应商登录协同门户及修改密码时接收验证码';
const LICENSE_HELP = '上传清晰的pdf、png、jpg、gif、jpc、bmp等格式图片，大小限制50M';
const LICENSE_SIZE_LIMIT = 50 * 1024 * 1024;

const regionOptions = Object.entries(regionData).map(([province, cities]) => ({
  value: province,
  label: province,
  children: Object.entries(cities).map(([city, districts]) => ({
    value: city,
    label: city,
    children: districts.map((district) => ({ value: district, label: district })),
  })),
}));

function readRegistrationAddress(value) {
  const [region, ...detail] = typeof value === 'string' ? value.split(' ') : [];
  const savedRegion = typeof value === 'string' ? region : value?.region;
  const legacyDistrict = { haidian: '海淀区', chaoyang: '朝阳区' }[savedRegion];
  let parts = legacyDistrict ? ['北京市', '北京市', legacyDistrict] : (savedRegion || '').split('/');
  if (parts.length === 2 && regionData[parts[0]]?.[parts[0]]) parts = [parts[0], ...parts];
  const [province, city, district] = parts;
  const validRegion = parts.length === 3 && regionData[province]?.[city]?.includes(district);
  return {
    region: validRegion ? parts.join('/') : undefined,
    detail: typeof value === 'string' ? (validRegion ? detail.join(' ') : value) : value?.detail || '',
  };
}

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

const registerEmail = {
  key: 'registerEmail', label: '供应商注册邮箱', required: true, type: 'email',
  placeholder: '请输入供应商注册邮箱', tooltip: REGISTER_EMAIL_TIP,
};
const PAGE_CONFIG = Object.fromEntries(TYPE_OPTIONS.map(({ value, label }, index) => {
  const fields = fieldsFor(supplierTypes[index]).flatMap(([name, fieldLabel, required, kind]) => {
    const aliases = value === 'personal'
      ? { supplierName: 'name', creditCode: 'certificateNumber', establishedAt: 'certificateStart', licenseUntil: 'certificateEnd' }
      : value === 'foreign' ? { creditCode: 'certificateNumber' } : {};
    const type = Array.isArray(kind) ? 'select' : kind;
    const field = {
      key: aliases[name] || name, label: fieldLabel, required, type,
      expiryStartKey: name === 'licenseUntil' ? aliases.establishedAt || 'establishedAt' : undefined,
      placeholder: (type === 'select' ? '请选择' : '请输入') + fieldLabel,
      options: Array.isArray(kind) ? kind.map((option) => ({ value: option, label: option })) : undefined,
      full: kind === 'textarea' || kind === 'address' || name === 'certificateType',
      maxLength: kind === 'textarea' ? 500 : undefined,
    };
    return name === 'supplierName' ? [field, registerEmail] : [field];
  });
  const proofLabel = { company: '营业执照', foreign: '证书' }[value];
  return [value, { label, steps: value === 'personal' ? PERSONAL_STEPS : FOUR_STEPS,
    upload: proofLabel && { label: proofLabel, required: true, businessLicense: value === 'company' }, fields }];
}));

function fieldRules(field) {
  if (field.expiryStartKey) return certificateExpiryRules(field.expiryStartKey);
  const rules = [];
  if (field.type === 'address' && field.required) {
    return [{ required: true, validator: (_, value) => value?.region && value?.detail?.trim()
      ? Promise.resolve()
      : Promise.reject(new Error(value?.region ? '请输入详细地址' : '请选择省 / 市 / 区县')) }];
  }
  if (field.required) rules.push({ required: true, message: `请${field.type === 'select' || field.type === 'date' ? '选择' : '输入'}${field.label}` });
  if (field.type === 'email') rules.push({ validator: (_, value) => {
    const error = field.key === 'registerEmail' ? registrationEmailError(value) : value && !validEmail(value) ? '请输入正确的邮箱格式' : '';
    return error ? Promise.reject(new Error(error)) : Promise.resolve();
  } });
  if (field.key === 'capital') rules.push({ pattern: /^\d+$/, message: '注册资金只支持整数' });
  if (field.key === 'companyPhone') rules.push({ pattern: /^(1\d{10}|\d{3,4}-?\d{8})$/, message: '公司电话须为11位手机号或区号加8位号码' });
  return rules;
}

function FieldControl({ field, value, onChange, ...controlProps }) {
  const props = { ...controlProps, value, onChange };

  if (field.type === 'select') {
    const options = field.options || [];
    const hasLegacyValue = value && !options.some((option) => option.value === value);
    return <Select {...props} showSearch={{ optionFilterProp: 'label' }} placeholder={field.placeholder}
      options={hasLegacyValue ? [...options, { value, label: value }] : options} />;
  }

  if (field.type === 'date') {
    if (field.expiryStartKey) return <CertificateExpiry {...props} />;
    return <DatePicker {...props} classNames={{ popup: { root: 'pc-register-picker-popup' } }} placeholder={`请选择${field.label}`} />;
  }

  if (field.type === 'textarea') {
    return <Input.TextArea {...props} rows={3} placeholder={field.placeholder} maxLength={field.maxLength} showCount />;
  }

  if (field.type === 'address') {
    const address = value || {};
    return (
      <div className="pc-register-address">
        <Cascader
          className="pc-register-region"
          classNames={{ popup: { root: 'pc-register-picker-popup pc-register-region-popup' } }}
          aria-label="省市区"
          value={address.region?.split('/')}
          placeholder="请选择省 / 市 / 区县"
          options={regionOptions}
          displayRender={(labels) => labels.filter((label, index) => label !== labels[index - 1]).join(' / ')}
          showSearch
          onChange={(parts) => onChange?.({ ...address, region: parts?.join('/') || undefined })}
        />
        <Input {...controlProps} aria-label="详细地址" value={address.detail || ''} placeholder="请输入街道、门牌号等详细地址" maxLength={50}
          onChange={(event) => onChange?.({ ...address, detail: event.target.value })} />
      </div>
    );
  }

  return <Input {...props} type={field.type === 'email' ? 'email' : 'text'} placeholder={field.placeholder} />;
}

function UploadField({ upload, file, setFile }) {
  const { message } = App.useApp();
  const validate = (selected) => {
    if (!upload.businessLicense) return false;
    if (!/\.(?:pdf|png|jpe?g|gif|jpc|bmp|webp|tiff?)$/i.test(selected.name) && !selected.type?.startsWith('image/')) {
      message.error('请选择 PDF 或图片格式的营业执照');
      return Upload.LIST_IGNORE;
    }
    if (selected.size > LICENSE_SIZE_LIMIT) {
      message.error('营业执照文件大小不能超过50M');
      return Upload.LIST_IGNORE;
    }
    return false;
  };
  return (
    <Form.Item label={upload.label} required={upload.required} className="pc-register-wide">
      <Space orientation="vertical" size={4}>
        <Upload beforeUpload={validate} fileList={file} onChange={({ fileList }) => setFile(fileList)} maxCount={1}
          accept={upload.businessLicense ? 'image/*,.pdf,.jpc' : '.jpg,.jpeg,.png,.pdf'}>
          <Button icon={<Plus size={14} />}>上传{upload.label}</Button>
        </Upload>
        {upload.businessLicense && <Typography.Text type="danger">请先上传营业执照，企业信息可自动填充</Typography.Text>}
        <Typography.Text type="secondary">{upload.businessLicense ? LICENSE_HELP : '支持 JPG、PNG、PDF 文件'}</Typography.Text>
        {upload.businessLicense && file[0]?.originFileObj && <Typography.Text type="secondary">当前原型未接入证照识别服务，请手动填写企业信息。</Typography.Text>}
      </Space>
    </Form.Item>
  );
}

export function registerTypeFromHash(path) {
  const type = path.split('/').at(-1);
  return Object.hasOwn(PAGE_CONFIG, type) ? type : 'company';
}

function registrationValues(type, basic) {
  const legacyOptions = { domestic: '国内', foreign: '国外', limited: '有限责任公司', joint: '股份有限公司',
    cny: '人民币', usd: '美元', eur: '欧元', id: '身份证', passport: '护照', male: '男', female: '女',
    general: '一般纳税人', small: '小规模纳税人', it: '信息技术服务业', media: '文化传媒业' };
  const aliases = { name: 'supplierName', certificateNumber: 'creditCode', certificateStart: 'establishedAt', certificateEnd: 'licenseUntil' };
  return Object.fromEntries(PAGE_CONFIG[type].fields.flatMap((field) => {
    const value = basic[field.key] ?? basic[aliases[field.key]];
    if (value == null || value === '') return [];
    if (field.type === 'date') {
      if (field.expiryStartKey && value === LONG_TERM) return [[field.key, value]];
      const date = dayjs(value);
      return date.isValid() ? [[field.key, date]] : [];
    }
    if (field.type === 'address') return [[field.key, readRegistrationAddress(basic.addressParts || value)]];
    return [[field.key, field.type === 'select' ? legacyOptions[value] || value : value]];
  }));
}

export function SupplierRegisterPage({ initialType = 'company', profile, onBack, onSubmit, onSaveDraft, leaveRef }) {
  const [type, setType] = useState(() => TYPE_OPTIONS[supplierTypes.indexOf(profile?.type)]?.value || initialType);
  const [step, setStep] = useState(0);
  const [basic, setBasic] = useState(() => registrationValues(type, profile?.basic || {}));
  const [file, setFile] = useState(() => profile?.basic.proof ? [{ uid: 'saved-proof', name: profile.basic.proof }] : []);
  const [contacts, setContacts] = useState(() => profile?.contacts || []);
  const [banks, setBanks] = useState(() => profile?.banks || []);
  const [qualifications, setQualifications] = useState(() => profile?.basic.qualifications || []);
  const [basicEdited, setBasicEdited] = useState(false);
  const { message, modal } = App.useApp();
  const leave = (action) => {
    if (!basicEdited) return action();
    modal.confirm({ centered: true, className: 'pc-confirm', title: '放弃未保存的资料？',
      okText: '确认离开', cancelText: '继续填写', onOk: action });
  };
  useImperativeHandle(leaveRef, () => ({ leave }));
  const track = (setter) => (value) => {
    setter(value);
    setBasicEdited(true);
  };
  const config = PAGE_CONFIG[type];
  const title = config.steps[step].title;
  const supplierType = supplierTypes[TYPE_OPTIONS.findIndex((option) => option.value === type)];
  const preview = Object.fromEntries(config.fields.map((field) => {
    const value = basic[field.key];
    if (field.type === 'address' && value) return [field.key, [value.region, value.detail?.trim()].filter(Boolean).join(' ')];
    const label = field.options?.find((item) => item.value === value)?.label;
    return [field.key, label || (value?.format ? value.format(DATE_FORMAT) : value?.detail || (typeof value === 'string' ? value.trim() : value))];
  }));
  const next = () => {
    if (title === '联系人信息' && contacts.some((contact) => !contact.name?.trim() || !contact.phone?.trim() || !validEmail(contact.email))) {
      return message.error('请补齐联系人姓名、电话及邮箱');
    }
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
  const back = () => step > 0 ? setStep(step - 1) : leave(onBack);
  const registration = () => ({
    type: supplierType,
    basic: {
      ...profile?.basic,
      ...preview,
      supplierName: preview.supplierName || preview.name,
      creditCode: preview.creditCode || preview.certificateNumber,
      establishedAt: preview.establishedAt || preview.certificateStart,
      licenseUntil: preview.licenseUntil || preview.certificateEnd,
      addressParts: typeof basic.address === 'object' ? basic.address : undefined,
      proof: file[0]?.name,
      qualifications,
    },
    contacts,
    banks,
  });
  const changeType = (value) => {
    const apply = () => {
      setType(value);
      setStep(0);
      setBasic({});
      setFile([]);
      setContacts([]);
      setBanks([]);
      setQualifications([]);
      setBasicEdited(false);
    };
    if (!basicEdited && !file.length && !qualifications.length && !contacts.length && !banks.length) {
      apply();
      return;
    }
    modal.confirm({
      centered: true, className: 'pc-confirm', title: '切换供应商类型？',
      content: '切换后将清空当前填写的资料。', okText: '切换', cancelText: '继续填写', onOk: apply,
    });
  };

  return (
    <div className="pc-page-stack pc-register">
      <Card size="small">
        <Steps current={step} items={config.steps} responsive size="small" />
      </Card>
      {step === 0 && <Card size="small" title="基本信息">
        <Form key={type} id="pc-supplier-registration" className="pc-register-form" layout="horizontal" labelAlign="right" initialValues={basic} onValuesChange={(_, values) => { setBasic(values); setBasicEdited(true); }}
          onFinish={(value) => {
            if (config.upload?.required && !file.length) return message.error('请上传' + config.upload.label);
            setBasic(value);
            next();
          }}>
          <div className="pc-register-grid">
            <Form.Item label="供应商类型" required htmlFor="pc-register-supplier-type">
              <Select id="pc-register-supplier-type" value={type} options={TYPE_OPTIONS} disabled={Boolean(profile)} onChange={changeType} />
            </Form.Item>
            {config.upload && <UploadField upload={config.upload} file={file} setFile={track(setFile)} />}
            {config.fields.map((field) => (
              <Form.Item
                key={field.key}
                className={field.full ? 'pc-register-wide' : undefined}
                name={field.key}
                label={field.label}
                tooltip={field.tooltip}
                dependencies={field.expiryStartKey ? [field.expiryStartKey] : undefined}
                rules={fieldRules(field)}
                initialValue={field.defaultValue}
              >
                <FieldControl field={field} />
              </Form.Item>
            ))}
          </div>
        </Form>
      </Card>}
      {step === 0 && <RecordCollectionEditor qualification type={supplierType} records={qualifications} onChange={track(setQualifications)} />}
      {title === '联系人信息' && <RecordCollectionEditor type={supplierType} records={contacts} onChange={track(setContacts)} />}
      {title === '银行信息' && <RecordCollectionEditor bank type={supplierType} records={banks} onChange={track(setBanks)} />}
      {title === '预览提交' && <>
        <Card size="small" title="基本信息"><RecordFields fields={[
          ['type', '供应商类型'], ...(config.upload ? [['proof', config.upload.label]] : []),
          ...config.fields.map(({ key, label }) => [key, label]),
        ]} value={{ ...preview, type: config.label, proof: file[0]?.name }} /></Card>
        <SupplierSnapshot profile={{ type: supplierType, basic: { ...preview, qualifications }, contacts, banks }} section="collections" />
      </>}
      <div className="pc-register-actions">
        <Button onClick={back}>{step === 0 ? '返回' : '上一步'}</Button>
        {onSaveDraft && <Button onClick={() => onSaveDraft(registration())}>保存草稿</Button>}
        {step === 0 ? <Button type="primary" htmlType="submit" form="pc-supplier-registration">下一步</Button> : title === '预览提交'
          ? <Button type="primary" onClick={() => onSubmit(registration())}>提交</Button>
          : <Button type="primary" onClick={next}>下一步</Button>}
      </div>
    </div>
  );
}
