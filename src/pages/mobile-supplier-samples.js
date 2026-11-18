import { mobileAsset } from './mobile-prototype-runtime.js';
import { attachmentFiles } from '../components/mobile/attachment-session.js';
import { branches, supplierIndustries, supplierTypes } from './mobile-data.js';

const [enterprise, personal, institution, foreign] = supplierTypes;
const sampleFiles = new Map();
const sampleImage = mobileAsset('mobile-assets/supplier-document-demo.png');
const date = '2026-10-08 09:00:00';
const updated = '2026-10-09 10:00:00';

function sampleFile(id, label) {
  const key = 'mock-file-' + id;
  sampleFiles.set(key, { key, name: label + '.png', url: sampleImage, type: 'image/png' });
  return key;
}

export function registerMobileSupplierSampleFiles() {
  for (const [key, file] of sampleFiles) attachmentFiles.set(key, file);
}

function bank(id, name, number, { branch = branches[0], accountType = '', currency = '人民币' } = {}) {
  return {
    id: id + '-bank-' + number,
    accountType, name, number, currency, bank: branch.bank, branch: branch.name,
    country: branch.country, province: branch.province, city: branch.city,
    proof: sampleFile(id + '-bank-' + number, '开户证明样例'),
  };
}

function contact(id, name, phone, department, job) {
  return { id: id + '-contact', name, phone, department, job, email: id + '@example.invalid' };
}

function supplier({ id, type, name, basic, status = '已审批', contacts = [], banks = [], ...record }) {
  const email = id + '@example.invalid';
  const approved = status === '已审批';
  return {
    id: 'mock-' + id,
    name, type, email, date, updated, banks, contacts, status,
    mode: '代注册', inviter: '陈才慧', score: '未评分', permissions: [],
    contact: contacts[0]?.name || '', phone: contacts[0]?.phone || '',
    code: basic?.creditCode || '',
    basic: { type, supplierName: name, registerEmail: email, ...basic },
    approvalNumber: approved ? 'MOCK-APP-' + id.toUpperCase() : '—',
    approvalNodes: approved ? ['业务审批', '部门领导审批', '财务审批'].map(name => ({
      name, person: '样例' + name + '人', status: '已审批', time: updated,
    })) : [],
    ...record,
  };
}

function registeredPerson({ id, name, certificateType, gender, creditCode, address, cooperation, phone, ...record }) {
  const identityCard = certificateType === '身份证';
  const basic = {
    certificateType, gender, creditCode, country: '国内', address, cooperation,
    establishedAt: '2021-06-01', licenseUntil: identityCard ? '长期' : '2031-05-31',
    email: id + '.contact@example.invalid', mobile: phone, businessAdvantage: '可按约定交付并配合验收',
    proof: sampleFile(id + '-certificate', (identityCard ? '身份证正面' : certificateType) + '样例'),
  };
  if (identityCard) basic.personalSupplierBackPicture = sampleFile(id + '-certificate-back', '身份证反面样例');
  return supplier({ id, name, type: personal, basic, phone: record.contact ? phone : '', ...record });
}

const personalSuppliers = [
  registeredPerson({
    id: 'person-id-card', name: '许澄', certificateType: '身份证', gender: '女', creditCode: 'IDMOCK000120',
    address: '北京市/北京市/朝阳区 样例街12号', cooperation: '专栏撰稿与稿件校对', phone: '10000000120',
    banks: [bank('person-id-card', '许澄', '0000000000120')],
    permissions: [{ id: 'mock-person-id-card-writer', group: '撰稿人权限', category: '撰稿人', note: '稿件结算' }],
  }),
  registeredPerson({
    id: 'person-hkmo-pass', name: '梁映宁', certificateType: '港澳通行证', gender: '女', creditCode: 'HKMOCK000131',
    address: '广东省/广州市/天河区 样例路31号', cooperation: '活动摄影与图片交付', phone: '10000000131',
    banks: [bank('person-hkmo-pass', '梁映宁', '0000000000131')],
  }),
  registeredPerson({
    id: 'person-passport', name: '夏知远', certificateType: '护照', gender: '男', creditCode: 'PPMOCK000142',
    address: '上海市/上海市/浦东新区 样例路42号', cooperation: '外文稿件翻译', phone: '10000000142',
    mode: '邀请注册', invitationNo: 'MOCK-INV-P142', contact: '夏知远',
    banks: [bank('person-passport', '夏知远', '0000000000142')],
  }),
  registeredPerson({
    id: 'person-taiwan-pass', name: '林予安', certificateType: '台湾通行证', gender: '男', creditCode: 'TWMOCK000153',
    address: '福建省/厦门市/思明区 样例路53号', cooperation: '专题图文与视频剪辑', phone: '10000000153',
    banks: [bank('person-taiwan-pass', '林予安', '0000000000153')],
  }),
  registeredPerson({
    id: 'person-draft', name: '温若棠', certificateType: '身份证', gender: '女', creditCode: 'IDMOCK000164',
    address: '天津市/天津市/和平区 样例街64号', cooperation: '栏目插画绘制', phone: '10000000164',
    status: '草稿', banks: [bank('person-draft', '温若棠', '0000000000164', { branch: branches[1] })],
  }),
  supplier({
    id: 'person-invited', type: personal, name: '孟子岳', status: '邀请中', mode: '邀请注册',
    invitationNo: 'MOCK-INV-P175', contact: '孟子岳', phone: '10000000175',
  }),
  supplier({
    id: 'person-registering', type: personal, name: '顾遥', status: '注册中', mode: '邀请注册',
    invitationNo: 'MOCK-INV-P186', contact: '顾遥', phone: '10000000186',
    supplierAccount: 'MOCK_PERSON_P186', basic: { certificateType: '护照' },
  }),
  registeredPerson({
    id: 'person-rejected', name: '何晏清', certificateType: '港澳通行证', gender: '男', creditCode: 'HKMOCK000197',
    address: '广东省/深圳市/南山区 样例路97号', cooperation: '活动现场速记', phone: '10000000197',
    status: '注册驳回', mode: '邀请注册', invitationNo: 'MOCK-INV-P197', contact: '何晏清',
    banks: [bank('person-rejected', '何晏清', '0000000000197')],
    approvalNumber: 'MOCK-APP-P197',
    approvalNodes: [{ person: '样例业务审批人', name: '业务审批', status: '已驳回', time: updated, opinion: '请补充合作事项的交付内容' }],
  }),
];

const organizationSuppliers = [
  supplier({
    id: 'enterprise-technology', type: enterprise, name: '京棠数研科技有限公司',
    supplierAccount: 'MOCK_ENTERPRISE_E210',
    basic: {
      creditCode: 'USCCMOCK0000000210', proof: sampleFile('enterprise-license', '营业执照样例'),
      establishedAt: '2019-04-18', licenseUntil: '长期', legalRepresentative: '齐言舟',
      companyPhone: '010-00000210', companyType: '有限责任公司', industry: supplierIndustries[0],
      capital: '1000', currency: '人民币', country: '国内', address: '北京市/北京市/海淀区 样例园区210号',
      invoiceAddress: '北京市海淀区样例园区210号财务部', website: 'https://enterprise-technology.example.invalid',
      taxpayer: '一般纳税人', businessScope: '信息系统集成及数据技术服务', cooperation: '系统接口开发与维护',
      businessAdvantage: '可提供数据迁移、接口联调和技术支持',
      qualifications: [{
        id: 'mock-qualification-e210', qualificationName: '信息技术服务资质', qualificationLevel: '三级',
        qualificationNo: 'MOCK-QUAL-E210', issuingUnit: '样例资质评审机构',
        qualificationEffectiveBeginDate: '2025-04-01', qualificationEffectiveEndDate: '2028-03-31',
        qualificationCertificatePicture: sampleFile('enterprise-qualification', '资质附件样例'),
      }],
    },
    contacts: [
      contact('enterprise-project', '沈知柯', '10000000210', '项目交付部', '项目联系人'),
      contact('enterprise-finance', '郁兰', '10000000211', '财务部', '付款联系人'),
    ],
    banks: [
      bank('enterprise-technology', '京棠数研科技有限公司', '0000000000210', { accountType: '基本账户' }),
      bank('enterprise-technology', '京棠数研科技有限公司', '0000000000211', { accountType: '一般账户', branch: branches[2] }),
    ],
  }),
  supplier({
    id: 'enterprise-draft', type: enterprise, name: '沐河文创服务有限公司', status: '草稿',
    basic: { creditCode: 'USCCMOCK0000000222', companyType: '有限责任公司', country: '国内' },
  }),
  supplier({
    id: 'institution-center', type: institution, name: '澄川公共文化服务中心',
    basic: { country: '国内', address: '北京市/北京市/西城区 样例路331号', cooperation: '公共文化活动协作', remark: '由活动联络处统一对接' },
    contacts: [contact('institution-center', '方澜', '10000000331', '活动联络处', '项目联系人')],
    banks: [bank('institution-center', '澄川公共文化服务中心', '0000000000331')],
  }),
  supplier({
    id: 'institution-association', type: institution, name: '松原青年艺术交流协会', status: '审批中',
    basic: { country: '国内', address: '天津市/天津市/河西区 样例路342号', cooperation: '公益展览及活动交流' },
    contacts: [contact('institution-association', '齐越', '10000000342', '会员服务处', '活动联系人')],
    banks: [bank('institution-association', '松原青年艺术交流协会', '0000000000342', { branch: branches[1] })],
    approvalNumber: 'MOCK-APP-G342',
    approvalNodes: [{ person: '样例业务审批人', name: '业务审批', status: '待审批', time: '' }],
  }),
  supplier({
    id: 'foreign-studio', type: foreign, name: 'Juniper Crest Localization LLC',
    supplierAccount: 'MOCK_FOREIGN_F460',
    basic: {
      creditCode: 'EIN-MOCK-0000460', proof: sampleFile('foreign-studio-certificate', '国外供应商证书样例'),
      establishedAt: '2017-03-08', licenseUntil: '长期', legalRepresentative: 'Avery Lin',
      capital: '250000', currency: '美元', country: '国外', address: '460 Example Avenue, Seattle, WA, USA',
      cooperation: '视频字幕本地化及母语审校', businessAdvantage: '支持中英文双语交付',
    },
    contacts: [contact('foreign-studio', 'Avery Lin', '+12025550147', 'Localization', 'Project Lead')],
    banks: [bank('foreign-studio', 'Juniper Crest Localization LLC', '0000000000460', { currency: '美元' })],
  }),
  supplier({
    id: 'foreign-design', type: foreign, name: 'Rillstone Design Studio Ltd.', status: '审批中', mode: '邀请注册',
    invitationNo: 'MOCK-INV-F472',
    basic: {
      creditCode: 'BN-MOCK-0000472', proof: sampleFile('foreign-design-certificate', '国外供应商证书样例'),
      establishedAt: '2020-09-11', licenseUntil: '长期', legalRepresentative: 'Morgan Lu',
      companyPhone: '+14165550132', capital: '180000', currency: '美元', country: '国外',
      address: '472 Example Street, Toronto, ON, Canada', cooperation: '海外活动设计支持',
      businessAdvantage: '提供海报制作与多尺寸版式交付',
    },
    contacts: [contact('foreign-design', 'Morgan Lu', '+14165550132', 'Design', 'Project Lead')],
    banks: [bank('foreign-design', 'Rillstone Design Studio Ltd.', '0000000000472', { currency: '美元' })],
    approvalNumber: 'MOCK-APP-F472',
    approvalNodes: [{ person: '样例业务审批人', name: '业务审批', status: '待审批', time: '' }],
  }),
];

export const mobileSupplierSamples = [...personalSuppliers, ...organizationSuppliers];
