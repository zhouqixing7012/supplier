import React, { useRef, useState } from 'react';
import { Button, DatePicker } from 'antd-pc';
import dayjs from 'dayjs';
import zhCN from 'antd-pc/es/date-picker/locale/zh_CN';

export const LONG_TERM = '长期';
export const DATE_FORMAT = 'YYYY-MM-DD';
const expiryLocale = { ...zhCN, lang: { ...zhCN.lang, ok: '确认' } };

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
  const selectedLongTerm = useRef(false);
  const longTerm = value === LONG_TERM;
  const date = value && !longTerm ? dayjs(value) : null;

  return <DatePicker {...props} open={open} value={date?.isValid() ? date : null}
    onOpenChange={(nextOpen) => {
      if (nextOpen) selectedLongTerm.current = false;
      setOpen(nextOpen);
    }}
    format={DATE_FORMAT} placeholder={longTerm ? LONG_TERM : '请选择证件有效期'}
    className={longTerm ? 'pc-certificate-expiry-long' : undefined}
    classNames={{ popup: { root: 'pc-register-picker-popup pc-certificate-expiry-popup' } }}
    locale={expiryLocale} needConfirm showNow={false} allowClear={false}
    onChange={(selected) => {
      // 日历关闭时可能再次提交暂存日期，保留本次明确选中的长期。
      if (!selectedLongTerm.current) onChange?.(asText ? selected?.format(DATE_FORMAT) : selected);
    }}
    renderExtraFooter={() => <Button size="small" type={longTerm ? 'default' : 'text'}
      aria-pressed={longTerm} onClick={() => {
        selectedLongTerm.current = true;
        onChange?.(LONG_TERM);
        setOpen(false);
      }}>
      {longTerm ? '已设为长期' : '设为长期'}
    </Button>} />;
}
