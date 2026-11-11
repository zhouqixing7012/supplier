# ARCHITECTURE

## 文件职责

- `src/entry.jsx`：前端总入口，根据 Hash 加载移动端、PC 管理平台、PC 门户认证或 PC 门户工作区；跨模块切换时通过 Hash 触发模块重载。
- `src/mobile-entry.jsx`：移动端独立入口，避免电脑端 CSS 污染移动端样式。
- `src/pages/mobile-supplier.jsx`：移动端页面状态、会话演示数据、暂存与提交路径。
- `src/pages/mobile-data.js`：截图样本、演示参考目录和 47 张截图的独立路由映射。
- `src/pages/mobile-context.js`：独立交互上下文身份，避免表单/弹层循环引用在热更新后产生不同上下文。
- `src/pages/mobile-motion.js`：导航方向、嵌套动效优先级、滑动阈值与视觉副本滚动位置捕获/恢复。
- `src/pages/mobile-motion.jsx`：即时状态更新、不可交互的动效副本、卡片区域与位置过渡、历史折叠、局部全屏状态、退出保留与弹层退出兜底；与mobile-motion.css共同实现现行动效规范。
- `src/pages/mobile-interaction.jsx`：移动交互上下文、未保存保护、系统返回层级、滑动识别、焦点隔离和会话附件预览。
- `src/pages/mobile-portal.jsx`：门户资料、首页、账户与任务容器；会话单据从mobile-portal-records.js初始化。
- `src/pages/mobile-portal-tasks.jsx`：报价及价税四页签列表、共享筛选及按页签条件保存。
- `src/pages/mobile-portal-pricing.jsx`：报价与价税详情、全屏行编辑、整单提交和只读结果；复用公共字段、附件与未保存保护。
- `src/pages/mobile-portal-pricing.js`：十进制分数价税计算、数值检查及剩余时间展示；计算规则由mobile-prd.md维护。
- `src/pages/mobile-portal-files.jsx`：门户表格文件选择、替换及确认移除；mobile-portal-files.js维护格式检查，复用会话附件存储。
- `src/pages/mobile-ui.jsx`：移动端字段、上传、弹层、选择器、固定操作栏、FilterSummary查询摘要及Empty空态内容；RecordCollection维护分组空态容器。
- `src/pages/mobile-review.jsx`及`mobile-review.css`：独立原型评审开关、顶层锚点定位、红字引线、详情编辑与本机导入导出；`mobile-review-data.js`维护预置说明与文件校验，不参与供应商业务状态或正式PRD写入。
- `src/pages/mobile-forms.jsx`：银行、联系人、地址、权限、邀请及注册字段。
- `src/pages/mobile-views.jsx`：列表、筛选、详情、审批记录、评分与银行信息申请。
- `src/pages/mobile-supplier.css`：隔离的移动端复刻视觉，手机布局与截图状态。
- `tests/mobile.interaction.mjs`：当前移动工作流的生产构建服务、手势/返回/填写流程及布局验证，不调用业务接口。
- `tests/mobile.smoke.mjs`：2026-10-15版本的历史验证脚本，保留用于追溯；其旧界面定位不作为新版验收依据。
- `src/main.jsx`：协同门户登录、邮箱验证、60 天改密、主动修改密码页面。
- `src/portal-entry.jsx`：PC 门户 ERP 工作区入口，读取原型会话账号，管理工作区路由与退出。`src/pc/portal-session.js` 保存会话内的演示账号。
- `src/pages/bank-application.js`：管理平台两端共用的银行申请须知、字段定义及必填提示。
- `src/pc/workspace-links.js`：PC 管理平台与门户工作区共用的账户菜单「其他功能」入口。
- `src/pages/supplier-register.jsx`：代注册 React 主页面；四类供应商通过配置数组定义字段顺序，统一由 Ant Design 组件渲染。
- `src/pages/supplier-register.css`：代注册页面布局、步骤条、上传区和响应式规则；不使用整体缩放或截图比例画布。
- `src/styles.css`：协同门户视觉、Tailwind 主题变量和登录页响应式样式。
- `src/components/ui/*`：登录模块继续使用的本地 shadcn/ui 组件源码。
- `src/lib/utils.js`：登录模块使用的 Tailwind className 合并工具。
- `public/*-register.html`：前一阶段静态高保真对照页，保留参考，不是当前注册模块主实现。
- `vite.config.js`：Vite、React、Tailwind CSS 4 和 `@` 路径别名配置。
- `components.json`：登录模块的 shadcn/ui 项目配置。
- `index.html`：加载 `src/entry.jsx`。

## 调用关系

移动端：`index.html` → `src/entry.jsx` → `src/mobile-entry.jsx` → `MobileSupplier` → 移动端字段、表单、视图及演示数据。

总入口通过独立的加载函数分别动态导入各模块，确保 Vite 预加载各自的 CSS。不得把各入口导入合并为同一动态条件表达式。

PC 门户认证：`src/entry.jsx` → `src/main.jsx` → `src/components/ui/*`。邮箱验证后切换到 `src/portal-entry.jsx` → `PortalWorkspace`。

代注册：`src/entry.jsx` → `src/pc-entry.jsx` → `src/pc-admin.jsx` → `src/pages/supplier-register.jsx`。

## 导航规则

- `#/mobile` 和其下的页面、截图目录及单张状态属于移动端模块；逐张映射见 `docs/mobile-screenshot-coverage.md`。
- 移动端与电脑端之间切换会重载；移动端内部通过 Hash 更新并保留本次会话的演示记录。

- `#/login`、`#/email`、`#/upgrade`、`#/forgot` 属于 PC 门户认证模块，`#/portal/*` 属于 PC 门户工作区。
- `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` 为历史链接，进入 PC 管理平台的代注册工作区并选中对应类型。
- 工作区右上角账户菜单提供跨端原型入口。
- 代注册模块内部切换类型时不重载页面；协同门户与代注册跨模块切换时由 `src/entry.jsx` 重新加载对应入口，避免 Ant Design reset 与登录模块样式相互污染。

## 代注册渲染规则

- Hash 路由决定供应商类型：`company`、`personal`、`government`、`foreign`。
- 页面通过基本信息中的 Ant Design `Select` 切换供应商类型，在当前路由更新字段及步骤。
- 四类供应商字段以配置数组维护，数组顺序即视觉阅读顺序。
- 宽屏内容容器最大约 1680px，并按视口使用流式左右留白，不再按参考截图固定画布或整体缩放。
- 桌面端通过 `Row / Col` 最多展示两列，按“左 → 右 → 下一行”自动流式排列；992px 以下改为单列。
- `full: true` 的字段（如经营范围、合作事项、备注）跨两列显示。
- Steps 使用 `responsive`。
- 供应商注册邮箱通过 `Form.Item tooltip` 展示用途说明，帮助图标由 Ant Design 自动放置在标签区域。
- 日期、上传、下拉、校验等交互分别使用 `DatePicker`、`Upload`、`Select` 和 `Form rules`。

## 协同门户视觉规则

- 双栏结构的左侧品牌区复用移动端登录背景，右侧为白色操作区。
- 登录操作区不再使用玻璃拟态卡片、重阴影或装饰性网格背景。
- 主操作使用搜狐橙色，蓝色用于系统导航和输入 Focus 等状态。
- 1100px 以下改为上下结构，移动端进一步压缩品牌区高度，表单保持完整可操作。


## 移动端适配工作流

`mobile-supplier.jsx` 维护移动端会话、供应商、评分及路由状态。`mobile-workflows.jsx` 负责评分工作台、评分表单、运维列表和银行申请表单；复用 `mobile-ui.jsx` 的字段、日期、统一搜索选择弹层和操作栏。`mobile-forms.jsx` 负责银行及注册字段。正式信息与待审批信息分别保存，更新草稿使用原记录ID。

移动端使用带顺序标识的History记录处理前进/返回；内部导航保持会话状态，系统返回先关闭当前层或触发未保存保护。`InteractionProvider`集中维护表单快照与返回层级；`SwipeArea`只识别允许区域的横向手势。附件以独立ID关联本次会话的Object URL，退出模块后释放；不存真实服务器附件。

## 补充清单实现

- `mobile-portal.jsx`承载移动门户首页、资料读写、任务分组及账户退出。门户演示资料及待审批资料分别保存在移动会话容器，与管理端演示供应商隔离；`workspace-*`为原型路由，不构成生产认证或权限控制。
- `mobile-changes.jsx`复用字段定义生成修改前后对比，管理端全部信息和门户资料共同使用；不模拟审批完成或覆盖正式数据。
- `mobile-export.jsx`集中管理邀请日期、条件内选中记录和演示CSV生成。Object URL在导出页卸载时释放；不是跨设备下载服务，不调用真实exportSupplierInfo。
- 门户价税条目来自附件演示字段，只提供阅读、直达和返回；现行PC数值及计算规则提供前不启用录入或提交。

## 门户任务阅读与账单准备

`PortalWorkspace`通过`workspace-quote-detail`读取会话询价样本，内部`PortalQuotes`负责待处理/已处理列表与搜索；`workspace-travel`使用公共字段/附件组件和未保存保护准备账期及文件，草稿存入`portalBillDraft`。首页快捷卡片设置任务页签后进入`workspace-tasks`。这些路由的标题返回由`mobile-supplier.jsx`统一回到业务任务。未接入报价/价税提交及真实账单上传服务。






## PC供应商管理平台

- src/entry.jsx 识别 #/admin 并动态加载 src/pc-entry.jsx；PC入口独立加载 Ant Design reset 和 src/pc-admin.css，与移动端样式隔离。
- src/pc-admin.jsx 负责PC页面路由、侧栏与顶栏、供应商查询、我的邀请、供应商详情、银行信息维护及页面级演示状态。
- PC页面复用 mobile-data.js 中的供应商与银行基础目录，以及 mobile-rules.js、mobile-edit-rules.js、mobile-bank-changes.js、mobile-forms.jsx 中的权限判断、重复邀请判断、银行变更暂存、字段定义及校验规则；PC演示分行选项独立维护，不扩充移动端分行目录。
- 银行待提交资料由 mobile-bank-changes.js 使用浏览器本地存储维护；供应商列表演示状态保存在当前浏览器会话。
- PC管理平台当前覆盖截图对应的供应商查询、我的邀请、供应商详情和新增银行弹窗；其他菜单按实际页面完成情况逐步开放，不使用无功能占位菜单。
