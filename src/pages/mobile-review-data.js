// 预置标注逐项关联正式PRD和具体页面；旧锚点仅用于兼容本机已保存标注。
export const REVIEW_STORAGE_KEY = 'supplier-mobile-review-v1';
export const REVIEW_VERSION = 1;
export const reviewDefinitions = [
  [
    "prd-1.1-entry",
    ".m-supplier-card .m-card-actions button, .m-action-sheet button",
    "1.1 供应商查询列表无法评分",
    "定位：供应商记录的评分入口。供应商为变更中或已审批时可评分；点击带入当前供应商及邀请资料。提交前重新校验状态，返回保留查询条件。",
    "docs/mobile-prd.md",
    [
      "query*"
    ]
  ],
  [
    "prd-1.1-editor",
    ".m-rating-dimensions",
    "1.1 供应商查询列表无法评分",
    "定位：各项评分。合作类型、合作事项及各项评分必填，各项0.5～5分，支持半分。切换合作类型且已有评分时，确认后清空原评分项；合作事项及评价保留。成功后关联同一供应商，正式规则计算总分。",
    "docs/mobile-prd.md",
    [
      "rating-edit",
      "rating-detail"
    ]
  ],
  [
    "prd-1.2-bank-actions",
    ".m-bank-card .m-card-actions",
    "1.2 银行及分配权限操作出现在供应商列表",
    "定位：银行账户的修改、删除。仅处理所选账户；删除前核对银行、账户名称及尾号，基本账户执行保留校验。单条保存与整体提交分别办理。",
    "docs/mobile-prd.md",
    [
      "bank*",
      "register*",
      "workspace-info"
    ]
  ],
  [
    "prd-1.2-permission",
    ".m-card-actions, [data-field-label=\"所属权限\"]",
    "1.2 银行及分配权限操作出现在供应商列表",
    "定位：权限记录的操作及编辑。所属权限、权限分类必填，更换所属权限清空原分类；备注最多100字符。保存此权限后回到当前供应商的维护列表。",
    "docs/mobile-prd.md",
    [
      "permissions*",
      "permission-form"
    ]
  ],
  [
    "prd-1.3-bank",
    "[data-field-label=\"开户银行\"], .m-reference-list",
    "1.3 银行及分行选择信息显示不完整",
    "定位：开户银行及银行目录。可按完整银行名称搜索，展示银行全称、国家地区代码及国家地区；选择后回填本次账户。",
    "docs/mobile-prd.md",
    [
      "bank*",
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.3-branch",
    "[data-field-label=\"银行分行\"]",
    "1.3 银行及分行选择信息显示不完整",
    "定位：银行分行。以开户银行限制分行范围；名称使用正式全称，分别展示所属银行、国家地区、省、市。更换银行清空原分行及地区，重新选定后一起回填。",
    "docs/mobile-prd.md",
    [
      "bank*",
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.4",
    ".m-bank-fields [data-field-label=\"银行账号\"]",
    "1.4 添加银行提交异常",
    "定位：银行账户填写。账号按文本保存前导零；账户名称最多100字符，账号最多50字符。银行、分行、账户名称、账号、币种必填；企业还需账户类型和开户证明。单条保存失败保留输入及附件，成功返回当前业务的银行列表。",
    "docs/mobile-prd.md",
    [
      "bank*",
      "register*",
      "workspace-info"
    ]
  ],
  [
    "prd-1.5",
    ".m-bank-fields [data-field-label=\"开户所在省\"]",
    "1.5 草稿修改银行关联地区未回填",
    "定位：草稿银行的关联地区。进入时回填原银行、分行、国家、省、市；更换分行整体更新地区。取消恢复原账户，保存草稿及再次预览保持一致。",
    "docs/mobile-prd.md",
    [
      "register-edit",
      "register-edit-all",
      "bank*"
    ]
  ],
  [
    "prd-1.6-entry",
    ".m-supplier-card .m-card-actions button, .m-action-sheet button",
    "1.6 已审批供应商缺少修改全部信息入口",
    "定位：我的邀请中的修改全部信息入口。具备修改权限、已审批且未拉黑时可进入，完整带入已生效的基本信息、注册邮箱、附件、联系人和银行账户。",
    "docs/mobile-prd.md",
    [
      "mine*"
    ]
  ],
  [
    "prd-1.6-form",
    ".m-registration-steps",
    "1.6 已审批供应商缺少修改全部信息入口",
    "定位：修改全部信息步骤。个人按基本信息、银行信息、预览三步，其余按四步办理；前后切换保留填写。正式变更生效后同步更新注册邮箱。",
    "docs/mobile-prd.md",
    [
      "register-edit-all"
    ]
  ],
  [
    "prd-1.7-list",
    ".m-status-tabs, .m-rating-list",
    "1.7 我的评分缺少填写、修改及详情",
    "定位：我的评分列表及状态。未评分可填写，已评分可查看详情，有权限时修改原评分记录。返回保留关键词、筛选和状态。",
    "docs/mobile-prd.md",
    [
      "my-ratings"
    ]
  ],
  [
    "prd-1.7-editor",
    "[data-field-label=\"合作类型\"], .m-rating-dimensions",
    "1.7 我的评分缺少填写、修改及详情",
    "定位：评分填写、修改及只读详情。修改回填原合作资料、各项分值及评价；提交更新原记录及评分时间，取消恢复原结果。",
    "docs/mobile-prd.md",
    [
      "rating-edit",
      "rating-detail"
    ]
  ],
  [
    "prd-1.8-person",
    "[data-field-label=\"业务线联系人\"]",
    "1.8 供应商评分查询条件填写方式调整",
    "定位：业务线联系人查询条件。使用选填文本输入，支持修改、清空；与其他已应用条件共同匹配，取消保留原查询。",
    "docs/mobile-prd.md",
    [
      "rating-filter",
      "department"
    ]
  ],
  [
    "prd-1.8-department",
    "[data-field-label=\"所属部门\"]",
    "1.8 供应商评分查询条件填写方式调整",
    "定位：所属部门查询条件。使用选填文本输入，按部门文字匹配；再次打开回填原已应用值。",
    "docs/mobile-prd.md",
    [
      "rating-filter",
      "department"
    ]
  ],
  [
    "prd-1.9-list",
    ".m-filter-summary, .m-rating-list",
    "1.9 评分运维查询列表无法正常显示",
    "定位：评分运维查询结果及导出。按当前权限展示合作记录、数量及条件；创建时间从新到旧排序。导出使用同一已应用条件，包含主键、供应商及合作等八项信息。",
    "docs/mobile-prd.md",
    [
      "rating-ops"
    ]
  ],
  [
    "prd-1.9-filters",
    "[data-field-label=\"排除评分人\"]",
    "1.9 评分运维查询列表无法正常显示",
    "定位：排除评分人。按姓名排除，支持每行一人或#分隔，与创建日期范围共同查询；起始日期不能晚于结束日期。",
    "docs/mobile-prd.md",
    [
      "rating-ops"
    ]
  ],
  [
    "prd-1.10-entry",
    ".m-bank-notice-stage",
    "1.10 银行信息申请无法进入填写",
    "定位：银行信息申请入口。阅读须知后确认申请，进入补充银行或分行的填写页。",
    "docs/mobile-prd.md",
    [
      "bank-application"
    ]
  ],
  [
    "prd-1.10-form",
    "[data-field-label=\"银行名称\"]",
    "1.10 银行信息申请无法进入填写",
    "定位：银行信息申请表。带入申请人、部门、申请日期；银行名称、编码、分行、国家、省、市和申请说明必填。校验失败定位字段并保留填写，实际申请结果及目录收录分别反馈。",
    "docs/mobile-prd.md",
    [
      "bank-application-form",
      "application-empty"
    ]
  ],
  [
    "prd-1.11",
    ".m-detail .m-tabs",
    "1.11 供应商详情页签左右切换受限",
    "定位：供应商详情九个页签。页签及内容区均支持左右切换，边界保持当前分组；各组关联同一供应商。返回保留来源列表及查询位置。",
    "docs/mobile-prd.md",
    [
      "detail*"
    ]
  ],
  [
    "prd-1.12",
    ".m-bank-fields .m-section",
    "1.12 银行信息分组标题显示编码",
    "定位：账户表单的分组标题。使用开户银行信息、账户信息、证明及备注三个业务分组，分别对应银行地区、账户资料及证明附件。",
    "docs/mobile-prd.md",
    [
      "bank*",
      "register*",
      "workspace-info"
    ]
  ],
  [
    "prd-1.13",
    ".m-registration-steps",
    "1.13 注册及代注册步骤重叠",
    "定位：注册步骤。个人三步，其他类型四步；当前进度与填写内容一致，首步可展开整体步骤。下一步校验当前步，上一步保留资料，从预览修改后返回预览。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.13-actions",
    ".m-registration-actions",
    "1.13 注册及代注册步骤重叠",
    "定位：注册底部操作。恢复下一步（1/4）、（2/4）、（3/4）；个人按实际三步计数。最后一步提供提交注册或当前流程的提交。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.14",
    ".m-option-picker, .m-reference-list",
    "1.14 下拉选择及搜索使用规则统一",
    "定位：当前选择层。固定枚举单选回填；行业、权限支持名称查找；银行分行按上级范围；人员按姓名或工号查找并确认。取消保留原值，切换上级清空不适用下级。",
    "docs/mobile-prd.md",
    [
      "query*",
      "mine*",
      "filter",
      "rating*",
      "department",
      "permissions*",
      "permission-form",
      "inviter*",
      "people*",
      "bank*",
      "register*",
      "workspace-info"
    ]
  ],
  [
    "prd-1.15",
    "[data-field-label=\"证件有效期至\"], [data-field-label=\"证件有效截止日期\"], .m-date-picker",
    "1.15 长期有效与日期确认容易误操作",
    "定位：证件有效期。长期、日期确认、取消分别办理；取消恢复进入前结果。具体截止日不能早于起始日期；长期结果在草稿、预览及正式资料中统一显示长期。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.16",
    ".m-search-row",
    "1.16 供应商查询支持搜索邀请人",
    "定位：供应商查询搜索框。同一关键词匹配供应商名称或当前邀请人姓名，命中任一项即可，供应商不重复；与已应用筛选共同查询。",
    "docs/mobile-prd.md",
    [
      "query*"
    ]
  ],
  [
    "prd-1.17-field",
    "[data-field-label=\"注册地址\"]",
    "1.17 注册地址填写打开新页面",
    "定位：注册地址入口。在当前页打开地址编辑抽屉，回填原地址，其他注册资料继续保留。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.17-panel",
    ".m-address-form",
    "1.17 注册地址填写打开新页面",
    "定位：地址编辑。国内地址按省、市、区县逐级选择，详细地址必填且最多50字符；确认组合回填，取消恢复原值。修改上级地区后重新选择下级。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.19-entry",
    "button[aria-label=\"导出供应商\"]",
    "1.19 导出日期隐藏且导出范围不明确",
    "定位：导出入口。以已应用搜索和筛选范围导出全部匹配记录，覆盖各页；列表勾选不改变导出范围。",
    "docs/mobile-prd.md",
    [
      "query*",
      "mine*"
    ]
  ],
  [
    "prd-1.19-date",
    ".m-export-panel [data-field-label=\"邀请时间（起）\"]",
    "1.19 导出日期隐藏且导出范围不明确",
    "定位：导出邀请时间。起止日期均必填，回填列表已应用日期；起始不能晚于结束，两端包含当日。补填只作用本次导出。",
    "docs/mobile-prd.md",
    [
      "query*",
      "mine*",
      "export"
    ]
  ],
  [
    "prd-1.19-scope",
    ".m-export-conditions",
    "1.19 导出日期隐藏且导出范围不明确",
    "定位：导出范围及数量。日期与其他已应用条件共同确定本次范围；零条时提示调整，确认后文件记录与显示数量及范围一致。",
    "docs/mobile-prd.md",
    [
      "query*",
      "mine*",
      "export"
    ]
  ],
  [
    "prd-1.20",
    ".m-portal-pricing > .m-section:not(.m-quote-info):not(.m-order-info-card), .m-pricing-editor",
    "1.20 报价及价税拆分明细重复",
    "定位：报价／价税物料明细。每条真实明细保留一组资料；同物料多条真实记录分别保留。编辑及提交对应具体物料行，已处理结果只读，失败保留其他行填写。",
    "docs/mobile-prd.md",
    [
      "workspace-quote-detail",
      "workspace-tax*"
    ]
  ],
  [
    "prd-1.21",
    ".m-actions, .m-tabs",
    "1.21 基本信息下存在多余下一步按钮",
    "定位：门户资料维护操作。查看提供修改；编辑提供取消修改、保存修改。资料分组在当前业务中切换，按本次修改保存或提交。",
    "docs/mobile-prd.md",
    [
      "workspace-info",
      "workspace-info"
    ]
  ],
  [
    "prd-1.22-contacts",
    "button[aria-label=\"添加联系人\"]",
    "1.22 添加联系人及银行操作难区分",
    "定位：添加联系人入口。新增姓名、电话、邮箱、部门、职位、微信、备注；姓名、电话、邮箱按表单必填。保存进入本次联系人列表，取消保留原列表。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.22-bank",
    "button[aria-label=\"添加银行账户\"]",
    "1.22 添加联系人及银行操作难区分",
    "定位：添加银行账户入口。进入账户表单，字段和校验按1.4；保存后回银行列表，待提交提醒按3.3。",
    "docs/mobile-prd.md",
    [
      "register*",
      "expiry",
      "address",
      "region",
      "workspace-info"
    ]
  ],
  [
    "prd-1.23",
    ".m-portal-task-card .m-card-actions button",
    "1.23 价税拆分需重复点击进入",
    "定位：价税拆分任务。待处理直接进入所点订单办理，已处理直接查看只读结果；返回保留来源页签及查询条件。",
    "docs/mobile-prd.md",
    [
      "workspace-tasks"
    ]
  ],
  [
    "prd-1.24-view",
    ".m-actions button",
    "1.24 资料编辑状态不明确且缺少取消",
    "定位：资料查看页修改入口。点击修改记录整份资料原值，回填基本信息、邮箱、附件、联系人、银行，并进入本次编辑。",
    "docs/mobile-prd.md",
    [
      "workspace-info"
    ]
  ],
  [
    "prd-1.24-edit",
    ".m-actions button",
    "1.24 资料编辑状态不明确且缺少取消",
    "定位：整页取消修改／保存修改。取消并确认放弃后，撤销进入编辑后的全部变化，包含已单条保存的联系人和银行，恢复原附件及已删除记录。保存失败保留本次全部填写。",
    "docs/mobile-prd.md",
    [
      "workspace-info"
    ]
  ],
  [
    "prd-1.25-home",
    ".m-portal-home-identity, .m-portal-home-group",
    "1.25 协同门户增加菜单及账户入口",
    "定位：门户工作台。按账号权限提供供应商资料、报价、价税、账户及已开通业务入口；展示供应商名称、登录账号、注册邮箱和状态。",
    "docs/mobile-prd.md",
    [
      "workspace-home",
      "workspace-account"
    ]
  ],
  [
    "prd-1.25-account",
    ".m-portal-account-button, .m-portal-account-panel",
    "1.25 协同门户增加菜单及账户入口",
    "定位：账户入口。支持修改密码、注册邮箱及退出；有未保存修改时先确认继续编辑或放弃，退出后返回登录页。",
    "docs/mobile-prd.md",
    [
      "workspace-home",
      "workspace-account"
    ]
  ],
  [
    "prd-3.2-entry",
    ".m-supplier-card .m-card-actions button, .m-action-sheet button",
    "3.2 重新邀请入口不清楚",
    "定位：我的邀请重新邀请入口。草稿、注册驳回且有权限时可办理，进入时带入原邀请资料。",
    "docs/mobile-prd.md",
    [
      "mine*"
    ]
  ],
  [
    "prd-3.2-form",
    "[data-field-label=\"联系人姓名\"]",
    "3.2 重新邀请入口不清楚",
    "定位：重新邀请表单。核对供应商类型、名称、联系人、邮箱、手机，校验成功后发送；成功进入邀请中，失败保留填写，取消保持原资料。",
    "docs/mobile-prd.md",
    [
      "invite-again"
    ]
  ],
  [
    "prd-3.3",
    ".m-actions",
    "3.3 银行变更增加待提交提醒",
    "定位：银行整体提交区。存在单条已保存变更时持续提醒待提交，直到提交成功或主动放弃；重新进入继续恢复。整体提交校验有效变更及唯一基本账户；放弃本次变更恢复正式资料。",
    "docs/mobile-prd.md",
    [
      "bank",
      "bank-tip"
    ]
  ],
  [
    "prd-3.4-supplier",
    "[data-field-label=\"邮箱验证码\"], [data-field-label=\"新邮箱\"]",
    "3.4 供应商注册邮箱支持修改",
    "定位：供应商自助修改注册邮箱。先验证原邮箱，再验证新邮箱保存；邮箱变化清空验证码，失败保留填写、原邮箱继续有效。",
    "docs/mobile-prd.md",
    [
      "workspace-account-email"
    ]
  ],
  [
    "prd-3.4-inviter",
    "[data-field-label=\"供应商注册邮箱\"]",
    "3.4 供应商注册邮箱支持修改",
    "定位：邀请人修改全部信息中的注册邮箱。必填并校验格式，随本次资料变更正式生效时同步到账户邮箱；草稿、取消或失败保持原正式邮箱。",
    "docs/mobile-prd.md",
    [
      "register-edit-all"
    ]
  ],
  [
    "prd-3.5-entry",
    ".m-supplier-card .m-card-actions button, .m-batch-actions button, .m-action-sheet button",
    "3.5 已审批未拉黑供应商支持免审批变更邀请人",
    "定位：单条／批量变更邀请人入口。已审批且未拉黑为对象条件，按原菜单及数据权限办理；两种方式均免审批。",
    "docs/mobile-prd.md",
    [
      "query*",
      "mine*"
    ]
  ],
  [
    "prd-3.5-form",
    "[data-field-label=\"新邀请人\"]",
    "3.5 已审批未拉黑供应商支持免审批变更邀请人",
    "定位：选择新邀请人。必填且不能与原邀请人相同；确认前再次校验供应商状态及黑名单。提交成功直接更新归属并保持审批状态，取消保持原归属。",
    "docs/mobile-prd.md",
    [
      "inviter*"
    ]
  ]
];
const legacyReviewSelectors = {
  "search": ".m-search-row",
  "filters": ".m-applied-filters",
  "supplier-actions": ".m-supplier-card",
  "records": ".m-record-collection",
  "empty": ".m-empty",
  "record-actions": ".m-card-actions",
  "tabs": ".m-tabs",
  "steps": ".m-registration-steps",
  "draft": ".m-registration-actions",
  "textarea": ".m-field-block",
  "cooperation": "[data-field-label=\"与搜狐合作事项\"]",
  "address": ".m-address-form",
  "reference": ".m-reference-list",
  "options": ".m-option-picker",
  "dates": ".m-date-picker",
  "inviter": "[data-field-label=\"新邀请人\"]",
  "banks": ".m-bank-fields",
  "history": ".m-approval-history",
  "timeline": ".m-approval-timeline",
  "login": ".m-portal-login-card",
  "identity": ".m-portal-home-identity",
  "deadline": ".m-quote-deadline"
};
export const reviewSelectors = { ...legacyReviewSelectors, ...Object.fromEntries(reviewDefinitions.map(([key, selector]) => [key, selector])) };
export const reviewActionLabels = {
  'prd-1.1-entry': ['评分'], 'prd-1.6-entry': ['修改全部信息'],
  'prd-3.2-entry': ['重新邀请'], 'prd-3.5-entry': ['变更邀请人', '批量变更邀请人'],
  'prd-1.23': ['价税拆分', '查看'],
  'prd-1.24-view': ['修改'], 'prd-1.24-edit': ['取消修改', '保存修改'],
};
export function reviewAppliesToScope(patterns, scope) {
  return patterns.some(pattern => pattern.endsWith('*') ? scope.startsWith(pattern.slice(0, -1)) : scope === pattern);
}

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
