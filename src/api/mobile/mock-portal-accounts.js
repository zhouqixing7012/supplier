import { exampleBank } from '../../pages/mobile-data.js';
import { filledBasic } from './mock-registration-fixture.js';

export const portalDemoAccounts = [
  { account: 'supplier-demo', password: '123456', email: 'supplier@example.com', name: '协同门户演示供应商' },
  { account: 'supplier-email', password: '234567', email: 'email-review@example.com', name: '邮箱变更演示供应商' },
  { account: 'supplier-profile', password: '345678', email: 'profile-review@example.com', name: '资料变更演示供应商' },
];

export function createPortalDemoSuppliers(inviter) {
  return portalDemoAccounts.map(({ account, name, email }, index) => {
    const id = 'mock-' + account;
    const code = 'DEMO-PORTAL-' + (index + 1);
    const basic = {
      ...structuredClone(filledBasic),
      supplierName: name,
      registerEmail: email,
      creditCode: code,
      address: '北京市/北京市/朝阳区 演示地址',
      businessScope: '技术与电子产品服务',
      cooperation: '平台技术服务',
      businessAdvantage: '技术服务与项目交付经验',
    };
    return {
      id, account, inviter, name, type: basic.type, email, emailVersion: 0, code, basic,
      status: '已审批', mode: '邀请注册', date: '2026-10-13', score: '未评分', permissions: [],
      contacts: [{ id: id + '-contact', name: '演示联系人', phone: '13800000000', email: 'contact@example.com', department: '', job: '', wechat: '', note: '' }],
      banks: [{ ...structuredClone(exampleBank), id: id + '-bank', name }],
    };
  });
}
