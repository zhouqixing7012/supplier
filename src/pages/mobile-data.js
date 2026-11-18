// 截图中的内容仅作为原型演示样本，不连接真实供应商、员工、银行或审批服务。
export const supplierTypes = ['企业供应商', '个人供应商', '政府机构', '国外供应商'];
// 原说明书“所属行业”21项；查询字段“供应商推荐”按用户确认采用此目录。
export const supplierIndustries = ["信息传输、计算机服务和软件业","农林牧渔业","采矿业","制造业","电力、热力、燃气及水的生产和供应业","环节和公共设施管理业","建筑业","交通运输、仓储业和邮政业","批发和零售业","住宿、餐饮业","金融、保险业","房地产业","租赁和商务服务业","科学研究、技术服务和地址勘察业","水利、环境和公共设施管理业","居民服务和其他服务业","教育","卫生、社会保障和社会服务业","文化、体育、娱乐业","综合（含投资类、主业不明显）","其他"];
export const supplierStates = ['草稿', '邀请中', '注册中', '审批中', '已审批', '注册驳回', '变更中'];
export const permissionGroups = {
  '差旅权限': ['飞机', '火车', '酒店', '租车'],
  '集团权限': ['集团其他业务'], '视频权限': ['视频其他业务'], '焦点权限': ['焦点其他业务'],
  '媒体权限': ['项目-内容公关传播', '项目-视频拍摄制作', '项目-口碑传播', '项目-线下活动执行', '项目-互动设计开发（VR）', '项目-互动设计开发', '技术-技术提供'],
  '视频版权权限': ['版权采购', '版权自制', '赠送剧集', '付费电影'],
  '集团采购部权限': ['产品订购', '宽带采购', '服务采购'], '培训业务权限': ['培训服务', '培训课程'], '撰稿人权限': ['撰稿人'],
};
export const bankNames = ['中国农业发展银行', '中国进出口银行', '中国工商银行', '中国农业银行', '中国银行'];
export const bankDirectory = bankNames.map(name => ({ name, country: '中国', countryCode: 'CN' }));
export const branches = [
  { name: '中国农业发展银行北京市分行', bank: bankNames[0], country: '中国', province: '北京市', city: '北京市' },
  { name: '中国农业发展银行天津市分行', bank: bankNames[0], country: '中国', province: '天津市', city: '天津市' },
  { name: '中国农业发展银行河北省分行', bank: bankNames[0], country: '中国', province: '河北省', city: '石家庄市' },
];
export const people = [
  { name: '周秋珍', userCode: 'MOCK-001', phone: '021-23081605', email: 'qiuzhenzhou@sohu-lab.com', job: '总经理（销售）', department: '广告营销部_华东区域' },
  { name: '周辉', userCode: 'MOCK-002', phone: '020-85109344', email: 'huizhou115554@sohu-lab.com', job: '高级总监（产品）', department: '56业务中心_产品部' },
  { name: '周蓉', userCode: 'MOCK-003', phone: '010-62726320', email: 'rongzhou@sohu-lab.com', job: '高级经理（媒体内容）', department: '编委会_要闻运营中心_策划报道' },
  { name: '周晶盈', userCode: 'MOCK-004', phone: '010-62757525', email: '', job: '', department: '' },
];
export const exampleBank = { id: '112297879', accountType: '基本账户', bank: bankNames[0], branch: branches[0].name, country: '中国', province: '北京市', city: '北京市', name: '牛来豹拉', number: '6214589503254174', currency: '人民币', proof: '开户证明.png', note: '', change: '' };
export const companyName = '北京初然文化传媒有限公司733324';
export const initialSuppliers = [
  { id: '733324', supplierCode: 'MOCK-SUP-733324', industry: supplierIndustries[0], name: companyName, type: supplierTypes[0], status: '已审批', mode: '代注册', inviter: '陈才慧', date: '2026-10-14 19:20:35', updated: '2026-10-14 19:23:23', score: '未评分', code: '93458847MACA1H2A43', email: 'caihuichen@sohu-lab.com', contact: '', phone: '', banks: [exampleBank], permissions: [{ id: 'p1', group: '差旅权限', category: '飞机', note: '', change: '' }] },
  { id: '557348', industry: supplierIndustries[1], name: '快速创建557348', type: supplierTypes[0], status: '已审批', mode: '快速注册', inviter: '陈才慧', date: '2026-10-14 19:22:50', updated: '2026-10-14 19:24:29', score: '未评分', code: 'M1HDARQPAJ4486AH4P', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: '000253', supplierCode: 'MOCK-SUP-000253', invitationNo: 'MOCK-INV-000253', name: '邀请注册企业000253', type: supplierTypes[0], status: '邀请中', mode: '邀请注册', inviter: '陈才慧', date: '2026-10-14 19:34:49', updated: '2026-10-14 19:34:49', score: '未评分', code: '', email: 'caihuichen@sohu-lab.com', contact: '陈才慧', phone: '18810773091', banks: [], permissions: [] },
  { id: 'draft', name: '代注册草稿', type: supplierTypes[0], status: '草稿', mode: '代注册', inviter: '陈才慧', date: '2026-10-14 19:35:00', updated: '2026-10-14 19:35:00', score: '未评分', code: '', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'old', name: '老六的公司', type: supplierTypes[0], status: '已审批', mode: '代注册', inviter: '陈才慧', date: '2023-07-04 11:31:59', updated: '2026-10-12 18:11:17', score: '55.24', code: '', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'person', supplierCode: 'MOCK-SUP-PERSON', name: '哈哈人', type: supplierTypes[1], status: '审批中', mode: '邀请注册', inviter: '周琦星', date: '2026-10-12 16:09:55', updated: '2026-10-12 16:12:38', score: '未评分', code: '12DEMO0034', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'mock-historical', supplierCode: 'MOCK-SUP-HISTORY', name: '演示历史供应商', type: supplierTypes[0], status: '已审批', mode: '历史供应商', inviter: '周辉', date: '2026-10-10 09:00:00', updated: '2026-10-10 09:00:00', banks: [], permissions: [] },
  { id: 'mock-cooperated', supplierCode: 'MOCK-SUP-COOP', name: '演示供应商·已有合作', type: supplierTypes[0], status: '注册驳回', mode: '邀请注册', inviter: '陈才慧', date: '2026-10-09 09:00:00', updated: '2026-10-09 09:00:00', hasCooperation: true, banks: [], permissions: [] },
  // 用于演示已确认的列表操作状态与拉黑限制。
  ...[['mock-rejected', '注册驳回', false], ['mock-registering', '注册中', false], ['mock-changing', '变更中', false], ['mock-blacklisted', '已审批', true]].map(([id, status, blacklisted]) => ({ id, name: '演示供应商·' + status + (blacklisted ? '·已拉黑' : ''), type: supplierTypes[0], status, blacklisted, mode: '邀请注册', inviter: '陈才慧', date: '2026-10-13 09:00:00', updated: '2026-10-13 10:00:00', score: '未评分', code: '', email: 'supplier@example.invalid', contact: '演示联系人', phone: '13800000001', banks: [], permissions: [] })),
].map(supplier => {
  // 用户授权的会话演示资料，不连接真实账号、审批或联系人服务。
  if (!['733324', '557348', 'old', 'person'].includes(supplier.id)) return supplier;
  const personal = supplier.type === supplierTypes[1];
  const basic = personal ? { supplierName: supplier.name, certificateType: '身份证', gender: '男', creditCode: supplier.code, establishedAt: '2020-01-01', licenseUntil: '2040-01-01', country: '国内', address: '北京市/朝阳区 演示地址1号', email: 'person@example.invalid', mobile: '13800000001', qq: '100001', wechat: 'mock_person', cooperation: '内容创作', remark: '会话样例' } : { supplierName: supplier.name, creditCode: supplier.code, establishedAt: '2018-06-15', licenseUntil: '2038-06-14', legalRepresentative: '林晓', companyPhone: '010-55550001', companyType: '有限责任公司', industry: supplier.industry || supplierIndustries[0], capital: '500', currency: '人民币', country: '国内', address: '北京市/朝阳区 演示园区1号', invoiceAddress: '北京市朝阳区演示园区财务室', website: 'https://supplier.example.invalid', taxpayer: '一般纳税人', businessScope: '软件开发、信息系统集成、技术咨询与维护服务', cooperation: '供应商平台开发与运维', remark: '支持分阶段验收与交付', businessAdvantage: '具备需求分析、研发、测试和运维交付团队，支持多地区项目协作。' };
  const detail = { ...supplier, supplierAccount: 'MOCK_' + supplier.id, supplierFormerName: personal ? '' : '演示企业曾用名', basic, contact: supplier.id === '733324' ? '林晓' : supplier.contact, phone: supplier.id === '733324' ? '13800000001' : supplier.phone };
  // 财务OU与黑名单记录均为会话演示样本，字段按用户截图组织。
  if (supplier.id === '733324') {
    detail.financeOus = [{ id: 'MOCK-OU-001', orgName: 'OU_Corporate Sohu.com Limited_US', liabilityAccount: '502.17.0.21101.0.0.0.0.0', prepayAccount: '502.17.0.13101.C302.0.0.0.0', address: '待定' }];
    detail.blacklistRecords = [
      { id: 'MOCK-BL-002', status: '已移除', applyUser: '陈才慧(208660)', applyTime: '2026-10-23 09:57:22', applyReason: '演示拉黑原因', removeUser: '陈才慧(208660)', removeTime: '2026-10-26 15:39:43', removeReason: '演示移除原因' },
      { id: 'MOCK-BL-001', status: '已移除', applyUser: '陈才慧(208660)', applyTime: '2026-10-22 23:28:45', applyReason: '演示拉黑原因：资料待补充核验', removeUser: '陈才慧(208660)', removeTime: '2026-10-23 09:57:15', removeReason: '演示移除原因：资料已补充并完成核验' },
    ];
  }
  if (personal) {
    detail.blacklisted = true;
    detail.blacklistRecords = [{ id: 'MOCK-BL-003', status: '已拉黑', applyUser: '陈才慧(208660)', applyTime: '2026-10-26 15:39:51', applyReason: '演示拉黑原因', removeUser: '', removeTime: '', removeReason: '' }];
  }
  if (supplier.id === '557348') { basic.businessScope = '农林产品供应与种植技术咨询'; basic.cooperation = '园区绿化材料及农产品供应'; }
  if (supplier.id === '733324') {
    detail.updated = '2026-10-18 14:31:00';
    detail.banks = supplier.banks.map(bank => ({ ...bank, name: supplier.name }));
    detail.approvalNumber = 'MOCK-SUP202610180003';
    detail.currentApprovalType = '资料变更';
    const nodes = (date, opinion) => [
      { id: date + '-start', name: '开始', person: '陈才慧(208660)', status: '已审批', time: date + ' 09:00', opinion: '发起申请', agent: '' },
      { id: date + '-business', name: '业务审批', person: '史小曼(110933)', status: '已审批', time: date + ' 10:20', opinion, agent: '' },
      { id: date + '-finance', name: '财务审批', person: '许丽(111505)', status: '已审批', time: date + ' 14:30', opinion: '资料核对完成，同意。', agent: '' },
    ];
    detail.approvalHistory = [
      { number: 'MOCK-SUP202610160002', type: '银行信息变更', status: '已审批', startedAt: '2026-10-16 09:00', initiator: '陈才慧(208660)', nodes: nodes('2026-10-16', '账户资料与开户证明一致，同意变更。') },
      { number: 'MOCK-SUP202610140001', type: '注册', status: '已审批', startedAt: '2026-10-14 09:00', initiator: '陈才慧(208660)', nodes: nodes('2026-10-14', '注册资料完整，经营范围符合合作需求，同意。') },
    ];
    detail.approvalNodes = [
      ...nodes('2026-10-18', '本次资料更新已完成核对，同意。'),
      { id: 'mock-complete', name: '结束', person: '系统', status: '已审批', time: '2026-10-18 14:31', opinion: '流程结束', agent: '' },
    ];
  }
  return detail;
});

export const cooperation = [
  { id: '2099345533281612001', name: '滴滴出行科技有限公司', type: '技术服务', content: '测试PR授权行', person: '陈才慧', department: '集团总部_ERP部_平台技术部_门户技术', date: '2026-08-14', rated: '2026-09-20 15:06:41', score: '未评分' },
  { id: '2099345533281612000', name: '滴滴出行科技有限公司', type: '技术服务', content: '测试PR授权行', person: '李雨思', department: '搜狐媒体_广告营销部_华东区域_华东服务', date: '2026-08-14', rated: '2026-09-20 12:52:32', score: '未评分' },
  { id: '2099345533281611790', name: '滴滴出行科技有限公司', type: '技术服务', content: '测试PR授权行', person: '陈才慧', department: '', date: '', rated: '', score: '未评分' },
];
