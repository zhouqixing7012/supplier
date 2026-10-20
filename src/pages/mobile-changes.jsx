import React from 'react';
import { Row, Section } from './mobile-ui.jsx';
import { fieldsFor } from './mobile-forms.jsx';
import { attachmentName } from './mobile-interaction.jsx';

const contactFields = [['name', '姓名'], ['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']];
const bankFields = [['accountType', '账户类型'], ['bank', '开户银行'], ['branch', '银行分行'], ['country', '国家/地区'], ['province', '省'], ['city', '市'], ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种'], ['proof', '开户证明'], ['note', '备注']];
function values(profile) {
  const basic = { ...profile.basic, type: profile.type || profile.basic?.type, supplierName: profile.name || profile.basic?.supplierName, registerEmail: profile.email || profile.basic?.registerEmail, creditCode: profile.basic?.creditCode ?? profile.code };
  const result = new Map([['类型', basic.type], ...fieldsFor(basic.type).map(([key, label]) => ['基本信息 / ' + label, basic[key]]), ['基本信息 / 注册邮箱', basic.registerEmail], ['基本信息 / 证照附件', attachmentName(basic.proof)]]);
  for (const [name, entries, fields] of [['联系人', profile.contacts || [], contactFields], ['银行', profile.banks || [], bankFields]]) entries.forEach((entry, i) => fields.forEach(([key, label]) => result.set(`${name}${i + 1} / ${label}`, key === 'proof' ? attachmentName(entry[key]) : entry[key])));
  return result;
}
export function ChangeComparison({ before, after }) {
  const previous = values(before), next = values(after);
  const changes = [...new Set([...previous.keys(), ...next.keys()])].filter(key => (previous.get(key) || '') !== (next.get(key) || ''));
  return <Section title="修改前后对比" collapsible={false}><div className="m-change-comparison">{changes.length ? changes.map(key => <article key={key}><h3>{key}</h3><Row label="修改前">{previous.get(key) || '未填写'}</Row><Row label="修改后">{next.get(key) || '未填写'}</Row></article>) : <p>没有信息变更</p>}</div></Section>;
}
