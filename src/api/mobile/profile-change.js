const registerEmail = record => record.basic?.registerEmail ?? record.email ?? '';
const clone = value => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
const byId = entries => new Map(entries.map(entry => [entry.id, entry]));
const isRecordList = value => Array.isArray(value) && value.every(entry => isRecord(entry) && entry.id);

export const emailVersionChanged = '注册邮箱已变化，请刷新供应商资料后重新提交';
export const emailApprovalLocked = '当前注册邮箱正在变更中，待审批完成后方可再次修改';

export function changesBetween(before, after) {
  if (same(before, after) || ((before ?? '') === '' && (after ?? '') === '')) return undefined;
  if (isRecord(before) && isRecord(after)) {
    const changes = Object.fromEntries(Object.keys(after).map(key => [key, changesBetween(before[key], after[key])])
      .filter(([, change]) => change));
    return Object.keys(changes).length ? { changes } : undefined;
  }
  if (isRecordList(before) && isRecordList(after)) {
    const old = byId(before);
    const next = byId(after);
    const removed = [...old.keys()].filter(id => !next.has(id));
    const added = after.filter(entry => !old.has(entry.id));
    const edited = Object.fromEntries(after.filter(entry => old.has(entry.id))
      .map(entry => [entry.id, changesBetween(old.get(entry.id), entry)]).filter(([, change]) => change));
    return removed.length || added.length || Object.keys(edited).length ? { removed, added: clone(added), edited } : undefined;
  }
  return { value: clone(after) };
}

function applyChanges(current, change) {
  if (change.changes) {
    return { ...current, ...Object.fromEntries(Object.entries(change.changes).map(([key, child]) => [key, applyChanges(current?.[key], child)])) };
  }
  if (change.edited) {
    const existing = current || [];
    return [...existing.filter(entry => !change.removed.includes(entry.id))
      .map(entry => Object.hasOwn(change.edited, entry.id) ? applyChanges(entry, change.edited[entry.id]) : entry),
    ...clone(change.added.filter(entry => !existing.some(saved => saved.id === entry.id)))];
  }
  return clone(change.value);
}

export function prepareProfileChange(before, after, { source, number }) {
  const editable = ({ basic, contacts, banks, email }) => ({
    basic: { ...basic, registerEmail: registerEmail({ basic, email }) }, contacts, banks,
  });
  const changes = changesBetween(editable(before), editable(after));
  if (!changes) return null;
  return {
    number, source, changes,
    before: clone({ ...editable(before), name: before.name, type: before.type, code: before.code }),
    after: clone(editable(after)),
    emailVersion: before.emailVersion ?? 0, changesEmail: registerEmail(before) !== registerEmail(after),
  };
}

export function applyProfileChange(current, request) {
  const result = applyChanges(current, request.changes);
  const email = request.changesEmail ? registerEmail(result) : registerEmail(current);
  const name = result.basic.supplierName || result.name;
  return {
    ...result, name, email, basic: { ...result.basic, registerEmail: email },
    supplierFormerName: name !== current.name ? current.name : current.supplierFormerName,
    type: result.basic.type || result.type, code: result.basic.creditCode ?? result.code,
    contact: Array.isArray(result.contacts) ? result.contacts[0]?.name || '' : result.contact,
    phone: Array.isArray(result.contacts) ? result.contacts[0]?.phone || '' : result.phone,
    emailVersion: (current.emailVersion ?? 0) + (request.changesEmail ? 1 : 0),
  };
}
