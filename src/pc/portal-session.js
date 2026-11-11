// 仅保存原型工作区所需的演示账号，不保存密码或验证码。
const accountKey = 'supplier:pc-portal-demo-account';

export function readPortalAccount() {
  try { return sessionStorage.getItem(accountKey) || ''; }
  catch { return ''; }
}

export function savePortalAccount(account) {
  sessionStorage.setItem(accountKey, account);
}

export function clearPortalAccount() {
  sessionStorage.removeItem(accountKey);
}
