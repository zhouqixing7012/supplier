# ARCHITECTURE

## 文件职责

- `src/entry.jsx`：前端总入口，根据 Hash 判断加载登录模块或代注册模块。
- `src/main.jsx`：协同门户登录、邮箱验证、60 天改密、主动修改密码页面。
- `src/register-entry.jsx`：代注册模块入口，读取四类供应商注册 Hash 路由。
- `src/pages/supplier-register.jsx`：企业、个人、政府机构/社团、国外供应商四类基础信息表单。
- `src/pages/supplier-register.css`：代注册页面布局、步骤条、水印、表单样式及响应式规则。
- `src/styles.css`：协同门户登录页面样式和 Tailwind 主题变量。
- `src/components/ui/button.jsx`：本地 shadcn Button 组件。
- `src/components/ui/input.jsx`：本地 shadcn Input 组件。
- `src/components/ui/textarea.jsx`：本地 shadcn Textarea 组件。
- `src/components/ui/native-select.jsx`：与 shadcn 样式体系一致的原生 Select 封装。
- `src/components/ui/sonner.jsx`：Sonner Toast 统一入口。
- `src/lib/utils.js`：合并 Tailwind className 的公共工具。
- `vite.config.js`：Vite、React、Tailwind CSS 4 和 `@` 路径别名配置。
- `components.json`：shadcn/ui 项目配置。
- `index.html`：加载 `src/entry.jsx`。

## 调用关系

登录：`index.html` → `src/entry.jsx` → `src/main.jsx` → `src/components/ui/*`

代注册：`index.html` → `src/entry.jsx` → `src/register-entry.jsx` → `src/pages/supplier-register.jsx` → `src/components/ui/*`

代注册模块根据 Hash 中的供应商类型渲染不同基础信息表单；切换供应商类型时只切换当前注册页面，不影响登录模块。
