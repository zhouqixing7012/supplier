import React, { useId, useRef, useState } from 'react';
import { AttachmentLink, Confirm } from '../components/mobile/index.js';
import { FileSpreadsheet, Plus, Upload, X } from 'lucide-react';
import { attachmentName, rememberAttachment } from './mobile-interaction.jsx';
import { isSpreadsheetName, spreadsheetAccept } from './mobile-portal-files.js';

export function MultiAttachmentField({ label, value, onChange, onPreview }) {
  const id = useId();
  const input = useRef(null);
  const [removing, setRemoving] = useState(null);
  const files = Array.isArray(value) ? value : value ? [value] : [];
  const pendingFile = removing === null ? null : files[removing];
  return <div className="m-field m-field-inline m-multi-attachment-field" data-field-label={label}>
    <label htmlFor={id}>{label}</label>
    <div className="m-field-control">
      {files.length ? <ul className="m-multi-attachment-list">{files.map((file, index) => <li className="m-multi-attachment-item" key={String(file) + '-' + index}>
        <AttachmentLink value={file} onPreview={onPreview} />
        <button type="button" aria-label={`删除${label}${index + 1}`} title={`删除${attachmentName(file)}`} onClick={() => setRemoving(index)}>删除</button>
      </li>)}</ul> : <p className="m-multi-attachment-empty">暂无附件</p>}
      <input ref={input} id={id} className="m-file-input" type="file" multiple aria-label={label} onChange={event => {
        const selected = Array.from(event.target.files || []);
        if (selected.length) onChange([...files, ...selected.map(file => rememberAttachment(file).key)]);
        event.target.value = '';
      }} />
      <button type="button" className="m-file-select" onClick={() => input.current?.click()}><Plus aria-hidden="true" />添加附件</button>
    </div>
    {removing !== null && pendingFile && <Confirm danger text={`确认删除附件「${attachmentName(pendingFile)}」？`} onCancel={() => setRemoving(null)} onConfirm={() => { onChange(files.filter((_, index) => index !== removing)); setRemoving(null); }} />}
  </div>;
}

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
    {removing && <Confirm danger text={'确认移除' + label + '？'} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setError(''); setRemoving(false); }} />}
  </div>;
}
