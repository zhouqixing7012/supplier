export const registrationPasswordRequirement = '密码须为8–20位，且同时包含数字、大写字母和小写字母';

export function registrationPasswordError(value) {
  if (!value.trim()) return '请输入密码';
  if (value.length < 8 || value.length > 20 || !/[0-9]/.test(value) || !/[A-Z]/.test(value) || !/[a-z]/.test(value)) return registrationPasswordRequirement;
  return '';
}
