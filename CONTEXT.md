# CONTEXT

当前：供应商代注册主实现保持 React，注册模块已从 shadcn/ui 切换为 Ant Design 默认组件风格。

关键决定：
- 登录模块保持现状，继续使用现有 shadcn/ui + Sonner，不受注册页组件体系切换影响。
- 企业、个人、政府机构或社团、国外供应商四类代注册页面继续使用 `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` Hash 路由。
- 注册页顶部使用 Ant Design Tabs 横向切换四类供应商。
- 注册页基础控件统一使用 Ant Design：Form、Row、Col、Input、Select、DatePicker、Upload、Steps、Tabs、Tooltip、Button、Card、Breadcrumb 等。
- 注册页不再使用 shadcn 默认视觉，也不再追求旧系统像素级复刻；以 Ant Design 默认风格呈现原有业务结构。
- 表单字段由配置数组驱动，桌面端最多两列，严格按“同一行先左后右，再到下一行”自动顺排；移动端为单列。
- 企业/政府/国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。
- 供应商注册邮箱使用 Ant Design Form.Item `tooltip`，文案为：`用于供应商登录协同门户及修改密码时接收验证码`。
- 审批通过后将该字段赋值给供应商正式注册邮箱属于后续业务实现；当前原型仅体现字段及说明。
- `public/*-register.html` 四个静态页暂时保留作为前一阶段视觉对照，不再作为主实现继续迭代。

位置：React + Ant Design 代注册重构已提交 main，下一步根据线上效果继续微调页面结构和交互。
