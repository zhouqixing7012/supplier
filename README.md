# 供应商系统原型

React + Vite 的可点击原型，当前包含协同门户登录安全升级和供应商代注册基础信息页面。

## 页面导航

协同门户和四类代注册页面共用顶部“供应商系统”导航，可在页面内直接切换：

- `#/login`：协同门户
- `#/register/company`：企业代注册
- `#/register/personal`：个人代注册
- `#/register/government`：政府机构或社团代注册
- `#/register/foreign`：国外供应商代注册

## 原型场景

### 协同门户登录

- 登录页：账号、密码、图形验证码、修改密码入口。
- 无邮箱：登录账号填写 `noemail` 后点击登录，使用 Warning Toast 提示联系搜狐业务对接人补充注册邮箱。
- 60 天改密：登录账号填写 `oldpwd` 后点击登录，Warning Toast 提示修改密码，并进入修改密码流程。
- 正常登录：其他账号登录后进入注册邮箱 + 邮箱验证码校验页面。
- 主动修改密码：通过注册邮箱和邮箱验证码修改密码。
- 视觉采用深蓝品牌区 + 白色操作区的克制双栏布局，不使用装饰性网格、玻璃卡片或营销式大标题。

### 供应商代注册

四类页面统一使用 React + Ant Design。页面顶部使用 Tabs 切换供应商类型，表单采用真正的响应式布局而不是按参考截图比例缩放：宽屏充分利用可用空间，普通桌面最多两列，平板及更窄屏幕自动切换为单列；Tabs 和 Steps 不再通过固定最小宽度制造横向裁切。

企业、政府机构/社团、国外供应商在“供应商名称”后的下一个位置展示必填“供应商注册邮箱”；个人供应商在“姓名”后的下一个位置展示该字段。注册邮箱使用 Ant Design Form.Item Tooltip 说明：`用于供应商登录协同门户及修改密码时接收验证码`。

`public/*-register.html` 为前一阶段高保真静态对照页，暂时保留，但不再作为当前注册模块主实现。

## UI 技术

- React 19
- Vite 7
- Tailwind CSS 4
- 登录模块：shadcn/ui + Radix UI + Sonner
- 代注册模块：Ant Design + Ant Design Icons
- 页面视觉与响应式优化：项目内 Impeccable 4.1.3

代注册模块使用 Ant Design `Form`、`Row`、`Col`、`Input`、`Select`、`DatePicker`、`Upload`、`Steps`、`Tabs`、`Tooltip`、`Button`、`Breadcrumb` 等组件。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 已完成

- [x] 协同门户登录、安全验证和修改密码原型
- [x] Sonner Warning / Success Toast
- [x] 历史数据无邮箱阻断提示
- [x] 60 天密码修改流程
- [x] 注册邮箱 + 邮箱验证码登录
- [x] 企业/个人/政府机构或社团/国外供应商代注册基础信息页
- [x] 代注册模块 React + Ant Design 重构
- [x] 供应商注册邮箱必填字段及 Tooltip
- [x] 协同门户与四类代注册页面统一顶部导航
- [x] 代注册页面移除截图比例约束并改为完整响应式布局
- [x] 协同门户 Impeccable polish

## 待办

- [ ] 对接真实登录、邮箱验证码和账号状态接口
- [ ] 对接代注册表单真实数据、OCR、地址、下一步流程
- [ ] 实现审批通过后将新增字段赋值给供应商正式注册邮箱
