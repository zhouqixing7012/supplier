# 供应商系统原型

React + Vite 的可点击原型，包含 PC 供应商管理平台、PC 供应商协同门户及移动端原型。

移动端原型入口为 `#/mobile`，原页面状态目录为 `#/mobile/scenes`，覆盖提供的 47 张截图。逐张入口见 [截图覆盖表](docs/mobile-screenshot-coverage.md)，规则与范围见 [供应商移动端 PRD](docs/supplier-mobile-prd.md)，演示限制见 [工程说明](docs/mobile-prototype.md)。

移动端通用控件可在 `/#/mobile/components` 查看和操作，复用方式见 [移动端组件库](docs/mobile-component-library.md)。

移动端提供独立“需求评审”悬浮开关，可查看及编辑定位标注；使用方法与保存范围见[评审模式说明](docs/mobile-review-mode.md)。前端重构估时参考[页面与公共组件清单](docs/mobile-frontend-estimate.md)。

## 页面导航

PC 管理平台和协同门户工作区使用 ERP 公共主题。右上角账户菜单的「其他功能」提供跨端入口。

- `#/login`：PC 协同门户，登录后进入资料管理、采购报价、采购价税拆分及差旅账单。
- 站点根地址及移动端「电脑端」入口均进入 PC 供应商管理平台的供应商查询（`#/admin/suppliers`）。
- `#/admin/register`：代注册，在基本信息中选择供应商类型，可保存草稿并从「我的邀请」继续填写。
- `#/admin/my-ratings` 和 `#/admin/bank-applications`：我的评分、银行信息申请。

## 原型场景

### 协同门户登录

- 登录页：账号、密码、图形验证码、修改密码入口。
- 无邮箱：登录账号填写 `noemail` 后点击登录，使用 Warning Toast 提示联系搜狐业务对接人补充注册邮箱。
- 60 天改密：登录账号填写 `oldpwd` 后点击登录，Warning Toast 提示修改密码，并进入修改密码流程。
- 正常登录：其他账号登录后进入注册邮箱 + 邮箱验证码校验页面。
- 主动修改密码：通过注册邮箱和邮箱验证码修改密码。
- 原型登录使用页面显示的图形验证码。邮箱校验前先点击获取演示验证码 1234。

### 供应商代注册

代注册使用统一表单，通过「供应商类型」下拉切换字段和步骤。表单宽屏最多两列，平板及更窄屏幕自动切换为单列。

企业、政府机构/社团、国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。注册邮箱使用 Ant Design Form.Item Tooltip 说明：`用于供应商登录协同门户及修改密码时接收验证码`。

`public/*-register.html` 为前一阶段高保真静态对照页，暂时保留，但不再作为当前注册模块主实现。

## UI 技术

- React 19
- Vite 7
- Tailwind CSS 4
- PC 管理平台和协同门户：Ant Design 6.4.5、ERP 主题及公共组件
- 页面视觉与响应式优化：项目内 Impeccable 4.1.3

代注册使用 Ant Design `Form`、`Input`、`Select`、`DatePicker`、`Upload`、`Steps`、`Tooltip`、`Button` 等组件。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

移动端浏览器验证：

```bash
npx playwright install chromium
npm run test:mobile
```

验证运行生产构建，请先执行 `npm run build`。当前脚本为 `tests/mobile.interaction.mjs`；历史 `mobile.smoke.mjs` 保留用于追溯。测试会自动启动本地服务，结果和截图输出至 `test-output/mobile-interaction`，该目录不提交。

## PC 覆盖及联调边界

现系统导出与原型逐项对应关系见 [PC 页面覆盖表](docs/pc-coverage.md)。真实认证、审批和数据服务按现系统接口联调。

## 移动端适配修复

移动端供应商管理平台提供供应商查询、我的邀请和我的评分。打开「移动端原型导图」可下载 [供应商移动端 PRD](docs/supplier-mobile-prd.md)。历次优化项见 [问题修复与优化 PRD](docs/mobile-prd.md)。当前交互使用明确标识的演示数据，业务服务限制见工程说明。

## 移动协同门户

为方便原型演示，PC 工作区右上角账户菜单的「其他功能」提供「协同门户移动端」入口，点击进入登录流程，登录完成进入门户首页。该快捷入口不属于正式业务需求。门户包含资料维护、报价任务阅读/搜索/详情、价税订单阅读、差旅账单四类授权入口跳转和账户退出。沿用当前移动UI，业务规则见[供应商移动端 PRD](docs/supplier-mobile-prd.md)，本次文档调整及原型差异见[PRD核对记录](docs/mobile-prd-review.md)，业务计算及真实提交边界见[源码能力差异报告](docs/mobile-pc-gap-report.md)。





## PC供应商管理平台

- `#/admin/suppliers` 供应商查询，支持邀请注册、代注册、快速创建及资料维护。
- `#/admin/invitations` 我的邀请，支持重新邀请、变更邀请人及修改全部信息。
- `#/admin/suppliers/:id` 供应商详情，从列表点击供应商名称进入。

管理端操作使用浏览器会话演示记录。资料变更待审批内容与已生效资料分别展示。
