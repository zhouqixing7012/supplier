# CONTEXT

当前：供应商代注册基础信息页面改为纯 HTML/CSS 高保真复刻，按截图逐张处理。

关键决定：
- 登录模块保持现状，不受静态注册页影响。
- 企业、个人、政府机构或社团、国外供应商四类基础信息页均提供独立静态 HTML 页面。
- 四个静态页共用 `public/register-static.css`，以固定像素布局优先保证截图还原度。
- 每个静态页顶部增加横向菜单，可在四类供应商页面之间直接切换。
- 步骤条“预览提交”等文字强制单行显示，避免换行错位。
- 本轮不复刻水印，不再强制使用 shadcn/AntD，优先保证视觉一致。

静态页面：
- `/company-register.html`
- `/personal-register.html`
- `/government-register.html`
- `/foreign-register.html`

位置：四张基础信息页已更新到 main；下一步根据页面对比反馈继续逐张微调像素位置。
