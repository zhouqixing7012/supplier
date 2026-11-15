// 采购邮件的正式链接和授权契约待联调。以下入口只读取专用账号的演示数据。
export const demoProcurementAccount = 'supplier-demo';

export function readProcurementNotice(search) {
  const params = new URLSearchParams(search);
  const tasks = params.getAll('task');
  const numbers = params.getAll('record');
  if (tasks.length !== 1 || numbers.length !== 1) return null;
  const [task] = tasks;
  const [record] = numbers;
  if (!['quote', 'tax'].includes(task) || !/^[A-Za-z0-9._-]{1,128}$/.test(record)) return null;
  return { task, record };
}

export function procurementNoticeRoute(search) {
  const notice = readProcurementNotice(search);
  return notice ? 'workspace-procurement?' + new URLSearchParams(notice) : '';
}

export function findDemoProcurementTask(notice, account, records) {
  if (!notice || account?.account !== demoProcurementAccount) return null;
  return records.find(record => record.number === notice.record && ['待处理', '已处理'].includes(record.status)) ?? null;
}
