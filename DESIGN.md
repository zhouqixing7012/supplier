---
name: 供应商系统
description: 企业供应商后台与忠实移动端工作流复刻；桌面与移动视觉规则独立适用。
colors:
  mobile-action: "#4098fa"
  mobile-positive: "#16bd76"
  mobile-paper: "#ffffff"
  mobile-list-ground: "#ffffff"
  mobile-search-ground: "#f3f4f8"
  mobile-ink: "#111111"
  mobile-field-text: "#596171"
  mobile-field-label: "#565d6e"
  mobile-placeholder: "#b6b9bf"
  mobile-required: "#ec6b69"
  mobile-focus: "#2476c4"
  mobile-error: "#b42318"
  mobile-border: "#e1e2e7"
  mobile-control-border: "#a6afbc"
  mobile-input-ink: "#343a46"
  mobile-divider: "#f2f2f4"
typography:
  mobile-body:
    fontFamily: '"Microsoft YaHei", "Supplier Noto SC", "PingFang SC", Arial, sans-serif'
    fontSize: "16px"
    lineHeight: 1.55
  mobile-title:
    fontFamily: '"Microsoft YaHei", "Supplier Noto SC", "PingFang SC", Arial, sans-serif'
    fontSize: "20px"
    fontWeight: 700
  mobile-label-compact:
    fontSize: "14px"
    lineHeight: 1.85
rounded:
  mobile-action: "5px"
  mobile-bank-card: "12px"
  mobile-summary: "8px"
  mobile-control: "4px"
  mobile-feedback: "6px"
  mobile-supplier-card: "16px"
  mobile-search: "24px"
spacing:
  mobile-xs: "6px"
  mobile-sm: "12px"
  mobile-md: "14px"
  mobile-lg: "18px"
components:
  mobile-button-primary:
    backgroundColor: "{colors.mobile-action}"
    textColor: "{colors.mobile-paper}"
    rounded: "{rounded.mobile-action}"
    height: "46px"
  mobile-button-secondary:
    backgroundColor: "{colors.mobile-paper}"
    textColor: "{colors.mobile-action}"
    rounded: "{rounded.mobile-action}"
    height: "46px"
  mobile-search:
    backgroundColor: "{colors.mobile-search-ground}"
    rounded: "{rounded.mobile-search}"
    height: "42px"
  mobile-supplier-card:
    backgroundColor: "{colors.mobile-paper}"
    rounded: "{rounded.mobile-supplier-card}"
    padding: "17px 14px 12px"
---

# Design System: 供应商系统

## Overview

**Creative North Star: "清晰有序的供应商工作台"**

这是一个成熟的企业供应商管理后台，不是营销站、SaaS 官网或组件库 Demo。

关键词：**白底、克制、规整、紧凑、清晰、高信息密度、传统企业后台的秩序感 + 现代前端的可用性。**

协同门户可保留更明确的搜狐品牌识别，但仍以“进入任务”为目标：品牌区负责识别，操作区负责登录和安全验证，不做营销式视觉表演。

移动端延续企业流程的清晰与紧凑，以提供的现状截图为视觉依据，以 PRD 为业务依据。移动端查询、邀请、详情、注册、银行、权限和审批使用独立视觉体系；本节新增移动规则不覆盖已有电脑端规则。本文记录已实现的常用组件，不把截图样本或单张构图升级为全局规范。

**Key Characteristics:**
- 白底、轻分隔、业务信息优先。
- 桌面表单规整紧凑；移动端纵向流程及固定底部操作。
- 蓝色强调主操作和当前状态，中文系统字体保持可读性。
- 桌面和移动端规则按入口隔离。

## Colors

- 注册页面与主体内容保持纯白背景。
- 不使用偏蓝、冷灰的大面积注册页面底色。
- 蓝色只用于当前 Tab、当前步骤、主按钮、Focus/Hover 等关键交互。
- 边框和分隔线使用轻量中性灰，不制造“卡片墙”。
- 必填/错误使用 Ant Design 语义红色体系。
- 协同门户品牌区使用深蓝；登录主操作使用搜狐橙色，避免橙色渐变和重阴影。

### 移动端 Primary
移动操作蓝用于主按钮、选中状态、Tab 下划线及输入光标；绿色用于已实现的正向操作标识。必填标记使用柔和语义红。

### 移动端 Neutral
白色是字段、标题栏与操作栏的主体；列表使用白底；浅灰搜索背景、字段分隔线与灰色 Label 组织密集信息。前置 mobile token 仅约束移动入口。

## Typography

- 以中文企业后台可读性为优先。
- 正文和表单字号以 14px 为主；辅助说明可使用 12–13px。
- 不使用超大标题、营销式粗体或夸张字距。
- 不为了“设计感”引入与现有系统冲突的展示字体。
- 协同门户品牌标题控制在约 48px 桌面尺寸，移动端逐级降到约 30px，不使用 fluid 超大标题。

### 移动端 Hierarchy
移动正文采用 Microsoft YaHei、Supplier Noto SC、PingFang SC、Arial 回退。普通路径正文为 mobile-body，标题为 mobile-title；字段、详情和辅助数据保持中文业务文本的直接性。紧凑详情使用 14px，截图模式紧凑详情使用 12px；这些密度差异限定在对应模式。没有独立展示字体。

## Layout

- 注册内容使用 100% 流式宽度，并设置约 1680px 的上限；左右留白使用响应式 `clamp()`，不按参考截图尺寸固定画布。
- 992px 及以上表单最多两列，严格按“左 → 右 → 下一行”排列；更窄屏幕改为单列。
- Label 固定宽度，输入控件边线对齐；移动端切换为纵向 Label。
- 全宽字段仅用于经营范围、合作事项、备注等长文本。
- Tabs 和 Steps 不通过固定 `min-width` 强行撑开页面；优先使用组件自身响应式能力。
- 协同门户桌面使用左右双栏，1100px 以下改为上下结构，移动端进一步压缩品牌区高度但不隐藏任何核心操作。

### 移动端
- 普通移动页面为单列、100% 宽度、最大 430px，居中，至少一个动态视口高度；不是缩放的电脑端画布。
- 标题栏正常路径高 64px，Tabs 高 46px；查询栏跟随顶部层级，底部操作栏在容器内固定，正文预留操作空间。
- 普通字段行最小 63px，Label 宽 124px；详情行最小 57px。长文本使用独立纵向字段，银行及供应商记录用紧凑容器。
- 360px 以下压缩 Label 和操作间距；截图模式以原图对应密度呈现，采用 14px 正文、58px 标题栏、55px 字段行。此模式不是普通移动路径的触控密度基线。
- 47 个截图状态分别保留页面、弹层、筛选及滚动入口；首个查询参考为 193749。状态入口和参考顺序是本轮复刻范围，不限定未来页面架构。

**The Independent Surface Rule.** 移动视觉只应用于独立移动入口，保留既有桌面响应式布局和控件体系。

### 既有信息密度
- 注册控件高度约 36px，适合企业后台录入，又避免过度压缩造成“整页被缩小”的观感。
- 表单正文和 Label 以 14px 为主；辅助说明可使用 12–13px。
- 表单行距紧凑但必须保证可扫描性。
- 避免 Ant Design 默认 Demo 那种过大的上下留白，也避免为了“呼吸感”把业务表单做得过度空旷。

## Elevation & Depth

- 业务内容优先，装饰最小化。
- 页面层级主要通过排版、间距、分隔线和信息分组建立，不依赖大 Card、阴影或大面积色块。
- Tabs、Steps、上传、按钮都应服务流程，不抢表单主体视觉。
- 当前步骤和主操作可使用蓝色强调，其他区域保持中性。
- 协同门户采用“深蓝品牌区 + 白色操作区”的明确双栏层级；不在操作区增加额外卡片墙或玻璃层。

移动内容主要靠分隔线及记录边界建立层级；搜索栏和固定操作栏使用轻微边缘阴影，悬浮操作及遮罩弹层在交互层适量提升。不将这些移动阴影扩散至桌面注册表单。

## Shapes

桌面延续克制的圆角与轻边框。移动表单保持平整行结构，搜索胶囊、圆形选择及悬浮操作、圆角数据卡片按原有组件用途保留；禁止把一种外形泛化到所有组件。

## Components

- 注册模块优先使用 Ant Design 原生组件能力：Form、Input、Select、DatePicker、Upload、Steps、Tabs、Tooltip、Button 等。
- 不直接接受 AntD 默认组合视觉；允许通过 token/CSS 做页面级收敛。
- 上传控件使用紧凑上传块，不使用占据大面积的 Dragger，除非业务确实需要拖拽批量上传。
- Tooltip 图标留在 Label 区域，浮层不覆盖输入控件。
- Steps 使用轻量表现，未完成步骤降低权重。
- 协同门户继续使用现有 shadcn/ui 输入和按钮体系，不为视觉统一强行迁移到 Ant Design。

### 既有导航
- 协同门户和四类代注册页面共用一条 52px 左右的顶部系统导航。
- 左侧为“搜狐 / 供应商系统”，右侧依次提供协同门户及四类代注册直接入口。
- 当前页面使用细下划线和字重强调；非当前项保持中性。
- 窄屏保持单行，允许菜单区域横向滚动，不折成多行打乱页面首屏结构。

### 既有注册字段
- 企业/政府/国外供应商：“供应商名称”后的下一个视觉位置为必填“供应商注册邮箱”。
- 个人供应商：“姓名”后的下一个视觉位置为必填“供应商注册邮箱”。
- 注册邮箱 Tooltip：`用于供应商登录协同门户及修改密码时接收验证码`。
- 字段新增后，其余字段顺序顺延，不额外插入整行空白。

### 移动端 Buttons
蓝底白字主按钮及蓝边白底次按钮，普通底栏最小高度 46px、轻圆角；贴边底栏变体采用方角。禁用按钮降低透明度；键盘 Focus 使用明确外轮廓，不增加装饰性动画。

### 移动端 Inputs / Fields
白色无框输入与浅分隔线组合；固定 Label 对齐，必填标记在 Label，选择器保留右侧箭头。搜索输入采用轻灰圆角胶囊，上传使用紧凑缩略块；胶囊外形是搜索控件的既有特征，不扩大到整套按钮。

### 移动端 Cards / Containers
供应商卡片轻边框、16px 圆角，银行卡片轻边框、12px 圆角；圆角仅适用于这些移动容器，不改变桌面避免卡片墙的规则。节标题、内容与卡片操作使用轻分隔。

### 移动端 Navigation / Selection
居中标题配返回、关闭控件；Tabs 横向滚动，选中项以加粗和蓝色下划线表达。圆形复选状态与蓝色选中填充配合使用。选择弹层支持关闭、键盘 Focus、Esc 及焦点返回。

### 交互
- Hover/Focus 反馈轻量明确，不做装饰性动画。
- 主按钮和当前状态提供清楚反馈，其他元素保持安静。
- 错误、提示、Toast 优先使用语义状态，避免过重视觉警报。
- 共享导航和表单控件必须保留可见键盘 Focus。

## Do's and Don'ts

### 既有反向参考
明确避免：
- shadcn 默认 SaaS 风。
- Ant Design 官方 Demo 拼装感。
- 大 Card 套大 Card、卡片墙、重阴影。
- 蓝灰/冷蓝大背景（注册页）。
- 大面积圆角和胶囊化。
- oversized Steps、巨型上传区。
- 营销页式大标题、大留白、渐变文字、玻璃拟态。
- 装饰性网格背景、无业务意义的图标块和动效。
- 通过 `scale()` / `zoom` 把桌面画布硬塞到目标视口。

### Do:
- **Do** 保留已确认的电脑端字段顺序、导航和组件体系。
- **Do** 让移动端真实 DOM 控件遵循截图外观，同时由 PRD 决定业务行为。
- **Do** 保留移动底部操作的内容留白和可见键盘 Focus。

### Don't:
- **Don't** 使用整体 scale()/zoom 模拟目标视口。
- **Don't** 把截图模式密度、状态栏、Android 底栏、vConsole、水印或演示导航当作通用产品规范。
- **Don't** 将单个截图中的样本、布局或旧行为推导为新的业务规则。

## 2026-10-15 适配修复组件

- 移动列表和记录白底；联系人与部门是文本输入。
- 枚举选择与银行、分行、人员选择采用一致的弹层标题、选中标识和取消/确认布局；少量枚举省略搜索区，长名单提供搜索。长名称完整换行。
- 日期标题栏的长期和确认操作留出至少16px间隔，触控高度至少44px。
- 银行编辑以开户银行信息、账户信息、证明及备注分组；已有银行和权限的修改、删除直接展示。
- 评分以可点击星标、半星输入和逐项标签实现；使用已有蓝色操作、白底表单与语义校验样式。


## 2026-10-19 移动交互规范

- 业务条件和结果以 `docs/mobile-prd.md` 为唯一维护位置；本节只记录界面规范。
- 表单短标签、短值同行；长字段上下排，360px及以下全部上下排；正文16px、标签15px、辅助说明14px。记录标题17–19px，主要表单标题18px；沿用中文系统字体与白底轻分隔。
- 触控热区至少44×44 CSS px；星标每项44px宽，半分按钮独立摆放；图标视觉大小可小于热区。
- 内容横滑超过65px、横向距离大于纵向1.6倍且在900ms内完成时切页；首尾不循环。24px屏幕边缘及输入、按钮、评分、横向表格排除。纵向滚动保持浏览器原生行为，不阻断。
- 顶栏高度64px，标签栏吸顶偏移与其一致；截图状态沿用独立状态栏偏移，不作为通用布局。
- 固定底栏及弹层包含 `safe-area-inset-bottom`，页面与独立填写页预留末项滚动空间。选择层标题按钮44px以上。
- 列表卡片圆角8px，供应商摘要标签列96px且不换行；详情及表单用分组和轻分隔组织。审批默认纵向节点，辅助表格才允许横向滚动。
- 错误使用mobile-error，字段关联可读错误文本；帮助通过点击展开。对话框及独立填写页隔离背景、限制焦点并支持逐层返回。
- 小枚举保持选择后确认生效；超过6项的枚举展示搜索。此数量只控制界面复杂度，不改变选择业务规则。

- 移动登录沿用城市品牌背景，输入及反馈区域使用白色实底，字段与辅助操作使用正文灰和操作蓝，避免直接叠在高对比建筑图片上。


## 2026-10-20 复查后的界面规范

- 供应商查询与我的邀请卡片名称前保留8×16px蓝色识别条，使用既有mobile-action相近的原蓝色#0087ff与4px圆角；不为减少元素删除分组识别。
- 注册步骤默认显示当前进度摘要，展开为竖向列表；行高至少56px，当前步骤蓝色强调，已完成步骤使用勾选，未完成显示序号。摘要切换按钮热区至少44px。
- 390px及以上短字段采用112px标签列加自适应输入列；长标签、长文本、银行/账号/邮箱等需要核对的字段保持上下排。登录操作区保持上下排。
- 提交结果使用正常文档流，在当前内容上方展示，不使用浮动面板覆盖业务内容。
- 列表常用操作的具体显示条件、默认字段及步骤规则统一维护在 `docs/mobile-prd.md`，本节不复制业务条件。
