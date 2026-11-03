import React, { useId, useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { Confirm } from './mobile-ui.jsx';
import { attachmentName, rememberAttachment } from './mobile-interaction.jsx';
import { isSpreadsheetName, spreadsheetAccept } from './mobile-portal-files.js';

export function SpreadsheetUploadField({ label, value, onChange }) {
  const id = useId();
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  const filename = attachmentName(value);
  const invalid = error || (value && !isSpreadsheetName(filename) ? '仅支持xls或xlsx文件，请重新选择' : '');
  const receive = file => {
    if (!file) return;
    if (!isSpreadsheetName(file.name)) { setError('仅支持xls或xlsx文件'); return; }
    onChange(rememberAttachment(file).key); setError('');
  };
  return <div className="m-spreadsheet-field" data-field-label={label}>
    <label htmlFor={id}>{label}</label>
    <input id={id} className="m-file-input" type="file" accept={spreadsheetAccept} aria-label={label} aria-invalid={!!invalid} aria-describedby={id + '-hint' + (invalid ? ' ' + id + '-error' : '')} tabIndex={-1} onChange={e => { receive(e.target.files[0]); e.target.value = ''; }} />
    {value && <div className="m-spreadsheet-file"><FileSpreadsheet aria-hidden="true" /><span className="m-attachment-name">{filename}</span><button type="button" aria-label={'移除' + label} onClick={() => setRemoving(true)}><X aria-hidden="true" /></button></div>}
    <button type="button" className="m-file-select" onClick={() => document.getElementById(id).click()}><Upload aria-hidden="true" />{value ? '替换文件' : '选择文件'}</button>
    <p id={id + '-hint'} className="m-file-hint">支持xls、xlsx格式</p>
    {invalid && <p id={id + '-error'} className="m-field-error" role="alert">{invalid}</p>}
    {removing && <Confirm text={'确认移除' + label + '？'} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setError(''); setRemoving(false); }} />}
  </div>;
}
