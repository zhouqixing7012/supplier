export const bankApplicationNotice = '若邀请注册供应商反馈添加银行信息时，未查询到目标开户银行或分行，可通过本功能补充未收录银行。';

export const bankApplicationFields = [
  { key: 'bank', label: '银行名称', maxLength: 100 },
  { key: 'code', label: '银行编码', maxLength: 100, placeholder: 'Swift码或金融机构代码' },
  { key: 'branch', label: '开户行(分行)名称', maxLength: 100 },
  { key: 'country', label: '国家/地区', options: ['中国'] },
  { key: 'province', label: '开户行省', maxLength: 100 },
  { key: 'city', label: '开户行市', maxLength: 100 },
  { key: 'explanation', label: '申请说明', maxLength: 200, multiline: true },
];

export const bankApplicationRequired = (field) => (field.options ? '请选择' : '请填写') + field.label;
