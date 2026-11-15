const mobileLinks = [
  { key: '/mobile', label: '移动端' },
  { key: '/mobile/page-map', label: '移动端原型导图' },
  { key: '/mobile/components', label: '移动端组件库' },
  { key: '/mobile/portal', label: '协同门户移动端' },
  { key: '/mobile/register-supplier', label: '新供应商注册（移动端）' },
];

export function otherWorkspaceFeatures(pcLink) {
  return { key: 'other-features', label: '其他功能', children: [pcLink, ...mobileLinks] };
}
