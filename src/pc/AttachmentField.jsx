import React, { useEffect, useState } from 'react';
import { App, Button, Space, Upload } from 'antd-pc';
import { PcModal } from '../erp/components.jsx';
import { attachmentFiles, attachmentName, rememberAttachment } from '../pages/mobile-interaction.jsx';

export default function AttachmentField({ id, value, onChange, readOnly = false, storeAsKey = false }) {
  const [preview, setPreview] = useState(false);
  const [localUrl, setLocalUrl] = useState('');
  const { modal } = App.useApp();
  const file = typeof File !== 'undefined' && value instanceof File ? value : null;
  useEffect(() => {
    if (!file) { setLocalUrl(''); return; }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const entry = typeof value === 'string' ? attachmentFiles.get(value) : null;
  const name = file?.name || (typeof value === 'string' ? attachmentName(value) : value?.name) || '';
  const url = file ? localUrl : entry?.url;
  const type = file?.type || entry?.type || '';
  const displayName = name.length > 28 ? name.slice(0, 16) + '…' + name.slice(-10) : name;
  if (readOnly && !value) return '—';
  return <Space wrap size={4} style={{ maxWidth: '100%' }}>
    {value && (url ? <Button type="link" size="small" title={name} aria-label={'查看附件：' + name}
      onClick={() => setPreview(true)}>{displayName}</Button>
      : <span title={name + '（原文件不可用）'} style={{ overflowWrap: 'anywhere' }}>{displayName}</span>)}
    {!readOnly && <Upload showUploadList={false} beforeUpload={(selected) => {
      onChange?.(storeAsKey ? rememberAttachment(selected).key : selected);
      setPreview(false);
      return Upload.LIST_IGNORE;
    }}><Button id={id}>{value ? '替换附件' : '选择附件'}</Button></Upload>}
    {!readOnly && value && <Button danger type="link" size="small" onClick={() => modal.confirm({
      centered: true, className: 'pc-confirm', title: '确认移除附件？', okText: '移除', cancelText: '取消',
      onOk: () => { onChange?.(undefined); setPreview(false); },
    })}>移除附件</Button>}
    {preview && url && <PcModal open title="查看附件" onCancel={() => setPreview(false)} footer={<Button onClick={() => setPreview(false)}>关闭</Button>}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {type.startsWith('image/') && <img src={url} alt={name} style={{ display: 'block', maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain' }} />}
        <span style={{ overflowWrap: 'anywhere' }}>{name}</span>
        {!type.startsWith('image/') && <span>请下载后查看此文件。</span>}
        <a href={url} download={name}>下载附件</a>
      </Space>
    </PcModal>}
  </Space>;
}
