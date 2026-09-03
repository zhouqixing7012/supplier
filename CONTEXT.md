# CONTEXT

当前：供应商代注册主实现已从静态 HTML/CSS 高保真复刻切回 React，并统一采用 shadcn/ui 默认组件风格。

关键决定：
- 登录模块保持现状，不受注册页重构影响。
- 企业、个人、政府机构或社团、国外供应商四类代注册页面继续使用 `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` Hash 路由。
- 注册页顶部使用 shadcn Tabs 横向切换四类供应商。
- 基础控件统一使用本地 shadcn 组件：Button、Input、Textarea、Select、Tabs、Tooltip、Card、Label、Badge、Separator。
- 注册页不再追求旧系统像素级视觉复刻，允许使用 shadcn 默认样式；重点保留原有字段、步骤和业务顺序。
- 表单字段由配置数组驱动，桌面端最多两列，严格按“同一行先左后右，再到下一行”自动顺排；移动端为单列。
- 企业/政府/国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。
- 供应商注册邮箱旁使用 shadcn Tooltip，文案为：`用于供应商登录协同门户及修改密码时接收验证码`。
- 审批通过后将该字段赋值给供应商正式注册邮箱属于后续业务实现；当前原型仅体现字段及说明。
- `public/*-register.html` 四个静态页暂时保留作为前一阶段视觉对照，不再作为主实现继续迭代。

位置：React + shadcn 代注册重构已提交 main，下一步根据线上效果继续微调交互和页面结构。
