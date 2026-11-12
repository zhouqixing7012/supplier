import React from 'react';
import { DatePicker } from 'antd-pc';
import dayjs from 'dayjs';
import zhCN from 'antd-pc/es/date-picker/locale/zh_CN';
import { DATE_FORMAT } from './CertificateExpiry.jsx';

export default function DateField({ value, onChange, asText = false, ...props }) {
  const date = value ? dayjs(value) : null;
  return <DatePicker {...props} locale={zhCN} format={DATE_FORMAT}
    classNames={{ popup: { root: 'pc-register-picker-popup' } }}
    value={date?.isValid() ? date : null}
    onChange={(selected) => onChange?.(asText ? selected?.format(DATE_FORMAT) || '' : selected)} />;
}
