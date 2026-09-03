import React from 'react';
import { CalendarDays, CircleHelp, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import './supplier-register.css';

const TYPE_META = {
  company: { label: '企业供应商', steps: 4 },
  personal: { label: '个人供应商', steps: 2 },
  government: { label: '政府机构或社团', steps: 4 },
  foreign: { label: '国外供应商', steps: 4 },
};

const typeOptions = [
  ['company', '企业供应商'],
  ['personal', '个人供应商'],
  ['government', '政府机构或社团'],
  ['foreign', '国外供应商'],
];

const watermarkPositions = Array.from({ length: 28 }, (_, index) => ({
  left: `${3 + (index % 7) * 15.5}%`,
  top: `${3 + Math.floor(index / 7) * 26}%`,
}));

function WatermarkLayer() {
  return (
    <div className="register-watermarks" aria-hidden="true">
      {watermarkPositions.map((position, index) => (
        <span key={index} style={position}>闫海量 220784</span>
      ))}
    </div>
  );
}

function Stepper({ count }) {
  const steps = count === 2
    ? [
        ['基本信息', '营业执照、证书、合作内容等'],
        ['预览提交', ''],
      ]
    : [
        ['基本信息', '营业执照、证书、合作内容等'],
        ['联系人信息', '供应商联系人电话及邮箱等'],
        ['银行信息', '银行账号、开户证明等'],
        ['预览提交', ''],
      ];

  return (
    <div className={`register-stepper ${count === 2 ? 'is-two' : ''}`}>
      {steps.map(([title, desc], index) => (
        <div className={`register-step ${index === 0 ? 'active' : ''}`} key={title}>
          <div className="step-head">
            <span className="step-number">{index + 1}</span>
            {index < steps.length - 1 && <span className="step-line" />}
          </div>
          <strong>{title}</strong>
          {desc && <small>{desc}</small>}
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children, required = false, help = false }) {
  return (
    <div className="register-label">
      {required && <span className="required-star">*</span>}
      <span>{children}：</span>
      {help && <CircleHelp size={15} />}
    </div>
  );
}

function RegisterField({ label, required = false, help = false, children, className = '' }) {
  return (
    <div className={`register-field ${className}`}>
      <FieldLabel required={required} help={help}>{label}</FieldLabel>
      <div className="register-control">{children}</div>
    </div>
  );
}

function DateInput({ placeholder }) {
  return (
    <div className="date-input-wrap">
      <CalendarDays size={15} />
      <Input placeholder={placeholder} />
    </div>
  );
}

function AddressInput({ foreign = false }) {
  if (foreign) {
    return <Input placeholder="请输入注册地址" />;
  }

  return (
    <div className="address-control">
      <NativeSelect defaultValue="">
        <option value="" disabled>请选择</option>
        <option>北京市 / 北京市 / 海淀区</option>
        <option>北京市 / 北京市 / 朝阳区</option>
      </NativeSelect>
      <div className="counted-input">
        <Input placeholder="请输入详细地址" maxLength={50} />
        <span>0/50</span>
      </div>
    </div>
  );
}

function CountedTextarea({ placeholder, maxLength, className = '' }) {
  return (
    <div className={`counted-textarea ${className}`}>
      <Textarea placeholder={placeholder} maxLength={maxLength} />
      <span>0/{maxLength}</span>
    </div>
  );
}

function UploadBox({ label, note }) {
  return (
    <div className="upload-row">
      <FieldLabel required help>{label}</FieldLabel>
      <button className="upload-box" type="button" aria-label={`上传${label}`}>
        <Plus size={34} strokeWidth={1.5} />
      </button>
      {note && <span className="upload-note">{note}</span>}
    </div>
  );
}

function TypeField({ type, onTypeChange }) {
  return (
    <RegisterField label="供应商类型" required>
      <NativeSelect value={type} onChange={(event) => onTypeChange(event.target.value)}>
        {typeOptions.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </NativeSelect>
    </RegisterField>
  );
}

function RegisterTypeTabs({ type, onTypeChange }) {
  return (
    <nav className="register-page-tabs" aria-label="供应商类型切换">
      <span className="register-page-tabs-title">供应商类型</span>
      <div className="register-page-tabs-list">
        {typeOptions.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant="ghost"
            className={`register-page-tab ${type === value ? 'is-active' : ''}`}
            onClick={() => onTypeChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </nav>
  );
}

function CompanyForm({ type, onTypeChange }) {
  return (
    <>
      <div className="register-top-grid">
        <TypeField type={type} onTypeChange={onTypeChange} />
        <UploadBox label="营业执照" note="请先上传营业执照，企业信息可自动填充" />
      </div>

      <div className="register-divider" />

      <div className="register-form-grid">
        <RegisterField label="供应商名称" required><Input placeholder="请输入供应商名称" /></RegisterField>
        <RegisterField label="统一社会信用代码" required><Input placeholder="请输入统一社会信用代码" /></RegisterField>
        <RegisterField label="成立日期" required><DateInput placeholder="请选择成立日期" /></RegisterField>
        <RegisterField label="证件有效期至" required help><DateInput placeholder="请选择证件有效期至" /></RegisterField>
        <RegisterField label="法人代表" required><Input placeholder="请输入法人代表" /></RegisterField>
        <RegisterField label="公司电话"><Input placeholder="请输入公司电话" /></RegisterField>
        <RegisterField label="企业类型" required>
          <NativeSelect defaultValue=""><option value="" disabled>请选择企业类型</option><option>有限责任公司</option></NativeSelect>
        </RegisterField>
        <RegisterField label="所属行业" required>
          <NativeSelect defaultValue=""><option value="" disabled>请选择所属行业</option><option>信息技术服务业</option></NativeSelect>
        </RegisterField>
        <RegisterField label="注册资金" required help><Input placeholder="请输入注册资金" /></RegisterField>
        <RegisterField label="注册币种" required>
          <NativeSelect defaultValue=""><option value="" disabled>请选择注册币种</option><option>人民币</option></NativeSelect>
        </RegisterField>
        <RegisterField label="国家" required>
          <NativeSelect defaultValue="国内"><option>国内</option><option>国外</option></NativeSelect>
        </RegisterField>
        <RegisterField label="注册地址" required><AddressInput /></RegisterField>
        <RegisterField label="接收发票地址"><Input placeholder="请输入接收发票地址" /></RegisterField>
        <RegisterField label="公司网址"><Input placeholder="请输入公司网址" /></RegisterField>
        <RegisterField label="纳税人资格">
          <NativeSelect defaultValue=""><option value="" disabled>请选择纳税人资格</option><option>一般纳税人</option><option>小规模纳税人</option></NativeSelect>
        </RegisterField>
      </div>

      <RegisterField label="经营范围" required className="full-width-field">
        <CountedTextarea placeholder="请输入经营范围" maxLength={4000} />
      </RegisterField>
    </>
  );
}

function PersonalForm({ type, onTypeChange }) {
  return (
    <>
      <div className="register-form-grid personal-grid">
        <TypeField type={type} onTypeChange={onTypeChange} />
        <div />
        <RegisterField label="证件类型" required>
          <NativeSelect defaultValue=""><option value="" disabled>请选择证件类型</option><option>身份证</option><option>护照</option></NativeSelect>
        </RegisterField>
        <div />
        <RegisterField label="姓名" required><Input placeholder="请输入姓名" /></RegisterField>
        <RegisterField label="性别" required>
          <NativeSelect defaultValue=""><option value="" disabled>请选择性别</option><option>男</option><option>女</option></NativeSelect>
        </RegisterField>
        <RegisterField label="证件号码" required><Input placeholder="请输入证件号码" /></RegisterField>
        <div />
        <RegisterField label="证件有效起始日期" required><DateInput placeholder="请选择证件有效起始日期" /></RegisterField>
        <RegisterField label="证件有效截止日期" required><DateInput placeholder="请选择证件有效截止日期" /></RegisterField>
        <RegisterField label="国家" required>
          <NativeSelect defaultValue="国内"><option>国内</option><option>国外</option></NativeSelect>
        </RegisterField>
        <RegisterField label="注册地址" required><AddressInput /></RegisterField>
        <RegisterField label="邮箱" required><Input placeholder="请输入邮箱" /></RegisterField>
        <RegisterField label="手机" required><Input placeholder="请输入手机" /></RegisterField>
        <RegisterField label="QQ"><Input placeholder="请输入QQ" /></RegisterField>
        <RegisterField label="微信"><Input placeholder="请输入微信" /></RegisterField>
      </div>

      <RegisterField label="与搜狐合作事项" required className="full-width-field">
        <CountedTextarea placeholder="不能为空与搜狐合作事项" maxLength={500} />
      </RegisterField>
      <RegisterField label="备注" className="full-width-field">
        <CountedTextarea placeholder="请输入备注" maxLength={500} />
      </RegisterField>
    </>
  );
}

function GovernmentForm({ type, onTypeChange }) {
  return (
    <>
      <div className="register-form-grid government-grid">
        <TypeField type={type} onTypeChange={onTypeChange} />
        <div />
        <RegisterField label="供应商名称" required><Input placeholder="请输入供应商名称" /></RegisterField>
        <div />
        <RegisterField label="国家" required>
          <NativeSelect defaultValue="国内"><option>国内</option><option>国外</option></NativeSelect>
        </RegisterField>
        <RegisterField label="注册地址" required><AddressInput /></RegisterField>
      </div>

      <RegisterField label="与搜狐合作事项" required className="full-width-field">
        <CountedTextarea placeholder="不能为空与搜狐合作事项" maxLength={500} />
      </RegisterField>
      <RegisterField label="备注" className="full-width-field">
        <CountedTextarea placeholder="请输入备注" maxLength={500} />
      </RegisterField>
    </>
  );
}

function ForeignForm({ type, onTypeChange }) {
  return (
    <>
      <div className="register-top-grid foreign-top-grid">
        <div>
          <TypeField type={type} onTypeChange={onTypeChange} />
          <UploadBox label="证书" />
        </div>
      </div>

      <div className="register-form-grid foreign-grid">
        <RegisterField label="供应商名称" required><Input placeholder="请输入供应商名称" /></RegisterField>
        <RegisterField label="证件号码" required><Input placeholder="请输入证件号码" /></RegisterField>
        <RegisterField label="成立日期" required><DateInput placeholder="请选择成立日期" /></RegisterField>
        <RegisterField label="证件有效期至" required help><DateInput placeholder="请选择证件有效期至" /></RegisterField>
        <RegisterField label="法人代表" required><Input placeholder="请输入法人代表" /></RegisterField>
        <RegisterField label="公司电话"><Input placeholder="请输入公司电话" /></RegisterField>
        <RegisterField label="注册资金" required help><Input placeholder="请输入注册资金" /></RegisterField>
        <RegisterField label="注册币种" required>
          <NativeSelect defaultValue=""><option value="" disabled>请选择注册币种</option><option>美元</option><option>欧元</option><option>人民币</option></NativeSelect>
        </RegisterField>
        <RegisterField label="国家" required>
          <NativeSelect defaultValue="国外"><option>国外</option><option>国内</option></NativeSelect>
        </RegisterField>
        <RegisterField label="注册地址" required><AddressInput foreign /></RegisterField>
      </div>

      <RegisterField label="与搜狐合作事项" required className="full-width-field">
        <CountedTextarea placeholder="不能为空与搜狐合作事项" maxLength={500} />
      </RegisterField>
      <RegisterField label="备注" className="full-width-field">
        <CountedTextarea placeholder="请输入备注" maxLength={500} />
      </RegisterField>
    </>
  );
}

function SupplierRegisterPage({ type = 'company', onTypeChange }) {
  const meta = TYPE_META[type] || TYPE_META.company;

  const onNext = () => {
    toast.success('基本信息已保存');
  };

  return (
    <main className="supplier-register-page">
      <WatermarkLayer />
      <div className="register-scroll-area">
        <header className="register-breadcrumb">
          <span className="breadcrumb-mark" />
          <button type="button">供应商管理首页</button>
          <span>›</span>
          <strong>代注册</strong>
        </header>

        <RegisterTypeTabs type={type} onTypeChange={onTypeChange} />

        <section className="register-content">
          <Stepper count={meta.steps} />

          <form className={`register-form register-${type}`} onSubmit={(event) => event.preventDefault()}>
            {type === 'company' && <CompanyForm type={type} onTypeChange={onTypeChange} />}
            {type === 'personal' && <PersonalForm type={type} onTypeChange={onTypeChange} />}
            {type === 'government' && <GovernmentForm type={type} onTypeChange={onTypeChange} />}
            {type === 'foreign' && <ForeignForm type={type} onTypeChange={onTypeChange} />}

            <div className="register-actions">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>返回</Button>
              <Button type="button" variant="outline" onClick={onNext}>下一步</Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export { SupplierRegisterPage };
