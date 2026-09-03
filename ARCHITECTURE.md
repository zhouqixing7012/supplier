# ARCHITECTURE

## 文件职责

- `src/entry.jsx`：前端总入口，根据 Hash 判断加载登录模块或代注册模块。
- `src/main.jsx`：协同门户登录、邮箱验证、60 天改密、主动修改密码页面。
- `src/register-entry.jsx`：代注册模块入口，读取四类供应商注册 Hash 路由并维护当前供应商类型，同时加载 Ant Design reset 样式。
- `src/pages/supplier-register.jsx`：代注册 React 主页面；四类供应商通过配置数组定义字段顺序，统一由 Ant Design 组件渲染。
- `src/pages/supplier-register.css`：代注册页面容器、卡片、步骤条、上传区和移动端响应式等少量页面级样式。
- `src/styles.css`：协同门户登录页面样式和 Tailwind 主题变量。
- `src/components/ui/*`：登录模块继续使用的本地 shadcn/ui 组件源码。
- `src/lib/utils.js`：登录模块使用的 Tailwind className 合并工具。
- `public/*-register.html`：前一阶段静态高保真对照页，保留参考，不是当前注册模块主实现。
- `vite.config.js`：Vite、React、Tailwind CSS 4 和 `@` 路径别名配置。
- `components.json`：登录模块的 shadcn/ui 项目配置。
- `index.html`：加载 `src/entry.jsx`。

## 调用关系

登录：`index.html` → `src/entry.jsx` → `src/main.jsx` → `src/components/ui/*`

代注册：`index.html` → `src/entry.jsx` → `src/register-entry.jsx` → `src/pages/supplier-register.jsx` → Ant Design

## 代注册渲染规则

- Hash 路由决定供应商类型：`company`、`personal`、`government`、`foreign`。
- 页面顶部使用 Ant Design `Tabs` 切换类型，同时更新 Hash。
- 页面使用 Ant Design `Card + Steps + Form` 作为主体结构。
- 四类供应商字段以配置数组维护，数组顺序即视觉阅读顺序。
- 桌面端通过 `Row / Col` 最多展示两列，按“左 → 右 → 下一行”自动流式排列；移动端降为单列。
- `full: true` 的字段（如经营范围、合作事项、备注）跨两列显示。
- 供应商注册邮箱通过 `Form.Item tooltip` 展示用途说明，帮助图标由 Ant Design 自动放置在标签区域。
- 日期、上传、下拉、校验等交互分别使用 `DatePicker`、`Upload.Dragger`、`Select` 和 `Form rules`。
