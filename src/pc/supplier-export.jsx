import React, { useState } from 'react';
import { App, DatePicker, Form } from 'antd-pc';
import { DetailGrid, DetailItem } from '../erp/DetailGrid.jsx';
import { PcModal } from '../erp/components.jsx';
import { exportSupplierRows } from '../pages/mobile-export.jsx';

const filterLabels = {
  name: '搜索关键词',
  type: '供应商类型',
  status: '供应商状态',
  recommended: '供应商推荐',
  inviter: '邀请人',
  certificate: '证件号码',
  registrationNumber: '注册编号',
};

export function SupplierExportModal({ open, ...props }) {
  return open ? <ExportConfirmation {...props} /> : null;
}

function ExportConfirmation({ mine = false, initial = {}, suppliers, onClose }) {
  const [start, setStart] = useState(initial.start || null);
  const [end, setEnd] = useState(initial.end || null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const { message } = App.useApp();

  const from = start?.format('YYYY-MM-DD');
  const to = end?.format('YYYY-MM-DD');
  const rows = suppliers.filter((supplier) => {
    const date = String(supplier.date || '').slice(0, 10);
    return date && (!from || date >= from) && (!to || date <= to);
  });
  const conditions = Object.entries(filterLabels).filter(([key]) => String(initial[key] ?? '').trim());
  const changeDate = (setter) => (value) => {
    setter(value);
    setErrors({});
  };
  const close = () => { if (!busy) onClose(); };
  const submit = async () => {
    if (busy) return;
    const next = {};
    if (!from) next.start = '请选择邀请时间（起）';
    if (!to) next.end = '请选择邀请时间（止）';
    if (from && to && from > to) next.end = '邀请开始时间不能晚于结束时间';
    if (Object.keys(next).length) return setErrors(next);
    if (!rows.length) return setErrors({ general: '没有符合条件的供应商，请调整导出条件' });

    setErrors({});
    setBusy(true);
    // 先呈现导出中状态，再生成本地演示文件。
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    try {
      exportSupplierRows(rows, mine);
      message.success('已生成导出文件');
      onClose();
    } catch (error) {
      setErrors({ general: error instanceof Error && error.message ? '导出失败：' + error.message : '导出失败，请重试' });
      setBusy(false);
    }
  };

  return <PcModal open title="导出供应商" width={640} okText={busy ? '导出中' : '导出'}
    cancelText="取消" onCancel={close} onOk={submit} confirmLoading={busy}
    cancelButtonProps={{ disabled: busy }} closable={!busy} maskClosable={false} keyboard={!busy}>
    <Form layout="vertical">
      <Form.Item label="邀请时间（起）" htmlFor="pc-export-start" required validateStatus={errors.start ? 'error' : undefined} help={errors.start}>
        <DatePicker id="pc-export-start" value={start} format="YYYY-MM-DD" onChange={changeDate(setStart)} disabled={busy} />
      </Form.Item>
      <Form.Item label="邀请时间（止）" htmlFor="pc-export-end" required validateStatus={errors.end ? 'error' : undefined} help={errors.end}>
        <DatePicker id="pc-export-end" value={end} format="YYYY-MM-DD" onChange={changeDate(setEnd)} disabled={busy} />
      </Form.Item>
    </Form>
    <DetailGrid columns={1} labelWidth={108}>
      {conditions.map(([key, label]) => <DetailItem key={key} label={label}>{initial[key]}</DetailItem>)}
      <DetailItem label="符合条件"><span role="status">{rows.length} 家供应商</span></DetailItem>
    </DetailGrid>
    {errors.general && <p className="ant-form-item-explain-error" role="alert">{errors.general}</p>}
  </PcModal>;
}
