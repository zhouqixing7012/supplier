import { mobileStorage } from '../../pages/mobile-prototype-runtime.js';
// 会话样本标识也支持本地HTTP预览，仍使用浏览器随机源。
export function createSessionId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
}

export const attachmentFiles = new Map();
export const attachmentName = key => {
  if (attachmentFiles.has(key)) return attachmentFiles.get(key).name;
  if (key && typeof key === 'object') return key.name || '附件';
  if (typeof key !== 'string' || !key.startsWith('attachment:')) return key;
  try { return mobileStorage().getItem('supplier:attachment-name:' + key) || '附件'; } catch { return '附件'; }
};
export function rememberAttachment(file) {
  const key = 'attachment:' + createSessionId();
  const entry = { key, file, url: URL.createObjectURL(file), type: file.type, name: file.name };
  attachmentFiles.set(key, entry);
  try { mobileStorage().setItem('supplier:attachment-name:' + key, file.name); } catch { /* 本次会话仍使用内存中的附件名称。 */ }
  return entry;
}
