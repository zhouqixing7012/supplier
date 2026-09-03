# 供应商系统原型

React + Vite + Tailwind CSS + shadcn/ui 组件源码模式的可点击原型，当前包含协同门户登录安全升级和供应商代注册基础信息页面。

## 原型场景

### 协同门户登录

- 登录页：账号、密码、图形验证码、修改密码入口。
- 无邮箱：登录账号填写 `noemail` 后点击登录，使用 Warning Toast 提示联系搜狐业务对接人补充注册邮箱。
- 60 天改密：登录账号填写 `oldpwd` 后点击登录，Warning Toast 提示修改密码，并进入修改密码流程。
- 正常登录：其他账号登录后进入注册邮箱 + 邮箱验证码校验页面。
- 主动修改密码：通过注册邮箱和邮箱验证码修改密码。

### 供应商代注册

直接访问以下 Hash 路由：

- `#/register/company`：企业供应商
- `#/register/personal`：个人供应商
- `#/register/government`：政府机构或社团
- `#/register/foreign`：国外供应商

四类页面按现有供应商系统截图复刻基础信息步骤，并支持在“供应商类型”下拉框中切换类型。

## UI 技术

- React 19
- Vite 7
- Tailwind CSS 4
- shadcn/ui 组件源码模式
- Sonner Toast
- Lucide 图标

基础控件统一复用本地 `Button`、`Input`、`Textarea`、`NativeSelect`、`Toaster` 组件，不使用 Ant Design。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 搜索记录

- skills.sh：参考 `interactive-prototype` 的可点击、多场景 React 原型思路，以及 `vite-react` 的 Vite + React 项目结构。
- GitHub：没有直接复用第三方业务实现；原型以现有供应商门户截图和已确认需求为准。

## 已完成

- [x] shadcn 风格登录页
- [x] Sonner Warning / Success Toast
- [x] 历史数据无邮箱阻断提示
- [x] 60 天密码修改流程
- [x] 注册邮箱 + 邮箱验证码登录
- [x] 主动修改密码
- [x] 企业供应商代注册基础信息页
- [x] 个人供应商代注册基础信息页
- [x] 政府机构或社团代注册基础信息页
- [x] 国外供应商代注册基础信息页

## 待办

- [ ] 对接真实登录、邮箱验证码和账号状态接口
- [ ] 对接代注册表单真实数据、OCR、地址、下一步流程
