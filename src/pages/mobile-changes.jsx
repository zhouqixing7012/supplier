import React from 'react';
import { bankChange } from './mobile-bank-changes.js';
import { Section } from './mobile-ui.jsx';
import { qualificationFields } from './mobile-qualifications.jsx';
import { fieldsFor } from './mobile-forms.jsx';
import { attachmentName } from './mobile-interaction.jsx';

const contactFields = [['name', '姓名'], ['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']];
const bankFields = [['accountType', '账户类型'], ['bank', '开户银行'], ['branch', '银行分行'], ['country', '国家/地区'], ['province', '省'], ['city', '市'], ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种'], ['proof', '开户证明'], ['note', '备注']];
const qualificationChangeFields = [...qualificationFields, ['qualificationCertificatePicture', '附件']];
const content = value => value == null ? '' : String(value);
const hasContent = value => content(value).trim() !== '';
const attachmentKeys = new Set(['proof', 'qualificationCertificatePicture']);
const displayValue = (key, value) => attachmentKeys.has(key) ? content(attachmentName(value)) : content(value);

const basicProfile = profile => ({
  ...(profile?.basic || {}),
  type: profile?.type || profile?.basic?.type,
  supplierName: profile?.name || profile?.basic?.supplierName,
  registerEmail: profile?.email || profile?.basic?.registerEmail,
  creditCode: profile?.basic?.creditCode ?? profile?.code,
});

function entriesFor(profile, property) {
  if (property === 'qualifications') return profile?.basic?.qualifications || [];
  if (Array.isArray(profile?.[property])) return profile[property];
  if (property === 'contacts' && [profile?.contact, profile?.phone, profile?.email].some(hasContent)) {
    return [{ id: 'legacy-contact', name: profile.contact, phone: profile.phone, email: profile.email }];
  }
  return [];
}

function keyedEntries(entries, prefix) {
  return new Map(entries.map((entry, index) => [entry.id || prefix + '-' + index, { entry, index }]));
}

function recordFields(definitions, previous, next, action) {
  return definitions.map(([key, label]) => {
    const oldValue = displayValue(key, previous?.[key]);
    const newValue = displayValue(key, next?.[key]);
    const changed = action === '新增' || action === '删除'
      ? true
      : oldValue !== newValue;
    const value = action === '删除' ? oldValue : newValue;
    if (!hasContent(value) && !hasContent(oldValue) && !hasContent(newValue)) return null;
    return { key, label, previous: oldValue, next: newValue, value, changed };
  }).filter(Boolean);
}

function recordTitle(property, number, previous, next) {
  const record = next || previous || {};
  if (property === 'contacts') return `联系人${number}${record.name ? ' · ' + record.name : ''}`;
  if (property === 'banks') return [record.accountType || '银行账户', record.bank].filter(Boolean).join(' · ') || `银行账户${number}`;
  const name = record.qualificationName || record.name || record.certificateType;
  return `资质${number}${name ? ' · ' + name : ''}`;
}

export function informationChangeGroups(before, after) {
  const groups = [];
  const previous = basicProfile(before);
  const next = basicProfile(after);
  const basicDefinitions = new Map([...fieldsFor(previous.type), ...fieldsFor(next.type)].map(([key, label]) => [key, label]));
  basicDefinitions.set('registerEmail', '注册邮箱');
  basicDefinitions.set('proof', '证照附件');
  const basicFields = recordFields([...basicDefinitions], previous, next, '变更');
  if (basicFields.some(field => field.changed)) {
    groups.push({ key: 'basic', title: '基本信息', labelBase: '基本信息', action: '变更', fields: basicFields });
  }

  for (const [property, label, definitions] of [
    ['contacts', '联系人', contactFields],
    ['banks', '银行', bankFields],
    ['qualifications', '资质', qualificationChangeFields],
  ]) {
    const oldEntries = entriesFor(before, property);
    const newEntries = entriesFor(after, property);
    const oldMap = keyedEntries(oldEntries, property);
    const newMap = keyedEntries(newEntries, property);

    for (const id of new Set([...oldMap.keys(), ...newMap.keys()])) {
      const oldRecord = oldMap.get(id);
      const newRecord = newMap.get(id);
      const explicitBankAction = property === 'banks' && newRecord
        ? bankChange(oldEntries, newRecord.entry).action
        : '';
      if (property === 'banks' && newRecord?.entry.change === '删除' && !oldRecord) continue;
      const markedDeleted = property === 'banks' && explicitBankAction === '删除';
      const currentRecord = markedDeleted ? null : newRecord;
      const action = !oldRecord ? '新增' : !currentRecord ? '删除'
        : explicitBankAction === '新增' ? '新增'
          : '变更';
      const previousEntry = oldRecord?.entry;
      const nextEntry = currentRecord?.entry;
      const fields = recordFields(definitions, previousEntry, nextEntry, action);
      const changed = action !== '变更' || fields.some(field => field.changed);
      if (!changed) continue;
      const number = (oldRecord || newRecord).index + 1;
      groups.push({
        key: property + '-' + id,
        title: recordTitle(property, number, previousEntry, nextEntry),
        labelBase: label + number,
        action,
        fields,
      });
    }
  }
  return groups;
}

// 保留原有扁平数据结构，便于其他原型逻辑继续读取字段级变更。
export function informationChanges(before, after) {
  return informationChangeGroups(before, after).flatMap(group => group.fields.filter(field => field.changed).map(field => ({
    ...field,
    label: group.labelBase + ' / ' + field.label,
    action: group.action === '变更' ? (group.labelBase === '基本信息' ? '' : '修改') : group.action,
  })));
}

function ChangeGroup({ group }) {
  const deleted = group.action === '删除';
  const added = group.action === '新增';
  return <article className="m-change-group" data-change-action={group.action}>
    <header className="m-change-group-heading">
      <h3>{group.title}</h3>
      <span className="m-change-badge" data-action={group.action}>{group.action}</span>
    </header>
    <div className="m-change-group-body">
      {group.fields.map(field => <div className="m-change-diff-row" key={field.key}>
        <span className="m-change-diff-label">{field.label}</span>
        <div className="m-change-diff-values" aria-label={field.label + '修改前后'}>
          {field.changed && !added && !deleted
            ? <><span className="m-change-value-new">{field.next || '未填写'}</span>{hasContent(field.previous) && <span className="m-change-value-old">{field.previous}</span>}</>
            : <span className="m-change-value-normal">{field.value || '—'}</span>}
        </div>
      </div>)}
    </div>
  </article>;
}

export function ChangeComparison({ before, after }) {
  const groups = informationChangeGroups(before, after);
  return <Section title="修改前后对比" collapsible={false}>
    <div className="m-change-comparison">
      {groups.length ? groups.map(group => <ChangeGroup key={group.key} group={group} />) : <p className="m-change-empty">没有信息变更</p>}
    </div>
  </Section>;
}
