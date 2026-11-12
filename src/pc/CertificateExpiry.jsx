import React, { useState } from 'react';
import { Button, DatePicker, Space } from 'antd-pc';
import dayjs from 'dayjs';

export const LONG_TERM = '长期';
export const DATE_FORMAT = 'YYYY-MM-DD';

export function certificateExpiryRules(startKey) {
  return [
    { required: true, message: '请选择证件有效期' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const start = getFieldValue(startKey);
        return value && value !== LONG_TERM && start && dayjs(value).isBefore(start, 'day')
          ? Promise.reject(new Error('证件有效截止日期不能早于起始日期'))
          : Promise.resolve();
      },
    }),
  ];
}

export default function CertificateExpiry({ value, onChange, asText = false, ...props }) {
  const [open, setOpen] = useState(false);
  const longTerm = value === LONG_TERM;
  const date = value && !longTerm ? dayjs(value) : null;

  return <DatePicker {...props} open={open} onOpenChange={setOpen} value={date?.isValid() ? date : null}
    format={DATE_FORMAT} placeholder={longTerm ? LONG_TERM : '请选择证件有效期'}
    className={longTerm ? 'pc-certificate-expiry-long' : undefined}
    locale={{ lang: { ok: '确认' } }} needConfirm showNow={false} allowClear={false}
    onChange={(selected) => onChange?.(asText ? selected?.format(DATE_FORMAT) : selected)}
    renderExtraFooter={() => <Space>
      <Button size="small" type="link" onClick={() => setOpen(false)}>取消</Button>
      <Button size="small" type="link" onClick={() => { onChange?.(LONG_TERM); setOpen(false); }}>长期</Button>
    </Space>} />;
}
