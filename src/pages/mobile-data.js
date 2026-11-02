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
export const branches = [
  { name: '中国农业发展银行北京市分行', bank: bankNames[0], country: '中国', province: '北京市', city: '北京市' },
  { name: '中国农业发展银行天津市分行', bank: bankNames[0], country: '中国', province: '天津市', city: '天津市' },
  { name: '中国农业发展银行河北省分行', bank: bankNames[0], country: '中国', province: '河北省', city: '石家庄市' },
];
export const people = [
  { name: '周秋珍', phone: '021-23081605', email: 'qiuzhenzhou@sohu-lab.com', job: '总经理（销售）', department: '广告营销部_华东区域' },
  { name: '周辉', phone: '020-85109344', email: 'huizhou115554@sohu-lab.com', job: '高级总监（产品）', department: '56业务中心_产品部' },
  { name: '周蓉', phone: '010-62726320', email: 'rongzhou@sohu-lab.com', job: '高级经理（媒体内容）', department: '编委会_要闻运营中心_策划报道' },
  { name: '周晶盈', phone: '010-62757525', email: '', job: '', department: '' },
];
export const exampleBank = { id: '112297879', accountType: '基本账户', bank: bankNames[0], branch: branches[0].name, country: '中国', province: '北京市', city: '北京市', name: '牛来豹拉', number: '6214589503254174', currency: '人民币', proof: '开户证明.png', note: '', change: '' };
export const companyName = '北京初然文化传媒有限公司733324';
export const initialSuppliers = [
  { id: '733324', industry: supplierIndustries[0], name: companyName, type: supplierTypes[0], status: '已审批', mode: '代注册', inviter: '陈才慧', date: '2026-10-14 19:20:35', updated: '2026-10-14 19:23:23', score: '未评分', code: '93458847MACA1H2A43', email: 'caihuichen@sohu-lab.com', contact: '', phone: '', banks: [exampleBank], permissions: [{ id: 'p1', group: '差旅权限', category: '飞机', note: '', change: '' }] },
  { id: '557348', industry: supplierIndustries[1], name: '快速创建557348', type: supplierTypes[0], status: '已审批', mode: '快速注册', inviter: '陈才慧', date: '2026-10-14 19:22:50', updated: '2026-10-14 19:24:29', score: '未评分', code: 'M1HDARQPAJ4486AH4P', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: '000253', name: '邀请注册企业000253', type: supplierTypes[0], status: '邀请中', mode: '邀请注册', inviter: '陈才慧', date: '2026-10-14 19:34:49', updated: '2026-10-14 19:34:49', score: '未评分', code: '', email: 'caihuichen@sohu-lab.com', contact: '陈才慧', phone: '18810773091', banks: [], permissions: [] },
  { id: 'draft', name: '代注册草稿', type: supplierTypes[0], status: '草稿', mode: '代注册', inviter: '陈才慧', date: '2026-10-14 19:35:00', updated: '2026-10-14 19:35:00', score: '未评分', code: '', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'old', name: '老六的公司', type: supplierTypes[0], status: '已审批', mode: '代注册', inviter: '陈才慧', date: '2023-07-04 11:31:59', updated: '2026-10-12 18:11:17', score: '55.24', code: '', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'person', name: '哈哈人', type: supplierTypes[1], status: '审批中', mode: '邀请注册', inviter: '周琦星', date: '2026-10-12 16:09:55', updated: '2026-10-12 16:12:38', score: '未评分', code: '12******34', email: '', contact: '', phone: '', banks: [], permissions: [] },
].map(supplier => {
  // 用户授权的会话演示资料，不连接真实账号、审批或联系人服务。
  if (!['733324', '557348', 'old', 'person'].includes(supplier.id)) return supplier;
  const personal = supplier.type === supplierTypes[1];
  const basic = personal ? { supplierName: supplier.name, certificateType: '身份证', gender: '男', creditCode: supplier.code, establishedAt: '2020-01-01', licenseUntil: '2040-01-01', country: '国内', address: '北京市/朝阳区 演示地址1号', email: 'person@example.invalid', mobile: '13800000001', qq: '100001', wechat: 'mock_person', cooperation: '内容创作', remark: '会话样例' } : { supplierName: supplier.name, creditCode: supplier.code, establishedAt: '2018-06-15', licenseUntil: '2038-06-14', legalRepresentative: '林晓', companyPhone: '010-55550001', companyType: '有限责任公司', industry: supplier.industry || supplierIndustries[0], capital: '500', currency: '人民币', country: '国内', address: '北京市/朝阳区 演示园区1号', invoiceAddress: '北京市朝阳区演示园区财务室', website: 'https://supplier.example.invalid', taxpayer: '一般纳税人', listed: '否', branchOffice: '否', businessScope: '软件开发、信息系统集成、技术咨询与维护服务', cooperation: '供应商平台开发与运维', remark: '支持分阶段验收与交付', businessAdvantage: '具备需求分析、研发、测试和运维交付团队，支持多地区项目协作。' };
  const detail = { ...supplier, supplierAccount: 'MOCK_' + supplier.id, supplierFormerName: personal ? '' : '演示企业曾用名', basic, contact: supplier.id === '733324' ? '林晓' : supplier.contact, phone: supplier.id === '733324' ? '13800000001' : supplier.phone };
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

// 每一项对应用户提供的一张截图；同一页面的滚动位置、弹层和选择状态也独立保留。
export const screenshotScenes = [
  ['193749', '供应商查询列表', 'query-old'], ['193804', '供应商查询筛选', 'filter'],
  ['193912', '新增入口展开', 'query-add'], ['193942', '更多操作菜单', 'query-more'],
  ['194416', '详情审批记录空状态', 'detail-approval-empty'], ['194500', '详情银行信息', 'detail-bank'],
  ['194516', '当前审批进度', 'approval'], ['194640', '银行信息截屏提示', 'bank-tip'],
  ['194652', '银行信息列表', 'bank'], ['194919', '新增银行信息', 'bank-form'],
  ['194946', '开户银行选择', 'bank-select'], ['195025', '银行分行选择', 'branch-select'],
  ['195031', '银行选择后表单', 'bank-form-selected'], ['195532', '分配权限列表', 'permissions'],
  ['195559', '新增权限', 'permission-form'], ['195648', '权限新增状态', 'permissions-added'],
  ['195744', '变更邀请人', 'inviter'], ['195759', '人员选择空状态', 'people-empty'],
  ['195809', '人员搜索结果', 'people'], ['195819', '新邀请人已选择', 'inviter-selected'],
  ['195830', '供应商变更中', 'query-changing'], ['195905', '审批进度截屏提示', 'approval-tip'],
  ['195913', '审批进度及历史', 'approval-history'], ['200005', '我的邀请空状态', 'mine-empty'],
  ['200211', '我的邀请批量选择', 'mine-batch'], ['200311', '我的邀请列表', 'mine'],
  ['200321', '导出确认', 'export'], ['200421', '代注册基本信息', 'register-basic-filled'],
  ['200459', '联系人空状态', 'register-contacts-empty'], ['200506', '多联系人录入', 'register-contacts'],
  ['200556', '注册银行空状态', 'register-banks-empty'], ['200800', '注册银行录入', 'register-banks'],
  ['201425', '评分筛选', 'rating-filter'], ['201432', '所属部门空选择器', 'department'],
  ['201444', '供应商评分列表', 'ratings'], ['201526', '评分运维查询', 'rating-ops'],
  ['201627', '银行信息申请须知', 'bank-application'], ['201642', '申请未配置', 'application-empty'],
  ['201829', '供应商批量删除模式', 'query-batch'], ['201837', '新增及导出入口', 'query-export'],
  ['201949', '邀请注册表单', 'invite'], ['202204', '证件有效期选择', 'expiry'],
  ['202541', '注册地址录入', 'address'], ['202547', '省市区选择', 'region'],
  ['202934', '注册银行删除后', 'register-banks-deleted'], ['203223', '移动协同门户登录', 'portal'],
  ['203723', '移动协同门户邮箱验证', 'portal-email'],
].map(([time, title, scene], index) => ({ index: index + 1, time, title, scene, sourceWidth: 1080, sourceHeight: ({ '194652': 2459, '195913': 3110, '200506': 3812, '200800': 3105 })[time] || 2340, filename: `Screenshot_20261014_${time}_com.sohu.ehr.jpg`, href: `#/mobile/shot/${time}` }));

