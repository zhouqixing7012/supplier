import React, { useState } from 'react';
import { Actions, Overlay, Row } from '../components/mobile/index.js';
import { Field } from './mobile-ui.jsx';

// 前端原型使用会话数据生成CSV，不伪造服务端任务和下载地址。
export function exportSupplierRows(rows, mine = false) {
  if (!rows.length) throw new Error('没有符合条件的供应商，请调整导出条件');
  const columns = mine ? [
    ['注册编号', s => s.documentNo], ['供应商类型', s => s.type], ['供应商名称', s => s.name], ['证件号码', s => s.code], ['审批状态', s => s.status],
    ['联系人姓名', s => s.contact], ['联系人邮箱', s => s.email], ['联系人电话', s => s.phone], ['邀请时间', s => s.date], ['更新时间', s => s.updated],
  ] : [
    ['注册编号', s => s.documentNo], ['供应商类型', s => s.type], ['供应商名称', s => s.name], ['证件号码', s => s.code], ['审批状态', s => s.status],
    ['联系人姓名', s => s.contact], ['联系人电话', s => s.phone], ['联系人邮箱', s => s.email], ['邀请人姓名', s => s.inviter], ['邀请人电话', s => s.inviterPhone],
    ['邀请人工号', s => s.inviterCode], ['邀请人部门板块', s => s.inviterDeptPart], ['邀请人部门', s => s.inviterDept], ['邀请人部门编号', s => s.inviterDeptCode], ['邀请人部门全路径', s => s.inviterFullDept], ['邀请时间', s => s.date], ['更新时间', s => s.updated],
  ];
  const cell = value => { const text = String(value ?? ''); return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"'; };
  const content = '\uFEFF' + [columns.map(([label]) => label), ...rows.map(s => columns.map(([, read]) => read(s)))].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = (mine ? '我的邀请' : '供应商查询') + '-演示数据.csv';
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
}

export function SupplierExport({ suppliers, initial = {}, query = '', onClose, onExport, busy = false }) {
  const [dates, setDates] = useState({ start: initial.start || '', end: initial.end || '' });
  const [errors, setErrors] = useState({});
  const labels = { type: '供应商类型', status: '供应商状态', recommended: '供应商推荐', inviter: '邀请人' };
  const conditions = Object.entries(labels).filter(([key]) => initial[key]);
  const count = suppliers.filter(s => (!dates.start || s.date.slice(0, 10) >= dates.start) && (!dates.end || s.date.slice(0, 10) <= dates.end)).length;
  const changeDate = (key, value) => { setDates(old => ({ ...old, [key]: value })); setErrors({}); };
  const submit = async () => {
    const next = {};
    if (!dates.start) next.start = '请选择邀请时间（起）';
    if (!dates.end) next.end = '请选择邀请时间（止）';
    if (dates.start && dates.end && dates.start > dates.end) next.end = '邀请时间（止）不能早于邀请时间（起）';
    if (Object.keys(next).length) return setErrors(next);
    if (!count) return setErrors({ general: '没有符合条件的供应商，请调整导出条件' });
    const error = await onExport(dates);
    if (error) setErrors({ general: error });
  };
  return <Overlay sheet label="导出供应商" onClose={() => { if (!busy) onClose(); }}><div className="m-export-panel">
    <div className="m-picker-title"><strong>导出供应商</strong></div>
    <div className="m-export-conditions">
      <Field label="邀请时间（起）" required type="date" layout="inline" allowClearDate value={dates.start} error={errors.start} onChange={v => changeDate('start', v)} />
      <Field label="邀请时间（止）" required type="date" layout="inline" allowClearDate value={dates.end} error={errors.end} onChange={v => changeDate('end', v)} />
      {query && <Row label="搜索关键词">{query}</Row>}
      {conditions.map(([key, label]) => <Row key={key} label={label}>{initial[key]}</Row>)}
      <Row label="符合条件">{count} 家供应商</Row>
      {errors.general && <p className="m-field-error" role="alert">{errors.general}</p>}
    </div>
    <Actions flat items={[{ label: '取消', secondary: true, disabled: busy, onClick: onClose }, { label: busy ? '导出中…' : '导出', disabled: busy, onClick: submit }]} />
  </div></Overlay>;
}
