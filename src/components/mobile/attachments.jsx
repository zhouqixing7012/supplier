import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, HelpCircle, Paperclip, Plus, X } from 'lucide-react';
import { attachmentFiles, attachmentName, rememberAttachment } from './attachment-session.js';
import { middleEllipsis } from './attachment-name.js';
import { Confirm, Overlay } from './dialogs.jsx';

export function UploadField({ label, required, value, onChange, help, imageOnly = false }) {
  const id = useId();
  const [error, setError] = useState('');
  useEffect(() => { const show = e => { if (e.detail.includes(label)) setError(e.detail); }; window.addEventListener('mobile-validation', show); return () => window.removeEventListener('mobile-validation', show); }, [label]);
  useEffect(() => setError(''), [value]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInput = useRef(null);
  const cameraInput = useRef(null);
  const fileKind = imageOnly ? '照片' : '照片或文件';
  const receiveFile = file => {
    if (!file) return;
    if (imageOnly && !file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    const entry = rememberAttachment(file);
    onChange(entry.key, file);
  };
  return <div data-field-label={label} className="m-field m-upload-field"><label htmlFor={id}>{required && <em>*</em>}<span className="m-field-name">{label}</span>{help && <button type="button" className="m-help" aria-label={label + "填写说明"} onClick={() => setHelpOpen(true)}><HelpCircle /></button>}</label><div className="m-field-control">
    {value ? <>
      <div className="m-uploaded-document"><AttachmentLink value={value} onPreview={() => setPreviewOpen(true)} /><button type="button" className="m-file-remove" aria-label={'移除' + label} onClick={() => setRemoving(true)}><X aria-hidden="true" /></button></div>
      <div className="m-upload-tools"><button type="button" onClick={() => cameraInput.current?.click()}>拍照</button><button type="button" onClick={() => fileInput.current?.click()}>替换{fileKind}</button></div>
    </> : <div className="m-upload-empty">
      <button className="m-upload-choose" type="button" aria-label={'选择' + label} onClick={() => fileInput.current?.click()}>
        <Paperclip aria-hidden="true" /><span>{imageOnly ? '选择照片' : '选择文件'}</span>
      </button>
      <button className="m-upload-camera" type="button" aria-label={'拍照上传' + label} onClick={() => cameraInput.current?.click()}><Camera aria-hidden="true" /><span>拍照</span></button>
    </div>}
    <input ref={fileInput} className="m-file-input" tabIndex={-1} id={id} type="file" accept={imageOnly ? 'image/*' : undefined} aria-invalid={!!error} aria-describedby={error ? id + '-error' : undefined} aria-label={label} onChange={e => { receiveFile(e.target.files[0]); e.target.value = ''; }} />
    <input ref={cameraInput} className="m-file-input" tabIndex={-1} type="file" accept="image/*" capture="environment" aria-label={label + '拍照选择器'} onChange={e => { receiveFile(e.target.files[0]); e.target.value = ''; }} />
    {previewOpen && <AttachmentViewer value={value} title={label} onClose={() => setPreviewOpen(false)} />}
  </div>{error && <p id={id + "-error"} className="m-field-error" role="alert">{error}</p>}{helpOpen && <Overlay label={label + "填写说明"} onClose={() => setHelpOpen(false)}><h2>{label}</h2><p>{help}</p><div className="m-dialog-actions"><button onClick={() => setHelpOpen(false)}>知道了</button></div></Overlay>}{removing && <Confirm danger text={"确认移除" + label + "？"} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setRemoving(false); }} />}</div>;
}

// 通用文件上传保留实际文件名，不以拍照缩略图代替附件。
export function FileUploadField({ label, value, onChange }) {
  const input = useRef(null);
  const [removing, setRemoving] = useState(false);
  return <div className="m-file-upload-field"><span className="m-file-upload-label">{label}</span>
    <input ref={input} type="file" className="m-file-input" tabIndex={-1} aria-label={label} onChange={e => { const file = e.target.files[0]; if (file) onChange(rememberAttachment(file).key); e.target.value = ''; }} />
    {value && <div className="m-file-upload-entry"><AttachmentLink value={value} onPreview={() => setRemoving('preview')} /><button type="button" className="m-file-remove" aria-label={'移除' + label} onClick={() => setRemoving(true)}><X aria-hidden="true" /></button></div>}
    <button type="button" className="m-file-select" data-empty={!value || undefined} onClick={() => input.current.click()}><Paperclip aria-hidden="true" />{value ? '替换文件' : '选择文件'}</button>
    {removing === 'preview' && <AttachmentViewer value={value} title={label} onClose={() => setRemoving(false)} />}
    {removing === true && <Confirm danger text={'确认移除' + label + '？'} onCancel={() => setRemoving(false)} onConfirm={() => { onChange(''); setRemoving(false); }} />}
  </div>;
}

export function AttachmentLink({ value, onPreview }) {
  const [opened, setOpened] = useState(false);
  const name = attachmentName(value);
  const [displayName, setDisplayName] = useState(name);
  const ref = useRef(null);
  useEffect(() => {
    let active = true;
    const fit = () => {
      const node = ref.current;
      if (!node || !active) return;
      const style = getComputedStyle(node);
      const width = node.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0) - 20;
      if (width <= 0) return;
      const context = document.createElement('canvas').getContext('2d');
      context.font = getComputedStyle(node.querySelector('span')).font;
      let low = 5, high = Array.from(name).length;
      if (context.measureText(name).width <= width) { setDisplayName(name); return; }
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (context.measureText(middleEllipsis(name, middle)).width <= width) low = middle;
        else high = middle - 1;
      }
      setDisplayName(middleEllipsis(name, low));
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(ref.current);
    document.fonts.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, [name]);
  return <><button ref={ref} type="button" className="m-attachment-reference" title={name} aria-label={'查看附件：' + name} onClick={() => onPreview ? onPreview(value) : setOpened(true)}><span>{displayName}</span><img className="m-attachment-link-icon" src="/mobile-assets/workbench/attachment-link.svg" alt="" width="16" height="16" /></button>{opened && <AttachmentViewer value={value} onClose={() => setOpened(false)} />}</>;
}

export function AttachmentViewer({ value, title = '查看附件', onClose }) {
  const [opened, setOpened] = useState(false);
  const [resolved, setResolved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => () => { if (resolved) URL.revokeObjectURL(resolved.url); }, [resolved]);

  const file = attachmentFiles.get(value) || resolved;
  const name = attachmentName(value);
  const isImage = file?.type.startsWith('image/');
  const canResolve = !!value?.fileId && typeof window.__SUPPLIER_ATTACHMENT_DOWNLOAD__ === 'function';
  async function open() {
    if (file) { setOpened(true); return; }
    if (!canResolve || busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    try {
      const content = await window.__SUPPLIER_ATTACHMENT_DOWNLOAD__({ fileId: value.fileId, signal: controller.signal });
      if (!(content instanceof Blob) || !content.size) throw new Error('附件暂不可用，请联系提供方补充。');
      if (!controller.signal.aborted) {
        setResolved({ url: URL.createObjectURL(content), type: content.type });
        setOpened(true);
      }
    } catch {
      if (!controller.signal.aborted) setError('附件打开失败，请重试或联系提供方。');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return <Overlay label="查看附件" onClose={onClose} sheet><div className="m-attachment-viewer">
    <div className="m-picker-title"><strong>{opened ? name : title}</strong><button type="button" aria-label="关闭附件" onClick={onClose}><X /></button></div>
    {!opened ? <>
      <p className="m-attachment-count">共 1 个附件</p>
      <div className="m-attachment-list"><button type="button" className="m-attachment-file selected" aria-label={'预览' + name} disabled={busy || (!file && !canResolve)} onClick={open}>
        <span className="m-file-icon"><img src="/mobile-assets/workbench/file.svg" alt="" /></span><span><strong>{name}</strong><small>{isImage ? '图片附件' : file || canResolve ? '文件附件' : '附件暂不可用'}</small></span>
      </button></div>
      {error && <p className="m-attachment-unavailable" role="alert">{error}</p>}
      {!file && !canResolve && <p className="m-attachment-unavailable">附件暂不可用，请联系提供方补充。</p>}
      <div className="m-picker-actions"><button type="button" onClick={onClose}>返回</button><button type="button" className="primary" disabled={busy || (!file && !canResolve)} onClick={open}>{busy ? '正在打开…' : '打开附件'}</button></div>
    </> : <>
      <div className="m-attachment-content">{isImage ? <a href={file.url} target="_blank" rel="noreferrer" aria-label="打开原图"><img className="m-attachment-full" src={file.url} alt={name} /></a> : <p>此文件不支持图片预览。<a href={file.url} target="_blank" rel="noreferrer">打开文件</a></p>}<p><a href={file.url} download={name}>下载原件</a></p></div>
      <div className="m-picker-actions"><button type="button" onClick={() => setOpened(false)}>返回附件列表</button><button type="button" className="primary" onClick={onClose}>关闭</button></div>
    </>}
  </div></Overlay>;
}

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
      </li>)}</ul> : null}
      <input ref={input} id={id} className="m-file-input" type="file" multiple aria-label={label} onChange={event => {
        const selected = Array.from(event.target.files || []);
        if (selected.length) onChange([...files, ...selected.map(file => rememberAttachment(file).key)]);
        event.target.value = '';
      }} />
      <button type="button" className="m-file-select" data-empty={!files.length || undefined} onClick={() => input.current?.click()}><Plus aria-hidden="true" />添加附件</button>
    </div>
    {removing !== null && pendingFile && <Confirm danger text={`确认删除附件「${attachmentName(pendingFile)}」？`} onCancel={() => setRemoving(null)} onConfirm={() => { onChange(files.filter((_, index) => index !== removing)); setRemoving(null); }} />}
  </div>;
}
