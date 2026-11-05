// 评审层只维护需求说明，不参与供应商业务数据或正式PRD写入。
export const REVIEW_STORAGE_KEY = 'supplier-mobile-review-v1';
export const REVIEW_VERSION = 1;
export const reviewDefinitions = [
  ['search', '.m-search-row', '搜索与查询', '搜索词保留在搜索框中，结果区不再重复展示关键词。搜索和筛选条件同时影响结果。', 'docs/mobile-prd.md'],
  ['filters', '.m-applied-filters', '查询摘要', '只展示结果数量、已应用的筛选条件及清除筛选入口；管理列表、评分列表和门户列表共用摘要组件。', 'DESIGN.md'],
  ['supplier-actions', '.m-supplier-card', '供应商操作条件', '评分：变更中、已审批。变更邀请人、修改银行、分配权限、修改全部信息：已审批且未拉黑。重新邀请：草稿、注册驳回，进入邀请注册。查询列表删除：草稿、注册驳回；我的邀请删除：邀请中、注册中、草稿、注册驳回。', 'docs/mobile-prd.md'],
  ['records', '.m-record-collection', '资料集合与空态', '联系人、银行、资质共用资料集合。空态时分组标题与插画位于同一白卡内，添加入口位于卡片下方；有记录时展示实际记录卡。查询列表空态直接展示插画。', 'DESIGN.md'],
  ['empty', '.m-empty', '空态容器', '有分组卡片的内容区把插画放在卡片内，标题也在卡片内；无卡片的查询列表直接展示插画，不额外套卡。插画与文案使用公共Empty组件。', 'DESIGN.md'],
  ['record-actions', '.m-card-actions', '卡片操作栏', '卡片操作共用CardActions，统一分隔线、间距、蓝色操作文字及触控高度；整块填充的删除按钮采用#EC221F。', 'DESIGN.md'],
  ['tabs', '.m-tabs', '页签交互', '页签支持点击和左右滑动。资料详情使用胶囊页签；报价和价税列表仅两个页签，等宽居中且不显示页签下拉目录。', 'DESIGN.md'],
  ['steps', '.m-registration-steps', '注册步骤', '第一步默认展开步骤，后续默认折叠，允许手动展开。个人供应商跳过联系人步骤。预览按资料页签展示，不设置分组编辑入口。', 'docs/mobile-prd.md'],
  ['draft', '.m-registration-actions', '注册底部操作', '代注册和邀请注册第一步：保存草稿、下一步；后续：上一步、保存草稿、下一步或提交，保持单行。保存草稿允许资料未填完整；修改全部信息使用既有提交变更流程。', 'docs/mobile-prd.md'],
  ['textarea', '.m-field-block', '多行文本与计数', '字段与值使用14px。字数统计放框内右下角，距右12px、底8px；正文预留底部32px，清空按钮在右上角，普通入口与截图入口一致。', 'DESIGN.md'],
  ['cooperation', '[data-field-label="与搜狐合作事项"]', '合作事项及业务优势', '与搜狐合作事项为必填多行文本；其后展示必填的经营优势及业务优势。注册、修改和详情保持字段一致。', 'docs/mobile-prd.md'],
  ['address', '.m-address-form', '注册地址选择', '同一底部面板内完成省、市、区县与详细地址；选项区域独立滚动，切换层级和搜索归顶，取消/确定固定可见。地区目录当前为前端演示样本。', 'docs/mobile-prototype.md'],
  ['reference', '.m-reference-list', '银行与人员目录', '姓名/名称在左，纯工号和选中标记在右，标题行垂直居中。银行和分行单选即回填关闭；新邀请人保留底部取消/确认。', 'DESIGN.md'],
  ['options', '.m-option-picker', '单选下拉', '简单单选：选项居中、无圆形标记，点击即回填并关闭，不需要确认。搜索或信息目录：名称左对齐、右侧选中标记，普通单选仍点选回填关闭；人员选择、日期及多选按各自确认流程。取消保留原值。', 'DESIGN.md'],
  ['dates', '.m-date-picker', '日期选择', '滚轮日期保留确认，取消不应用本次滚动值；顶部只显示标题，底部取消/确认，避免重复退出入口。', 'DESIGN.md'],
  ['inviter', '[data-field-label="新邀请人"]', '新邀请人', '仅新邀请人必填；人员卡片展示姓名、工号、座机、邮箱、职位及部门，选中后点击确认返回。批量变更邀请人在独立页面办理。', 'docs/mobile-prd.md'],
  ['banks', '.m-bank-fields', '银行账户维护', '选择银行分行后带出国家、省、市。支持新增、编辑和删除；企业供应商基本账户不可删除，通过操作校验拦截，不常驻显示限制说明。', 'docs/mobile-prd.md'],
  ['history', '.m-approval-history', '审批历史', '按审批单号分组为可折叠卡片；展示类型、单号、状态、发起时间及发起人姓名/工号，不在历史卡片重复展示节点记录。', 'docs/mobile-prd.md'],
  ['timeline', '.m-approval-timeline', '当前审批记录', '节点名称和状态放在节点标题，审批时间、审批人及意见在节点正文，意见直接展示。', 'docs/mobile-prd.md'],
  ['login', '.m-portal-login-card', '门户登录', '保留城市背景，登录卡片紧凑居中。邮箱验证码输入框右侧放发送按钮；邮箱验证阶段不展示修改密码入口。', 'DESIGN.md'],
  ['identity', '.m-portal-home-identity', '门户工作台', '供应商只看到名称、账号、注册邮箱及状态，不展示供应商类型和注册方式。账户入口为页面右上角头像，支持修改密码、注册邮箱及退出登录。', 'docs/mobile-prd.md'],
  ['deadline', '.m-quote-deadline', '报价截止提醒', '截止时间与超时自动取消报价资格的说明使用红字；日期和时间之间保留空格。报价完成后从待处理移至已处理，状态为定价完成。', 'docs/mobile-prd.md'],
];
export const reviewSelectors = Object.fromEntries(reviewDefinitions.map(([key, selector]) => [key, selector]));

export function validateReviewImport(value) {
  if (!value || value.version !== REVIEW_VERSION || !Array.isArray(value.notes)) throw new Error('标注文件格式或版本不支持');
  if (value.notes.length > 500) throw new Error('单个标注文件最多包含500条记录');
  const ids = new Set();
  return value.notes.map(note => {
    if (!note || typeof note.id !== 'string' || !note.id || ids.has(note.id)) throw new Error('标注编号缺失或重复');
    ids.add(note.id);
    for (const key of ['scope', 'title', 'body']) if (typeof note[key] !== 'string' || !note[key].trim()) throw new Error('标注缺少页面、标题或需求详情');
    if (note.title.length > 100 || note.body.length > 4000 || note.scope.length > 160 || note.id.length > 250) throw new Error('标注内容超过长度限制');
    const target = note.target;
    if (!target || (target.kind !== 'component' && target.kind !== 'element')) throw new Error('标注定位格式不支持');
    if (target.kind === 'component' && !Object.hasOwn(reviewSelectors, target.key)) throw new Error('标注引用了未支持的组件');
    if (target.kind === 'element' && (!['field', 'action', 'group'].includes(target.type) || typeof target.label !== 'string' || !target.label || target.label.length > 500 || typeof target.context !== 'string' || target.context.length > 500)) throw new Error('标注定位信息不完整');
    return { id: note.id, scope: note.scope, title: note.title.trim(), body: note.body.trim(), target: { ...target }, source: note.source === '已确认' ? '已确认' : '评审批注', doc: ['DESIGN.md', 'docs/mobile-prd.md', 'docs/mobile-prototype.md'].includes(note.doc) ? note.doc : '', updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : '' };
  });
}
