import React from 'react';
import { Row, Section } from './mobile-ui.jsx';
import { qualificationFields } from './mobile-qualifications.jsx';
import { fieldsFor } from './mobile-forms.jsx';
import { attachmentName } from './mobile-interaction.jsx';

const contactFields = [['name', '姓名'], ['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']];
const bankFields = [['accountType', '账户类型'], ['bank', '开户银行'], ['branch', '银行分行'], ['country', '国家/地区'], ['province', '省'], ['city', '市'], ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种'], ['proof', '开户证明'], ['note', '备注']];
const content = value => value ?? '';
export function informationChanges(before, after) {
  const rows = [];
  const add = (label, previous, next, action = '') => {
    if (content(previous) !== content(next)) rows.push({ label, previous: content(previous), next: content(next), action });
  };
  const basic = profile => ({ ...profile.basic, type: profile.type || profile.basic?.type, supplierName: profile.name || profile.basic?.supplierName, registerEmail: profile.email || profile.basic?.registerEmail, creditCode: profile.basic?.creditCode ?? profile.code });
  const previous = basic(before), next = basic(after);
  add('供应商类型', previous.type, next.type);
  const definitions = new Map([...fieldsFor(previous.type), ...fieldsFor(next.type)].map(([key, label]) => [key, label]));
  definitions.set('registerEmail', '注册邮箱'); definitions.set('proof', '证照附件');
  definitions.forEach((label, key) => add('基本信息 / ' + label, key === 'proof' ? attachmentName(previous[key]) : previous[key], key === 'proof' ? attachmentName(next[key]) : next[key]));
  for (const [name, property, fields] of [['联系人', 'contacts', contactFields], ['银行', 'banks', bankFields], ['资质', 'qualifications', [...qualificationFields, ['qualificationCertificatePicture', '附件']]]]) {
    const oldEntries = (property === 'qualifications' ? before.basic?.qualifications : before[property]) || [], newEntries = (property === 'qualifications' ? after.basic?.qualifications : after[property]) || [];
    const keyed = entries => new Map(entries.map((entry, i) => [entry.id || 'legacy-' + i, { entry, index: i }]));
    const oldMap = keyed(oldEntries), newMap = keyed(newEntries);
    for (const id of new Set([...oldMap.keys(), ...newMap.keys()])) {
      const oldRecord = oldMap.get(id), newRecord = newMap.get(id);
      const number = (oldRecord || newRecord).index + 1;
      const action = !oldRecord ? '新增' : !newRecord ? '删除' : '修改';
      fields.forEach(([key, label]) => {
        const oldValue = oldRecord?.entry[key], newValue = newRecord?.entry[key];
        add(`${name}${number} / ${label}`, ['proof', 'qualificationCertificatePicture'].includes(key) ? attachmentName(oldValue) : oldValue, ['proof', 'qualificationCertificatePicture'].includes(key) ? attachmentName(newValue) : newValue, action);
      });
    }
  }
  return rows;
}
export function ChangeComparison({ before, after }) {
  const changes = informationChanges(before, after);
  return <Section title="修改前后对比" collapsible={false}><div className="m-change-comparison">{changes.length ? changes.map((change, i) => <article key={i}><h3>{change.action && <span>{change.action} · </span>}{change.label}</h3><Row label="修改前">{change.previous || '未填写'}</Row><Row label="修改后">{change.next || (change.action === '删除' ? '已删除' : '未填写')}</Row></article>) : <p>没有信息变更</p>}</div></Section>;
}

