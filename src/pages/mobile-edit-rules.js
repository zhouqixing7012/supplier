// 原型公共业务规则，目录资料来自移动端演示数据。
export function withAccountBank(account, bankName, directory) {
  const bank = directory.find(item => item.name === bankName);
  return { ...account, bank: bankName, branch: '', country: bank?.country || '', province: '', city: '' };
}

export function restoreBankDirectoryFields(account, directory, branches) {
  if (!account.bank) return account;
  const bank = directory.find(entry => entry.name === account.bank);
  const branch = branches.find(entry => entry.bank === account.bank && entry.name === account.branch);
  const country = account.country?.trim() ? account.country : bank?.country || account.country;
  const province = account.province?.trim() ? account.province : branch?.province || account.province;
  const city = account.city?.trim() ? account.city : branch?.city || account.city;
  if (country === account.country && province === account.province && city === account.city) return account;
  return { ...account, country, province, city };
}

export const effectiveBasicBankDeleteError = '企业供应商基本账户不可删除';

export function isEffectiveBasicBankAccount(account, baseline, company) {
  return company && !!account?.id && baseline.some(entry => entry.id === account.id && entry.accountType === '基本账户');
}

export function bankAccountsError(accounts, company, baseline = []) {
  const active = accounts.filter(account => account.change !== '删除');
  if (company && baseline.some(account => account.accountType === '基本账户' && !active.some(entry => entry.id === account.id))) {
    return effectiveBasicBankDeleteError;
  }
  if (company && active.filter(account => account.accountType === '基本账户').length !== 1) {
    return '企业供应商必须有且只有一个基本账户';
  }
  return '';
}

export function reinviteCandidate(records, name, inviter, excludedId) {
  const normalized = (name || '').trim();
  if (!normalized) return undefined;
  return records.find(record => record.id !== excludedId && record.inviter === inviter
    && (record.name || '').trim() === normalized && ['草稿', '注册驳回'].includes(record.status));
}
export function informationSteps(personal) { return personal ? [0, 2, 3] : [0, 1, 2, 3]; }

export const personalCertificateTypes = ['身份证', '港澳通行证', '护照', '台湾通行证'];

export function personalCertificatePhotoFields(type) {
  if (!type) return [];
  if (type === '身份证') return [['proof', '身份证正面照片'], ['personalSupplierBackPicture', '身份证反面照片']];
  return [['proof', '证件照片']];
}

export function personalCertificatePhotoError(basic) {
  const missingPhoto = personalCertificatePhotoFields(basic.certificateType).find(([key]) => !basic[key]);
  return missingPhoto ? '请上传' + missingPhoto[1] : '';
}

export const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
export function registrationEmailError(value) {
  if (!(value || '').trim()) return '请填写供应商注册邮箱';
  return validEmail(value) ? '' : '请输入正确的供应商注册邮箱';
}
export { middleEllipsis } from '../components/mobile/attachment-name.js';
