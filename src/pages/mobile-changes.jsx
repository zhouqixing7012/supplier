import React from 'react';
import { bankChange } from './mobile-bank-changes.js';
import { AttachmentLink, Section } from './mobile-ui.jsx';
import { qualificationFields } from './mobile-qualifications.jsx';
import { fieldsFor } from './mobile-forms.jsx';
import { attachmentName } from './mobile-interaction.jsx';

const contactFields = [['name', '姓名'], ['phone', '电话'], ['email', '邮箱'], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']];
const bankFields = [['accountType', '账户类型'], ['bank', '开户银行'], ['branch', '银行分行'], ['country', '国家/地区'], ['province', '省'], ['city', '市'], ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种'], ['proof', '开户证明'], ['note', '备注']];
const qualificationChangeFields = [...qualificationFields, ['qualificationCertificatePicture', '附件']];
const attachmentKeys = new Set(['proof', 'qualificationCertificatePicture']);
const content = value => value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const hasContent = value => content(value).trim() !== '';
const displayValue = (key, value) => attachmentKeys.has(key) ? content(attachmentName(value)) : content(value);

const basicProfile = profile => ({
  ...(profile?.basic || {}),
  type: profile?.type || profile?.basic?.type,
  supplierName: profile?.name || profile?.basic?.supplierName,
  registerEmail: profile?.email || profile?.basic?.registerEmail,
  creditCode: profile?.basic?.creditCode ?? profile?.code,
});

function entriesFor(profile, property) {
  if (property === 'qualifications') return profile?.basic?.qualifications || profile?.qualifications || [];
  if (Array.isArray(profile?.[property])) return profile[property];
  if (property === 'contacts' && [profile?.contact, profile?.phone, profile?.email].some(hasContent)) {
    return [{ id: 'legacy-contact', name: profile.contact, phone: profile.phone, email: profile.email }];
  }
  return [];
}

function keyedEntries(entries, prefix) {
  return new Map(entries.map((entry, index) => [entry.id || prefix + '-' + index, { entry, index }]));
}

// 修改时保留记录的完整字段；changed 仅决定字段是否使用新旧值对比样式。
function comparisonFields(definitions, previous, next, action) {
  return definitions.map(([key, label]) => {
    const previousRaw = previous?.[key];
    const nextRaw = next?.[key];
    const previousValue = displayValue(key, previousRaw);
    const nextValue = displayValue(key, nextRaw);
    const changed = action === '变更' && content(previousRaw) !== content(nextRaw);
    const deleted = action === '删除';
    return {
      key, label, previous: previousValue, next: nextValue,
      previousRaw, nextRaw,
      value: deleted ? previousValue : nextValue,
      valueRaw: deleted ? previousRaw : nextRaw,
      changed,
    };
  });
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
  const basicFields = comparisonFields([...basicDefinitions], previous, next, '变更');
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
      let previousEntry = oldRecord?.entry;
      let nextEntry = newRecord?.entry;
      let action = !oldRecord ? '新增' : !newRecord ? '删除' : '变更';

      if (property === 'banks') {
        if (newRecord) {
          const bankResult = bankChange(oldEntries, newRecord.entry);
          if (!bankResult.action) continue;
          if (bankResult.action === '新增') {
            action = '新增';
            previousEntry = null;
            nextEntry = newRecord.entry;
          } else if (bankResult.action === '修改') {
            action = '变更';
            previousEntry = bankResult.original || oldRecord?.entry;
            nextEntry = newRecord.entry;
          } else if (bankResult.action === '删除') {
            action = '删除';
            previousEntry = bankResult.original || oldRecord?.entry;
            nextEntry = null;
          }
        } else if (oldRecord) {
          action = '删除';
          previousEntry = oldRecord.entry;
          nextEntry = null;
        } else {
          continue;
        }
      }

      const fields = comparisonFields(definitions, previousEntry, nextEntry, action);
      if (action === '变更' && !fields.some(field => field.changed)) continue;
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

// 保留原有扁平接口：仅输出真正变化的字段，供既有逻辑继续读取。
export function informationChanges(before, after) {
  return informationChangeGroups(before, after).flatMap(group => {
    const fields = group.action === '变更'
      ? group.fields.filter(field => field.changed)
      : group.fields.filter(field => hasContent(group.action === '删除' ? field.previous : field.next));
    return fields.map(field => ({
      ...field,
      label: group.labelBase + ' / ' + field.label,
      action: group.action === '变更' ? (group.labelBase === '基本信息' ? '' : '修改') : group.action,
    }));
  });
}

function FieldValue({ field, raw, value, onPreview }) {
  if (attachmentKeys.has(field.key) && raw && onPreview) return <AttachmentLink value={raw} onPreview={onPreview} />;
  return value || '—';
}

function ChangeGroup({ group, onPreview }) {
  const changedFields = group.action === '变更' ? group.fields.filter(field => field.changed) : [];
  const plainFields = group.action === '变更' ? group.fields.filter(field => !field.changed) : group.fields;
  return <article className="m-change-group" data-change-action={group.action}>
    <header className="m-change-group-heading">
      <h3>{group.title}</h3>
      <span className="m-change-badge" data-action={group.action} aria-label={'变更状态：' + group.action}>{group.action}</span>
    </header>
    {changedFields.length > 0 && <div className="m-change-group-body">
      {changedFields.map(field => <div className="m-change-diff-row" key={field.key}>
        <span className="m-change-diff-label">{field.label}</span>
        <div className="m-change-diff-values" aria-label={field.label + '修改前后'}>
          <span className="m-change-value-new"><FieldValue field={field} raw={field.nextRaw} value={field.next} onPreview={onPreview} /></span>
          <span className="m-change-value-old"><FieldValue field={field} raw={field.previousRaw} value={field.previous} onPreview={onPreview} /></span>
        </div>
      </div>)}
    </div>}
    {plainFields.length > 0 && <div className="m-change-plain-list">
      {plainFields.map(field => {
        const raw = group.action === '删除' ? field.previousRaw : field.nextRaw;
        const value = group.action === '删除' ? field.previous : field.next;
        return <div className="m-change-plain-row" key={field.key}>
          <span className="m-change-plain-label">{field.label}</span>
          <span className="m-change-plain-value"><FieldValue field={field} raw={raw} value={value} onPreview={onPreview} /></span>
        </div>;
      })}
    </div>}
  </article>;
}

export function ChangeComparison({ before, after, onPreview }) {
  const groups = informationChangeGroups(before, after);
  return <Section title="修改前后对比" collapsible={false}>
    <div className="m-change-comparison">
      {groups.length ? groups.map(group => <ChangeGroup key={group.key} group={group} onPreview={onPreview} />) : <p className="m-change-empty">没有信息变更</p>}
    </div>
  </Section>;
}
