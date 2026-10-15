// 截图中的内容仅作为原型演示样本，不连接真实供应商、员工、银行或审批服务。
export const supplierTypes = ['企业供应商', '个人供应商', '政府机构', '国外供应商'];
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
  { id: '733324', name: companyName, type: supplierTypes[0], status: '已审批', mode: '代注册', inviter: '陈才慧', date: '2026-10-14 19:20:35', updated: '2026-10-14 19:23:23', score: '未评分', code: '93458847MACA1H2A43', email: 'caihuichen@sohu-lab.com', contact: '', phone: '', banks: [exampleBank], permissions: [{ id: 'p1', group: '差旅权限', category: '飞机', note: '', change: '' }] },
  { id: '557348', name: '快速创建557348', type: supplierTypes[0], status: '已审批', mode: '快速注册', inviter: '陈才慧', date: '2026-10-14 19:22:50', updated: '2026-10-14 19:24:29', score: '未评分', code: 'M1HDARQPAJ4486AH4P', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: '000253', name: '邀请注册企业000253', type: supplierTypes[0], status: '邀请中', mode: '邀请注册', inviter: '陈才慧', date: '2026-10-14 19:34:49', updated: '2026-10-14 19:34:49', score: '未评分', code: '', email: 'caihuichen@sohu-lab.com', contact: '陈才慧', phone: '18810773091', banks: [], permissions: [] },
  { id: 'draft', name: '代注册草稿', type: supplierTypes[0], status: '草稿', mode: '代注册', inviter: '陈才慧', date: '2026-10-14 19:35:00', updated: '2026-10-14 19:35:00', score: '未评分', code: '', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'old', name: '老六的公司', type: supplierTypes[0], status: '已审批', mode: '代注册', inviter: '陈才慧', date: '2023-07-04 11:31:59', updated: '2026-10-12 18:11:17', score: '55.24', code: '', email: '', contact: '', phone: '', banks: [], permissions: [] },
  { id: 'person', name: '哈哈人', type: supplierTypes[1], status: '审批中', mode: '邀请注册', inviter: '周琦星', date: '2026-10-12 16:09:55', updated: '2026-10-12 16:12:38', score: '未评分', code: '12******34', email: '', contact: '', phone: '', banks: [], permissions: [] },
];
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
