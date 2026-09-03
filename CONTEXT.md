# CONTEXT

当前：供应商代注册主实现保持 React + Ant Design，已在 AntD 默认组件基础上增加紧凑型“供应商后台”视觉主题。

关键决定：
- 登录模块保持现状，继续使用现有 shadcn/ui + Sonner，不受注册页组件体系影响。
- 企业、个人、政府机构或社团、国外供应商四类代注册页面继续使用 `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` Hash 路由。
- 注册页继续使用 Ant Design Form、Row、Col、Input、Select、DatePicker、Upload、Steps、Tabs、Tooltip、Button、Breadcrumb、ConfigProvider 等组件。
- 不再直接使用“AntD Demo 式”默认排版：移除大 Card 和大 Dragger，页面改为白色内容区 + 轻量边框；内容最大宽度约 1260px。
- 表单采用紧凑横向布局，Label 固定宽度约 142px，控件高度 32px，圆角降低；桌面端最多两列，按“同一行先左后右，再到下一行”自动顺排，移动端降为单列。
- Steps 使用 small 尺寸并限制宽度，Tabs 使用轻量横向导航，弱化未完成步骤和多余视觉装饰。
- 上传控件改为小型上传块，保留企业营业执照自动填充提示和国外供应商证书上传。
- 企业/政府/国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。
- 供应商注册邮箱使用 Ant Design Form.Item `tooltip`，文案为：`用于供应商登录协同门户及修改密码时接收验证码`。
- 审批通过后将该字段赋值给供应商正式注册邮箱属于后续业务实现；当前原型仅体现字段及说明。
- `public/*-register.html` 四个静态页继续保留作为前一阶段视觉对照，不作为主实现继续迭代。

位置：AntD 紧凑后台主题已提交 main；下一步根据线上页面观感继续微调密度、对齐和视觉层级。
