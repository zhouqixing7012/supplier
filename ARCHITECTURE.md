# ARCHITECTURE

## 文件职责

- `src/entry.jsx`：前端总入口，根据 Hash 判断加载协同门户模块或代注册模块；跨模块切换时通过 Hash 触发模块重载。
- `src/mobile-entry.jsx`：移动端独立入口，避免电脑端 CSS 污染移动端样式。
- `src/pages/mobile-supplier.jsx`：移动端页面状态、会话演示数据、暂存与提交路径。
- `src/pages/mobile-data.js`：截图样本、演示参考目录和 47 张截图的独立路由映射。
- `src/pages/mobile-ui.jsx`：移动端字段、上传、弹层、选择器、固定操作栏和空状态。
- `src/pages/mobile-forms.jsx`：银行、联系人、地址、权限、邀请及注册字段。
- `src/pages/mobile-views.jsx`：列表、筛选、详情、审批记录、评分与银行信息申请。
- `src/pages/mobile-supplier.css`：隔离的移动端复刻视觉，手机布局与截图状态。
- `tests/mobile.smoke.mjs`：生产构建服务及浏览器流程验证，不调用业务接口。
- `src/main.jsx`：协同门户登录、邮箱验证、60 天改密、主动修改密码页面。
- `src/register-entry.jsx`：代注册模块入口，读取四类供应商注册 Hash 路由并维护当前供应商类型，同时加载 Ant Design reset 样式。
- `src/components/app-navigation.jsx`：协同门户和四类代注册页面共用的顶部系统导航。
- `src/components/app-navigation.css`：共享导航样式；桌面横向展示，窄屏保留单行并允许横向滚动。
- `src/pages/supplier-register.jsx`：代注册 React 主页面；四类供应商通过配置数组定义字段顺序，统一由 Ant Design 组件渲染。
- `src/pages/supplier-register.css`：代注册页面布局、步骤条、上传区和响应式规则；不使用整体缩放或截图比例画布。
- `src/styles.css`：协同门户视觉、Tailwind 主题变量和登录页响应式样式。
- `src/components/ui/*`：登录模块继续使用的本地 shadcn/ui 组件源码。
- `src/lib/utils.js`：登录模块使用的 Tailwind className 合并工具。
- `public/*-register.html`：前一阶段静态高保真对照页，保留参考，不是当前注册模块主实现。
- `vite.config.js`：Vite、React、Tailwind CSS 4 和 `@` 路径别名配置。
- `components.json`：登录模块的 shadcn/ui 项目配置。
- `index.html`：加载 `src/entry.jsx`。

## 调用关系

移动端：`index.html` → `src/entry.jsx` → `src/mobile-entry.jsx` → `MobileSupplier` → 移动端字段、表单、视图及演示数据。

总入口通过独立的加载函数分别动态导入三个模块，确保 Vite 预加载各自的 CSS。不得把三条入口导入合并为同一动态条件表达式。

协同门户：`index.html` → `src/entry.jsx` → `src/main.jsx` → `AppNavigation + src/components/ui/*`

代注册：`index.html` → `src/entry.jsx` → `src/register-entry.jsx` → `AppNavigation + src/pages/supplier-register.jsx` → Ant Design

## 导航规则

- `#/mobile` 和其下的页面、截图目录及单张状态属于移动端模块；逐张映射见 `docs/mobile-screenshot-coverage.md`。
- 移动端与电脑端之间切换会重载；移动端内部通过 Hash 更新并保留本次会话的演示记录。

- `#/login`、`#/email`、`#/upgrade`、`#/forgot` 属于协同门户模块。
- `#/register/company`、`#/register/personal`、`#/register/government`、`#/register/foreign` 属于代注册模块。
- 共享顶部菜单可直接在协同门户与四类代注册页面之间切换。
- 代注册模块内部切换类型时不重载页面；协同门户与代注册跨模块切换时由 `src/entry.jsx` 重新加载对应入口，避免 Ant Design reset 与登录模块样式相互污染。

## 代注册渲染规则

- Hash 路由决定供应商类型：`company`、`personal`、`government`、`foreign`。
- 页面内部继续使用 Ant Design `Tabs` 切换供应商类型，同时更新 Hash。
- 四类供应商字段以配置数组维护，数组顺序即视觉阅读顺序。
- 宽屏内容容器最大约 1680px，并按视口使用流式左右留白，不再按参考截图固定画布或整体缩放。
- 桌面端通过 `Row / Col` 最多展示两列，按“左 → 右 → 下一行”自动流式排列；992px 以下改为单列。
- `full: true` 的字段（如经营范围、合作事项、备注）跨两列显示。
- Tabs 使用 Ant Design 自身溢出处理；Steps 使用 `responsive`，不再通过固定 `min-width` 造成横向裁切。
- 供应商注册邮箱通过 `Form.Item tooltip` 展示用途说明，帮助图标由 Ant Design 自动放置在标签区域。
- 日期、上传、下拉、校验等交互分别使用 `DatePicker`、`Upload`、`Select` 和 `Form rules`。

## 协同门户视觉规则

- 保留深蓝搜狐品牌区 + 白色操作区的双栏结构。
- 登录操作区不再使用玻璃拟态卡片、重阴影或装饰性网格背景。
- 主操作使用搜狐橙色，蓝色用于系统导航和输入 Focus 等状态。
- 1100px 以下改为上下结构，移动端进一步压缩品牌区高度，表单保持完整可操作。

