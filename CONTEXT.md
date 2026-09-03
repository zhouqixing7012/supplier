# CONTEXT

当前：在现有 shadcn/ui 协同门户登录原型基础上，新增供应商代注册基础信息原型。

关键决定：
- 登录模块保持现状，不因注册页复刻而改动。
- 代注册新增四类页面：企业供应商、个人供应商、政府机构或社团、国外供应商。
- 注册页使用本地 shadcn 组件体系，统一复用 Button、Input，并新增 Textarea、NativeSelect。
- 通过独立入口 `src/entry.jsx` 按 Hash 路由区分登录原型与注册原型，避免两个模块互相影响。
- 四类注册页分别可通过 `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` 访问。

位置：代注册基础信息页面已按用户提供截图复刻，下一步按评审反馈细化字段、交互或继续复刻联系人/银行/预览步骤。
