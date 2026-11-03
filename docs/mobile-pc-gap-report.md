# 供应商移动端与现代码能力差异报告

初次核对日期：2026-11-02；验收口径修订：2026-11-03。目标仓库：zhouqixing7012/supplier，基线b2ceda4；本报告包含本轮协同门户原型改动后的状态。

## 结论与范围

**有供应商现代码，但当前文件不包含PC前端工程，不能据此宣称完成了PC全部页面逐项对照。**《供应商系统现代码.zip》包含10个Java服务/API模块；HTML主要为JaCoCo覆盖率报告，不是PC业务页面。下表对比的是“已取得源码证明的业务能力”与“当前移动原型”，已取得部分门户PC菜单、报价/价税列表及差旅账单页截图；其他菜单、字段显隐、角色入口仍需PC前端或逐菜单资料确认。

现有移动端已覆盖管理平台的查询、邀请、注册、评分、银行、权限、资料变更及审批阅读，也已有协同门户基础流程。主要前端差距集中在门户报价录入/提交演示、完整价税拆分演示、账单提交结果演示及审批办理等尚未展开的交互。真实认证、数据库和外部服务对接不计入产品原型的前端缺失。后端接口存在不代表对应角色一定有PC页面入口；同步、内部Feign、定时任务和测试接口不当成待补移动菜单。

## 协同门户原型交付范围

直接入口：`/#/mobile/workspace-home`；登录演示入口：`/#/mobile/portal`。首页、业务任务、账户底部导航保持现行移动UI，使用胶囊页签、独立卡片、同行字段及共用附件组件。

|区域|本轮原型表现|边界|
|---|---|---|
|首页|供应商摘要、四组图标六入口、报价及价税红色待办数字|计数来自会话样例，不是服务统计|
|供应商资料|基本信息、联系人、银行阅读/修改、取消保护、前后对比、暂存/提交变更路径|不模拟审批生效及覆盖正式资料|
|报价|待处理/已处理列表、关键词搜索、询价单详情和物料明细样例|不推断报价计算、期限校验和提交权限，不生成虚假提交结果|
|价税|待处理样例、订单明细、原有拆分阅读入口|金额计算及提交仍待已确认的PC规则|
|差旅账单|账期、附件选择/查看、保存会话草稿、返回任务|没有生成假模板下载地址、上传成功或后台回执|
|账户|账号及绑定邮箱阅读、双邮箱验证换绑并同步注册邮箱、当前绑定邮箱验证码改密、退出及未提交修改保护|没有真实认证和凭证失效|

## 当前前端验收口径

用户已明确本项目为产品原型：只需前端演示完整，后端结果用会话Mock承接，不要求重复实现后端逻辑。以下是仍需关注的前端差距；缺少接口本身不计缺失。

|前端项目|当前差距|处理边界|
|---|---|---|
|报价|已有列表、搜索和只读详情，缺报价填写、校验、提交及结果演示|明确字段和校验后用Mock承接结果|
|价税拆分|已有订单阅读，缺完整填写、计算和处理结果演示|计算规则未确认，不能自定公式|
|差旅账单|已有文件草稿，缺提交、反馈及处理状态演示|模板和账期规则需核对，真实上传不必实现|
|审批办理|已有进度和历史阅读，缺待办/已办及办理交互|核对适用角色与操作，审批结果用Mock|
|财务OU/黑名单|已按用户截图补只读卡片、完整Mock样例及空态|截图末列图标用途、操作权限和编辑流程仍待确认|
|附件/导出|已支持会话附件及CSV，部分业务文件和下载场景未覆盖|可提供演示文件，不要求真实对象存储或分享服务|

本轮只是统一口径，未补做上述交互。下表保留源码核对记录；“仍差什么”包含生产对接事项，不能把其中的后端事项累计为前端缺陷。

## 源码核对记录

“部分”表示已有可操作演示但不等于真实业务闭环；“缺少”表示尚无对应完整页面/操作；“待核对”表示资料不足，不能认定PC拥有或移动缺失。编号便于后续讨论，不代表优先等级。

|编号|模块/能力|源码证据（压缩包内）|移动当前状态|仍差什么|
|---|---|---|---|---|
|1|认证、图形/邮箱验证码、邀请链接|supplier-user-service UserApi：checkInviteLink、getUserToken、checkAccountAndEmail、sendVerification|部分：登录/验证/注册演示|真实令牌、过期、错误分支、会话隔离|
|2|账户改密|UserApi.updatePassword|部分：改密演示|密码策略、有效期、真实更新与登录凭证处理|
|3|供应商查询/筛选|supplier-center-service-new SupplierApi.supplierBasicInfoPage及查询DTO|部分：列表、筛选、详情、返回位置|真实分页、权限及大数据量结果；PC完整筛选项需界面核对|
|4|邀请与重新邀请|中心供应商/账号服务及邀请链接能力|部分：正常演示路径|真实邮件、链接有效期、重复/失败处理|
|5|注册与草稿|中心临时供应商及账号注册接口|部分：四种类型、分步注册、草稿|真实校验、完整枚举和文件上传|
|6|注册信息/主体资料详情|SupplierBasicInfoDto、SupplierBasicInfoExtendDto|部分：九页签及Mock资料|服务取值、完整字段适用范围及PC字段显隐核对|
|7|联系人、银行、业务权限维护|SupplierUpdataApi的contact/bank/business接口|部分：增改删及选择回填|真实目录、完整国家地区、权限保存失败与并发|
|8|修改全部信息及版本对比|HisSupplierApi、SupplierUpdataApi.changeDetail|部分：正式/暂存分离、差异阅读|真实历史版本、提交及审批生效|
|9|查询/我的邀请批量删除|中心删除及状态校验路径|部分：会话草稿删除|后端授权、事务及真实失败反馈|
|10|批量变更邀请人|HisSupplierApi.updateInviters、HisSupplierBiz、SupplierValidHelper|部分：已审批未拉黑范围内会话更新|真实权限、历史版本落库及服务失败处理|
|11|财务OU|SupplierApi.getSupplierFinanceOuByCode|已补：财务OU四字段卡片及Mock样例|末列图标、授权操作及移动编辑范围待确认|
|12|黑名单与操作记录|中心相关状态/记录能力|已补：状态及拉黑/移除各三字段，含未移除和空态Mock|末列图标及拉黑/移除操作权限待确认|
|13|审批任务办理|supplier-approval-service ApprovalTaskApi：approvalTaskPage、approvalTaskDetail、approval|缺少：目前主要为进度阅读|待办/已办任务列表、办理及退回/失败流程，角色入口待核对|
|14|审批进度与历史|ApprovalTaskApi.approvalProgress、approvalHistory|部分：时间线、按审批单号折叠历史Mock|真实节点、代理人、意见及历史记录|
|15|评分录入/修改/详情|ScoreApi及ScoreBiz|部分：半星评分、列表、详情|星级与接口整数映射、修改权限及真实总分|
|16|评分运维|ScoreRecordDao.getToBePushedList、ScoreBiz.pushAll/exportSupplierScoreInfo|部分：会话查询/导出；批量发起禁用|真实查询/导出、最多1000条批处理、权限、失败与重复推送|
|17|银行补充申请|当前移动申请表/原业务资料；源码接口映射需进一步核对|部分：填写/校验/暂存回看|真实审批、申请记录、银行目录生效；不能把填写成功等同目录更新|
|18|门户询价列表、详情|supplier-quote-service PurInquiryApi.getInquiryInfoPage/getInquiryInfoDetail；InquiryHeadDto/InquiryLinesDto|部分：本轮补待处理/已处理阅读与搜索|服务筛选、分页、头/行附件、期限及状态授权|
|19|门户报价录入与保存|PurInquiryApi.saveQuote，PurInquiryBiz委托PurHelper|缺少：本轮仅阅读|逐行报价、税率、金额/舍入、附件及保存/提交校验；跨系统委托未证明全部规则|
|20|门户订单与价税拆分|PurOrderApi.orderInfoPage/orderInfo/saveOrder，OrderHeadDto/OrderLinesDto|部分：样例订单阅读|多订单/多行、已处理详情、价税填写计算、精度及真实保存|
|21|差旅账单模板/资源/上传|supplier-travel-service TravelApi：travelBillTemplate、travelBillResource、travelBill|部分：本轮账期及附件草稿|真实模板、资源、上传回执/重复与账期校验；角色菜单待核对|
|22|文件/附件|报价头及行FileDto、业务附件字段|部分：会话附件列表/预览|真实上传、持久链接、访问授权、过期及下载失败|
|23|资料导出及分享|已提供的exportSupplierInfo线索和当前移动导出|部分：会话CSV及条件范围|真实字段模板、下载/复制链接、权限及有效期|
|24|PC公告及偶发故障|此前问题清单，缺运行环境与PC前端|待核对|公告出现口径、偶发遮罩及真实报错复现|

## 下一步需要的资料

以补齐前端产品原型为目标，优先提供PC前端工程；现有上传包为后端工程，无法据此确认完整菜单、角色入口与交互。

|资料|推荐提供方式|解决的问题|
|---|---|---|
|PC前端工程；没有工程时提供角色菜单录屏|脱敏前端源码，含路由、菜单、权限配置；或管理平台与协同门户按角色逐菜单录屏|确认完整页面、按钮、状态与字段显隐，避免漏功能|
|报价与价税拆分|填写至保存/提交成功的录屏，以及字段、金额公式、税率、精度、舍入和异常规则；前端源码已体现的部分无需重复整理|补报价录入、价税填写计算及提交结果演示|
|审批办理与差旅账单|待办/已办、同意/退回等实际可用动作；账期、模板、提交及结果页；角色可用范围|补办理操作、账单提交反馈与处理状态|
|模板、边界样例及未明操作|实际导出/差旅模板或脱敏样例；评分星级与原分值映射、修改人员和期限；财务OU/黑名单末列图标点击后的内容|补文件演示、精确校验与未知按钮行为|

已有规则、字段与可直接核实的前端实现无需重复提供。演示结果继续使用Mock，不要求搭建数据库、真实邮件或审批服务。

## 证据附录与限制

以下为源码控制器声明索引，不把接口数统计为功能数。已进一步阅读门户询价/订单DTO、用户认证控制器、差旅控制器及已有供应商核心校验；没有运行Java服务或连接PC线上系统。

压缩包SHA-256：`2a1a52360a24dca909528f9bd6d22a3b8feba5d92fc79d45c8a040ce59f41403`。

### supplier-center-service-new

- `HisSupplierApi.java`：`Request "/supplier"`；`Get "/hisSupplierInfo"`；`Post "/hisSupplierInfo"`；`Post "/updateInviters"`；`Post "/hisSupplierInfo2"`；`Post "/hisSupplierInfoToString"`；`Post "/hisSupplierBankInfoToString"`；`Get "/HisSupplierInfoByVeison"`。
- `OpsToolApi.java`：`Request "/supplier/opstool"`；`Get "/datasync"`。
- `ScoreApi.java`：`Request "/supplier/score"`；`Get "/getScoreItemList"`；`Get "/cooperatetypelist"`；`Get "/scorerecordlist"`；`Get "/scorerecord"`；`Post "/scorerecord"`；`Post "/scorerecordchangeuser"`；`Post "/contractinfo"`；`Post "/contractinfowfl"`；`Get "/exportSupplierScore"`；`Get "/tobepushedscorerecordlist"`；`Get "/push"`；`Get "/exportScoreInfo"`；`Get "/pushAll"`。
- `SupplierApi.java`：`Request "/supplier"`；`Get "/supplierName"`；`Get "/queryCompanyInfoByIcaudit"`；`Get "/searchInfoByIcaudit"`；`Get "/socialCreditCode"`；`Get "/supplierBasicInfoPage"`；`Post "/supplierBasicAndLicense"`；`Get "/supplierBasicAndLicense"`；`Get "/supplierBasicInfoList"`；`Get "/supplierContact"`；`Post "/supplierContact"`；`Get "/supplierBank"`；`Post "/supplierBank"`；`Get "/supplierBusiness"`；`Get "/supplierFinanceOU"`；`Get "/supplierFinanceOUByCode"`；`Post "/supplierFinanceOU"`；`Post "/supplierFinanceOUEvent"`；`Get "/supplierInfo"`；`Get "/supplierInfo/bySupplierCode"`；`Delete "/supplierInfo/{supplierIds}"`；`Delete "/deleteSupplierById/{supplierId}"`；`Post "/supplierInfo"`；`Post "/inviteSupplier"`；`Get "/bankInfoPage"`；`Get "/newBankInfoPage"`；`Get "/newBankBranchInfoPage"`；`Get "/ouInfoPage"`；`Get "/payCompany"`；`Post "/supplierInfoAll"`；`Post "/saveSupplierExcelImport"`；`Post "/ebsCallBack"`；`Get "/setUpWriter"`；`Get "/exportInvitation"`；`Get "/exportSupplierInfo"`；`Get "/tycInfo"`。
- `SupplierBlackApi.java`：`Request "/supplier"`；`Get "/supplierBlackVerification"`；`Get "/supplierBlacklistPage"`；`Get "/supplierBlacklist"`；`Delete "/supplierBlack/{ids}/{removeReason}/{UserCode}/{UserName}"`；`Post "/supplierBlack/{ids}/{applyReason}/{UserCode}/{UserName}"`；`Post "/supplierBlackExcel"`。
- `SupplierUpdataApi.java`：`Request "/supplier/update"`；`Get "/supplierBankPage"`；`Post "/supplierBank"`；`Get "/supplierBusinessPage"`；`Post "/supplierBusiness"`；`Get "/supplierContactPage"`；`Post "/supplierContact"`；`Get "/supplierBasicInfo"`；`Get "/supplierBasicInfoChangeDetailList"`；`Post "/supplierBasicInfo"`；`Post "/supplierInfo"`；`Get "/approvalId"`；`Get "/supplierName"`；`Get "/socialCreditCode"`；`Get "/checkBankIsEmpty"`；`Get "/checkContactIsEmpty"`；`Get "/checkBusinessDetpIsEmpty"`；`Get "/supplierOUPage"`；`Post "/supplierOU"`。

### supplier-approval-service

- `ApprovalTaskApi.java`：`Request "/approval"`；`Get "/approvalTaskPage/{type}"`；`Get "/approvalTaskDetail"`；`Get "/approvalProgress"`；`Get "/approvalHistory"`；`Post "/approval/{type}"`；`Post "/getApprovalRegisterDetail"`；`Post "/queryApprovalTaskDetailByConditions"`。
- `ApprovalTaskGeneralApi.java`：`Request "general/approval"`；`Post "/initiateTask"`；`Get "/approvalTaskPage/{userCode}/{type}"`。

### supplier-user-service

- `UserApi.java`：`Request "/user"`；`Get "/inviteLink"`；`Get "/verificationCodePicture"`；`Get "/userCode"`；`Post "/userAccount"`；`Post "/userToken"`；`Get "/tokenInfo"`；`Get "/accountAndEmail"`；`Get "/emailVerification"`；`Put "/userAccountPassword"`。

### supplier-quote-service

- `PurInquiryApi.java`：`Request "/inquiry"`；`Get "/inquiryInfoPage/{status}/{supplierToken}"`；`Get "/inquiryInfo/{supplierToken}/{inquiryNumber}"`；`Post "/saveQuote"`。
- `PurOrderApi.java`：`Request "/order"`；`Get "/orderInfoPage/{status}/{supplierToken}"`；`Get "/orderInfo/{orderNumber}"`；`Post "/saveOrder"`。

### supplier-travel-service

- `TravelApi.java`：`Request "/travel"`；`Get "/travelBillTemplate"`；`Get "/travelBillResource"`；`Post "/travelBill"`。


## 本轮验证

生产构建通过。门户及代表宽度检查15通过、0失败；相关复测4通过、0失败，账单未保存保护补验1通过、0失败。已目视核对门户首页与询价详情。真实接口、PC线上界面、真机、软键盘及读屏未验证。

## 已补充的门户PC资料（2026-11-03）

- 菜单：供应商信息管理、采购报价管理待处理/已处理、采购价税拆分待处理/已处理、差旅账单录入。移动首页已为六个入口接通当前页面。
- 报价列表截图：查询包含询价单号、采购单位、采购类型、开始时间、结束时间；列包含询价单号、采购单位、采购类型、询价标题、询价状态、剩余时间、创建时间、结束时间。
- 价税列表截图：查询包含订单编号、采购公司、采购类型、开始时间、结束时间；列包含订单编号、采购公司、采购类型、金额、创建时间。
- 差旅页截图：模板下载、产品选择（当前显示全部）、酒店账单上传、飞机账单上传，文件格式xls/xlsx。
- 本轮实现范围为首页入口和登录反馈，上述列表筛选、列字段及差旅上传差异尚未在本轮补齐；无需重复提供这些截图。报价录入、计算和提交详情及实际账单模板仍未取得。
