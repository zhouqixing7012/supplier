import React from 'react';
import { ChevronRight, CircleHelp, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import './supplier-register.css';

const REGISTER_EMAIL_TIP = '用于供应商登录协同门户及修改密码时接收验证码';

const TYPE_OPTIONS = [
  ['company', '企业供应商'],
  ['personal', '个人供应商'],
  ['government', '政府机构或社团'],
  ['foreign', '国外供应商'],
];

const FOUR_STEPS = [
  ['基本信息', '营业执照、证书、合作内容等'],
  ['联系人信息', '供应商联系人电话及邮箱等'],
  ['银行信息', '银行账号、开户证明等'],
  ['预览提交', ''],
];

const TWO_STEPS = [
  ['基本信息', '证件、联系方式、合作内容等'],
  ['预览提交', ''],
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
      ['domestic', '国内'],
      ['foreign', '国外'],
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
      note: '请先上传营业执照，企业信息可自动填充',
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
        key: 'companyType',
        label: '企业类型',
        required: true,
        type: 'select',
        placeholder: '请选择企业类型',
        options: [['limited', '有限责任公司'], ['joint', '股份有限公司']],
      },
      {
        key: 'industry',
        label: '所属行业',
        required: true,
        type: 'select',
        placeholder: '请选择所属行业',
        options: [['it', '信息技术服务业'], ['media', '文化传媒业']],
      },
      { key: 'capital', label: '注册资金', required: true, placeholder: '请输入注册资金' },
      {
        key: 'currency',
        label: '注册币种',
        required: true,
        type: 'select',
        placeholder: '请选择注册币种',
        options: [['cny', '人民币'], ['usd', '美元'], ['eur', '欧元']],
      },
      COMMON.countryDomestic,
      COMMON.address,
      { key: 'invoiceAddress', label: '接收发票地址', placeholder: '请输入接收发票地址' },
      { key: 'website', label: '公司网址', placeholder: '请输入公司网址' },
      {
        key: 'taxpayer',
        label: '纳税人资格',
        type: 'select',
        placeholder: '请选择纳税人资格',
        options: [['general', '一般纳税人'], ['small', '小规模纳税人']],
      },
      {
        key: 'businessScope',
        label: '经营范围',
        required: true,
        type: 'textarea',
        placeholder: '请输入经营范围',
        maxLength: 4000,
        full: true,
      },
    ],
  },
  personal: {
    label: '个人供应商',
    steps: TWO_STEPS,
    fields: [
      {
        key: 'certificateType',
        label: '证件类型',
        required: true,
        type: 'select',
        placeholder: '请选择证件类型',
        options: [['id', '身份证'], ['passport', '护照']],
        full: true,
      },
      { key: 'name', label: '姓名', required: true, placeholder: '请输入姓名' },
      COMMON.registerEmail,
      {
        key: 'gender',
        label: '性别',
        required: true,
        type: 'select',
        placeholder: '请选择性别',
        options: [['male', '男'], ['female', '女']],
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
      {
        key: 'cooperation',
        label: '与搜狐合作事项',
        required: true,
        type: 'textarea',
        placeholder: '请输入与搜狐合作事项',
        maxLength: 500,
        full: true,
      },
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
      {
        key: 'cooperation',
        label: '与搜狐合作事项',
        required: true,
        type: 'textarea',
        placeholder: '请输入与搜狐合作事项',
        maxLength: 500,
        full: true,
      },
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
        key: 'currency',
        label: '注册币种',
        required: true,
        type: 'select',
        placeholder: '请选择注册币种',
        options: [['usd', '美元'], ['eur', '欧元'], ['cny', '人民币']],
      },
      {
        key: 'country',
        label: '国家',
        required: true,
        type: 'select',
        placeholder: '请选择国家',
        defaultValue: 'foreign',
        options: [['foreign', '国外'], ['domestic', '国内']],
      },
      { key: 'address', label: '注册地址', required: true, placeholder: '请输入注册地址' },
      {
        key: 'cooperation',
        label: '与搜狐合作事项',
        required: true,
        type: 'textarea',
        placeholder: '请输入与搜狐合作事项',
        maxLength: 500,
        full: true,
      },
      { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注', maxLength: 500, full: true },
    ],
  },
};

function RequiredMark() {
  return <span className="text-red-500" aria-hidden="true">*</span>;
}

function FieldLabel({ field }) {
  return (
    <div className="flex min-h-5 items-center gap-1.5">
      <Label htmlFor={field.key} className="flex items-center gap-1">
        {field.required && <RequiredMark />}
        <span>{field.label}</span>
      </Label>
      {field.tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex text-muted-foreground hover:text-foreground" aria-label={`${field.label}说明`}>
              <CircleHelp className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="max-w-[320px]">
            {field.tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function BasicSelect({ field }) {
  return (
    <Select defaultValue={field.defaultValue}>
      <SelectTrigger id={field.key}>
        <SelectValue placeholder={field.placeholder || '请选择'} />
      </SelectTrigger>
      <SelectContent>
        {(field.options || []).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AddressControl({ field }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
      <Select>
        <SelectTrigger aria-label={`${field.label}地区`}>
          <SelectValue placeholder="请选择地区" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="haidian">北京市 / 北京市 / 海淀区</SelectItem>
          <SelectItem value="chaoyang">北京市 / 北京市 / 朝阳区</SelectItem>
        </SelectContent>
      </Select>
      <Input id={field.key} placeholder="请输入详细地址" maxLength={50} />
    </div>
  );
}

function FieldControl({ field }) {
  if (field.type === 'select') return <BasicSelect field={field} />;
  if (field.type === 'address') return <AddressControl field={field} />;
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <Textarea id={field.key} placeholder={field.placeholder} maxLength={field.maxLength} />
        {field.maxLength && <p className="text-right text-xs text-muted-foreground">最多 {field.maxLength} 字</p>}
      </div>
    );
  }
  if (field.type === 'date') return <Input id={field.key} type="date" required={field.required} />;
  return <Input id={field.key} type={field.type || 'text'} placeholder={field.placeholder} required={field.required} />;
}

function FormField({ field }) {
  return (
    <div className={`space-y-2 ${field.full ? 'md:col-span-2' : ''}`}>
      <FieldLabel field={field} />
      <FieldControl field={field} />
    </div>
  );
}

function SupplierTypeSelect({ type, onTypeChange }) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1"><RequiredMark />供应商类型</Label>
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function UploadField({ upload }) {
  if (!upload) return null;
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {upload.required && <RequiredMark />}
        {upload.label}
      </Label>
      <Button type="button" variant="outline" className="h-24 w-full border-dashed text-muted-foreground hover:text-foreground">
        <span className="flex flex-col items-center gap-2">
          <UploadCloud className="h-6 w-6" />
          <span>点击上传{upload.label}</span>
        </span>
      </Button>
      {upload.note && <p className="text-xs text-muted-foreground">{upload.note}</p>}
    </div>
  );
}

function RegisterSteps({ steps }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map(([title, description], index) => (
        <div key={title} className="flex min-w-0 items-start gap-3">
          <Badge variant={index === 0 ? 'default' : 'outline'} className="mt-0.5 h-6 min-w-6 justify-center px-1.5">
            {index + 1}
          </Badge>
          <div className="min-w-0 space-y-1">
            <p className={`whitespace-nowrap text-sm font-medium ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</p>
            {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SupplierRegisterPage({ type = 'company', onTypeChange }) {
  const config = PAGE_CONFIG[type] || PAGE_CONFIG.company;

  const handleNext = () => {
    toast.success('基本信息已保存');
  };

  return (
    <TooltipProvider>
      <main className="supplier-register-modern min-h-screen bg-secondary/40 text-foreground">
        <div className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-4 text-sm md:px-8">
            <button type="button" className="text-muted-foreground transition-colors hover:text-foreground">供应商管理首页</button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">代注册</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
          <Tabs value={type} onValueChange={onTypeChange}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1 md:w-auto">
              {TYPE_OPTIONS.map(([value, label]) => (
                <TabsTrigger key={value} value={value} className="shrink-0">{label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>供应商代注册</CardTitle>
              <CardDescription>当前类型：{config.label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RegisterSteps steps={config.steps} />
              <Separator />

              <form onSubmit={(event) => event.preventDefault()} className="space-y-8">
                <section className="grid gap-6 md:grid-cols-2">
                  <SupplierTypeSelect type={type} onTypeChange={onTypeChange} />
                  <UploadField upload={config.upload} />
                </section>

                <Separator />

                <section className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                  {config.fields.map((field) => <FormField key={field.key} field={field} />)}
                </section>
              </form>
            </CardContent>
            <CardFooter className="justify-end gap-3 border-t border-border pt-6">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>返回</Button>
              <Button type="button" onClick={handleNext}>下一步</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </TooltipProvider>
  );
}

export { SupplierRegisterPage };
