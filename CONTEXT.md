# CONTEXT

当前：供应商系统原型保持 React + Vite；代注册使用 Ant Design，协同门户继续使用现有 shadcn/ui + Sonner。Impeccable 已作为项目级 UI skill 安装到仓库，后续页面设计、视觉审查、布局优化优先按 Impeccable 流程执行。

Impeccable：
- 已安装官方项目级 GitHub skill：`.github/skills/impeccable/`。
- 当前安装版本：`4.1.3`。
- 项目产品上下文：`PRODUCT.md`。
- 项目设计上下文：`DESIGN.md`。
- 后续涉及 UI 设计/重设计/critique/audit/polish/layout/distill/typeset/clarify/adapt 等任务，先读取 `.github/skills/impeccable/SKILL.md` 及对应 `reference/<command>.md`，再修改页面。
- 仓库提供 `.github/workflows/install-impeccable.yml` 作为手动更新 workflow；需要升级时运行该 workflow。

本轮 2026-09-04 调整：
- 用户反馈四类代注册页面有“像按截图缩放、页面没显示全”的观感。代码检查后确认 React 主实现不存在整体 `scale/zoom`；主要原因是之前为了贴近截图与做紧凑后台，使用了 `1320/1220px` 内容上限、13px Label、32px 控件以及固定最小宽度的 Steps/Tabs，导致大屏视觉被压缩、窄屏局部易产生横向裁切感。
- 代注册现改为真正响应式布局：外层宽度 100%，最大约 1680px，左右留白使用 `clamp()`；控件高度 36px、Label 14px；桌面 992px 及以上最多两列，以下单列；Tabs 不再自定义固定最小宽度，Steps 启用 AntD `responsive`。
- 协同门户和四类代注册页面新增共享顶部菜单 `src/components/app-navigation.jsx`，可直接切换“协同门户 / 企业 / 个人 / 政府或社团 / 国外”页面。跨协同门户与代注册模块切换仍由 `src/entry.jsx` 触发重载，以避免 AntD reset 与登录样式互相污染；代注册内部四类切换不重载。
- 协同门户按 Impeccable `polish + operate` 方向美化：保留“深蓝搜狐品牌区 + 白色操作区”的现有视觉世界，但移除装饰性网格、玻璃拟态、重阴影、超大标题和验证码倾斜效果；主操作使用纯色搜狐橙，Focus/系统导航使用克制蓝色。
- 协同门户 1100px 以下改为上下布局，移动端进一步压缩品牌区高度，表单完整保留。

代注册关键业务决定：
- 企业、个人、政府机构或社团、国外供应商四类页面继续使用 `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` Hash 路由。
- 注册页继续使用 Ant Design Form、Row、Col、Input、Select、DatePicker、Upload、Steps、Tabs、Tooltip、Button、Breadcrumb、ConfigProvider 等组件。
- 设计目标不是 AntD 官方 Demo，也不是现代 SaaS 营销后台，而是“搜狐内部成熟供应商管理系统”：白底、高信息密度、克制、规整、偏传统企业后台但不过时。
- 页面层级通过字号/字重、分隔线、对齐和留白建立，蓝色仅用于当前 Tab、主按钮、Hover/Focus 等关键交互状态。
- 桌面端字段最多两列，按“同一行先左后右，再到下一行”自动顺排，移动/平板窄屏降为单列。
- 企业/政府/国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。
- 供应商注册邮箱使用 Ant Design Form.Item `tooltip`，文案为：`用于供应商登录协同门户及修改密码时接收验证码`。
- 注册页和全局 `body` 均保持纯白背景；协同门户深蓝品牌区由 `.brand-panel` 独立控制。
- 审批通过后将该字段赋值给供应商正式注册邮箱属于后续业务实现；当前原型仅体现字段及说明。
- `public/*-register.html` 四个静态页继续保留作为前一阶段视觉对照，不作为主实现继续迭代。

位置：共享导航、代注册 adapt 和协同门户 polish 已提交 main；后续 UI 工作继续以项目内 Impeccable skill + `PRODUCT.md` + `DESIGN.md` 为设计基线。
