# CONTEXT

当前：供应商代注册主实现保持 React + Ant Design；Impeccable 已作为项目级 UI skill 安装到仓库，后续页面设计、视觉审查、布局优化优先按 Impeccable 流程执行。

Impeccable：
- 已安装官方项目级 GitHub skill：`.github/skills/impeccable/`。
- 当前安装版本：`4.1.3`。
- 项目产品上下文：`PRODUCT.md`。
- 项目设计上下文：`DESIGN.md`。
- 后续涉及 UI 设计/重设计/critique/audit/polish/layout/distill/typeset/clarify 等任务，先读取 `.github/skills/impeccable/SKILL.md` 及对应 `reference/<command>.md`，再修改页面。
- 仓库提供 `.github/workflows/install-impeccable.yml` 作为手动更新 workflow；需要升级时运行该 workflow，执行官方 `impeccable update`。
- `.gitignore` 已加入 Impeccable runtime/临时文件忽略规则；共享设计上下文与 skill 文件保持提交状态。

关键决定：
- 登录模块保持现状，继续使用现有 shadcn/ui + Sonner，不受注册页组件体系影响。
- 企业、个人、政府机构或社团、国外供应商四类代注册页面继续使用 `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` Hash 路由。
- 注册页继续使用 Ant Design Form、Row、Col、Input、Select、DatePicker、Upload、Steps、Tabs、Tooltip、Button、Breadcrumb、ConfigProvider 等组件。
- 设计目标不是 AntD 官方 Demo，也不是现代 SaaS 营销后台，而是“搜狐内部成熟供应商管理系统”：白底、高信息密度、克制、规整、偏传统企业后台但不过时。
- 明确 anti-reference：不要 shadcn 风、不要大 Card、不要大面积蓝灰背景、不要过多圆角、不要 oversized Steps、不要空旷 SaaS 留白、不要无业务目的的装饰。
- 页面层级通过字号/字重、分隔线、对齐和留白建立，蓝色仅用于当前 Tab、主按钮、Hover/Focus 等关键交互状态。
- 当前 polish 版本移除 Tabs/主内容的盒子化边框感；主体保持纯白，顶部导航仅保留下边界线；基本信息标题采用轻量左侧强调线，不再用大卡片或整块底色。
- 表单采用紧凑横向布局，桌面端最多两列，字段顺序按“同一行先左后右，再到下一行”自动顺排，移动端降为单列；Label、输入框、日期、下拉等尺寸保持一致。
- Steps 保持 AntD small，但视觉弱化未完成步骤和连接线，使其只承担流程提示，不抢表单主任务层级。
- 上传控件保持小型上传块，不使用大 Dragger；企业营业执照自动填充提示和国外供应商证书上传继续保留。
- 企业/政府/国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。
- 供应商注册邮箱使用 Ant Design Form.Item `tooltip`，文案为：`用于供应商登录协同门户及修改密码时接收验证码`。
- 注册页和全局 `body` 均保持纯白背景；登录页蓝色背景继续由 `.auth-shell` 独立控制。
- 审批通过后将该字段赋值给供应商正式注册邮箱属于后续业务实现；当前原型仅体现字段及说明。
- `public/*-register.html` 四个静态页继续保留作为前一阶段视觉对照，不作为主实现继续迭代。

位置：Impeccable 已正式安装并初始化项目设计上下文；下一步 UI 工作直接以项目内 Impeccable skill + `PRODUCT.md` + `DESIGN.md` 为设计基线。
