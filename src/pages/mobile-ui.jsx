import React from 'react';
import { Field as MobileField, FilterSummary, Overlay, SearchBox as MobileSearchBox, StatusBadge, Steps } from '../components/mobile/index.js';
import { informationSteps } from './mobile-edit-rules.js';

export function ChangeTag({ value }) {
  if (!value) return null;
  const tone = value.includes('删除') ? 'danger' : /修改|变更/.test(value) ? 'warning' : 'info';
  return <StatusBadge tone={tone} label={'变更状态：' + value}>{value}</StatusBadge>;
}

const statusTone = { '已拉黑': 'danger', '已移除': 'neutral',
  '草稿': 'neutral', '邀请中': 'info', '注册中': 'info',
  '审批中': 'warning', '待审批': 'warning', '变更中': 'warning',
  '已审批': 'success', '注册驳回': 'danger',
};
export function StatusTag({ value }) {
  return value ? <StatusBadge tone={statusTone[value]}>{value}</StatusBadge> : <span>—</span>;
}

export function AppliedFilters({ filters, count, onEdit, onClear }) {
  const labels = { type: '供应商类型', status: '供应商状态', start: '邀请时间（起）', end: '邀请时间（止）', recommended: '供应商推荐', inviter: '邀请人' };
  const entries = Object.entries(filters).filter(([key, value]) => labels[key] && value).map(([key, value]) => [labels[key], value]);
  return <FilterSummary entries={entries} count={count} unit="家供应商" onEdit={onEdit} onClear={onClear} />;
}

// 保留供应商字段已有的键盘类型及自动填充规则。
export function Field({ label, type = 'text', inputMode, autoComplete, ...props }) {
  const numeric = /邮箱验证码|注册资金|QQ/.test(label);
  const keyboard = numeric ? 'numeric' : /电话|手机/.test(label) ? 'tel' : /邮箱/.test(label) ? 'email' : undefined;
  const completion = type === 'password'
    ? (/新/.test(label) ? 'new-password' : 'current-password')
    : /邮箱/.test(label) ? 'email' : /账号/.test(label) ? 'username' : /电话|手机/.test(label) ? 'tel' : 'off';
  return <MobileField {...props} label={label} type={type} inputMode={inputMode || keyboard} autoComplete={autoComplete || completion} />;
}

// 筛选项以提示文案表达字段名，关联标签及 aria-label 继续保留。
export function FilterField(props) {
  const name = props.label.replace('（起）', '开始').replace('（止）', '结束');
  const placeholder = props.placeholder || (props.type === 'date' ? '选择' + name : props.options || props.onPick ? name : '输入' + name);
  return <Field {...props} hideLabel placeholder={placeholder} />;
}

export function SearchBox({ placeholder = '搜索供应商名称或邀请人', ...props }) {
  return <MobileSearchBox {...props} placeholder={placeholder} label={placeholder || '搜索供应商名称或邀请人'} />;
}

export function SupplierIdentityCard({ supplier, children, showMeta = true }) {
  return <div className="m-detail-summary"><div className="m-supplier-heading"><h2>{supplier.name}</h2>{supplier.status && <StatusTag value={supplier.status} />}</div>{showMeta && <p className="m-summary-meta"><span>{supplier.type || '—'} · {supplier.mode || '—'}</span></p>}{children}</div>;
}

export function ScreenshotTip({ onClose }) {
  return <Overlay label="截屏提示" onClose={onClose}><div className="m-capture-tip"><span className="m-capture-plate"><img src="/mobile-assets/capture-notice-source.jpg" alt="截屏分享提醒" /></span><p>截屏已生效，分享需谨慎</p><button onClick={onClose}>知道了</button></div></Overlay>;
}

export function RegistrationSteps({ personal, step, expanded, onExpandedChange }) {
  const stages = informationSteps(personal);
  const labels = ['基本信息', '联系人信息', '银行信息', '预览提交'];
  return <Steps label="注册步骤" items={stages.map(stage => labels[stage])} active={stages.indexOf(step)}
    expanded={expanded} onExpandedChange={onExpandedChange} />;
}
