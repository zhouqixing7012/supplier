# ARCHITECTURE

## 文件职责

- `src/entry.jsx`：前端总入口，根据 Hash 判断加载登录模块或代注册模块。
- `src/main.jsx`：协同门户登录、邮箱验证、60 天改密、主动修改密码页面。
- `src/register-entry.jsx`：代注册模块入口，读取四类供应商注册 Hash 路由并维护当前供应商类型。
- `src/pages/supplier-register.jsx`：代注册 React 主页面；四类供应商通过配置数组定义字段顺序，统一由 shadcn 组件渲染。
- `src/pages/supplier-register.css`：仅保留代注册页面的 shadcn 中性主题变量和少量页面级样式，不再承担固定像素布局。
- `src/styles.css`：协同门户登录页面样式和 Tailwind 主题变量。
- `src/components/ui/button.jsx`：本地 shadcn Button。
- `src/components/ui/input.jsx`：本地 shadcn Input。
- `src/components/ui/textarea.jsx`：本地 shadcn Textarea。
- `src/components/ui/select.jsx`：基于 Radix Select 的 shadcn Select。
- `src/components/ui/tabs.jsx`：基于 Radix Tabs 的 shadcn Tabs，用于四类供应商横向切换。
- `src/components/ui/tooltip.jsx`：基于 Radix Tooltip 的 shadcn Tooltip，用于注册邮箱说明。
- `src/components/ui/card.jsx`：shadcn Card 页面容器。
- `src/components/ui/label.jsx`：shadcn Label。
- `src/components/ui/badge.jsx`：shadcn Badge，用于步骤编号。
- `src/components/ui/separator.jsx`：shadcn Separator。
- `src/components/ui/sonner.jsx`：Sonner Toast 统一入口。
- `src/lib/utils.js`：合并 Tailwind className 的公共工具。
- `public/*-register.html`：前一阶段静态高保真对照页，保留参考，不是当前注册模块主实现。
- `vite.config.js`：Vite、React、Tailwind CSS 4 和 `@` 路径别名配置。
- `components.json`：shadcn/ui 项目配置。
- `index.html`：加载 `src/entry.jsx`。

## 调用关系

登录：`index.html` → `src/entry.jsx` → `src/main.jsx` → `src/components/ui/*`

代注册：`index.html` → `src/entry.jsx` → `src/register-entry.jsx` → `src/pages/supplier-register.jsx` → `src/components/ui/*`

## 代注册渲染规则

- Hash 路由决定供应商类型：`company`、`personal`、`government`、`foreign`。
- 页面顶部使用 shadcn Tabs 切换类型，同时更新 Hash。
- 四类供应商字段以配置数组维护，数组顺序即视觉阅读顺序。
- 桌面端表单最多两列，按“左 → 右 → 下一行”自动流式排列；移动端降为单列。
- `full: true` 的字段（如经营范围、合作事项、备注）跨两列显示。
- 供应商注册邮箱使用 shadcn Tooltip 展示用途说明，不在输入框内部放置说明图标。
