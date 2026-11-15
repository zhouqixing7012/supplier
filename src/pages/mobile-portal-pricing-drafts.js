import { embeddedPrototype } from './mobile-prototype-runtime.js';
import { attachmentFiles } from '../components/mobile/attachment-session.js';

function draftKey(store, quote, number, index) {
  return JSON.stringify([store.portalAccount?.account ?? null, quote ? 'quote' : 'tax', number, index]);
}

async function runTransaction(mode, action) {
  const db = await new Promise((resolve, reject) => {
    const open = indexedDB.open('supplier-mobile-pricing', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('drafts');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('暂存数据库正在使用'));
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', mode);
      transaction.onabort = () => reject(transaction.error);
      const readResult = action(transaction.objectStore('drafts'));
      transaction.oncomplete = () => resolve(readResult?.());
    });
  } finally {
    db.close();
  }
}

export async function readPricingDraft(store, quote, record) {
  const keys = record.lines.map((_, index) => draftKey(store, quote, record.number, index));
  if (!store.portalAccount || embeddedPrototype) {
    return keys.map(key => store.guestPricingDrafts?.get(key));
  }
  const saved = await runTransaction('readonly', drafts => {
    const requests = keys.map(key => drafts.get(key));
    return () => requests.map(request => request.result);
  });
  return saved.map(entry => {
    if (!entry) return;
    for (const [id, file] of entry.files) {
      if (!attachmentFiles.has(id)) attachmentFiles.set(id, { key: id, file, url: URL.createObjectURL(file), type: file.type, name: file.name });
    }
    return entry.line;
  });
}

export async function savePricingLine(store, quote, number, index, line) {
  const key = draftKey(store, quote, number, index);
  if (!store.portalAccount || embeddedPrototype) {
    (store.guestPricingDrafts ||= new Map()).set(key, line);
    return;
  }
  const keys = Array.isArray(line.attachment) ? line.attachment : [line.attachment];
  const files = [];
  for (const id of new Set(keys)) {
    if (typeof id !== 'string' || !id.startsWith('attachment:')) continue;
    const file = attachmentFiles.get(id)?.file;
    if (!file) throw new Error('本次保存需要重新选择附件');
    files.push([id, file]);
  }
  await runTransaction('readwrite', drafts => { drafts.put({ line, files }, key); });
}

export async function clearPricingDraft(store, quote, record) {
  const keys = record.lines.map((_, index) => draftKey(store, quote, record.number, index));
  if (!store.portalAccount || embeddedPrototype) {
    for (const key of keys) store.guestPricingDrafts?.delete(key);
    return;
  }
  await runTransaction('readwrite', drafts => { for (const key of keys) drafts.delete(key); });
}
