export const registrationPasswordRequirement = '密码须为8–20位，同时包含数字、大写字母和小写字母，且不能包含空格';

export function passwordWhitespaceError(value, label = '密码') {
  return /\s/u.test(value || '') ? label + '不能包含空格' : '';
}

export function registrationPasswordError(value) {
  const whitespaceError = passwordWhitespaceError(value);
  if (whitespaceError) return whitespaceError;
  if (!value.trim()) return '请输入密码';
  if (value.length < 8 || value.length > 20 || !/[0-9]/.test(value) || !/[A-Z]/.test(value) || !/[a-z]/.test(value)) return registrationPasswordRequirement;
  return '';
}
