# ARCHITECTURE

## 文件职责

- `src/main.jsx`：供应商协同门户登录、邮箱验证、60 天改密、主动修改密码的页面和交互入口。
- `src/styles.css`：Tailwind 主题变量、搜狐门户品牌布局及响应式样式。
- `src/components/ui/button.jsx`：本地 shadcn Button 组件。
- `src/components/ui/input.jsx`：本地 shadcn Input 组件。
- `src/components/ui/sonner.jsx`：Sonner Toast 统一入口。
- `src/lib/utils.js`：合并 Tailwind className 的公共工具。
- `vite.config.js`：Vite、React、Tailwind CSS 4 和 `@` 路径别名配置。
- `components.json`：shadcn/ui 项目配置。
- `index.html`：前端应用入口。

## 调用关系

`index.html` → `src/main.jsx` → `src/components/ui/*`

`src/main.jsx` 根据账号状态切换登录、邮箱验证和修改密码页面；所有短提示统一调用 Sonner Toast，基础输入和按钮统一复用本地 shadcn 组件。
