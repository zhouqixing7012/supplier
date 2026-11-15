# 供应商移动端组件库

运行 `npm run dev`，打开本地站点的 `/#/mobile/components`。也可以从「移动端原型导图 → 组件库」或 PC 工作区账户菜单的「其他功能 → 移动端组件库」进入。预览提供可操作的示例，附件文件只在当前页面会话中保留。

业务页面与预览从 [组件入口](../src/components/mobile/index.js) 引用同一份 React 实现。移动端入口统一加载 [样式入口](../src/components/mobile/styles.js)。组件使用普通移动页面的 `.mobile-page` 容器，复用已有字号、颜色、触控区域和动效。现行视觉约定见 [DESIGN.md](../DESIGN.md#当前移动端视觉基线)。

## 组件与常用参数

| 用途 | 组件 | 常用参数与状态 |
| --- | --- | --- |
| 标题、页签、步骤 | `Header`、`Tabs`、`Steps` | 标题及返回、关闭操作由页面传入。页签通过 `items`、`active`、`onChange` 管理选中项，支持下划线与胶囊样式、等宽排列和标签目录。步骤条由页面传入步骤名、当前索引及展开状态。 |
| 分组和表单 | `Section`、`Row`、`Field` | 分组可折叠。只读信息使用 `Row`。表单传入 `label`、`value` 和 `onChange`，按需配置 `required`、`readOnly`、`multiline`、`error`、`options`、`type="date"`、`onPick` 或键盘类型 `inputMode`。 |
| 搜索、筛选 | `SearchBox`、`FilterButton`、`FilterSummary` | 搜索词由页面保存。搜索框可并排放筛选按钮。摘要接收 `[字段名, 值]` 列表、结果数量、编辑和清空回调。 |
| 卡片、状态和空态 | `RecordCollection`、`RecordCard`、`CardActions`、`StatusBadge`、`Empty` | 分组传入标题、数量、空态文字及新增动作。卡片接收标题、状态节点和正文。状态标签支持 `neutral`、`info`、`success`、`warning`、`danger`。搜索无结果使用 `Empty search`。 |
| 操作栏、弹层、确认 | `Actions`、`Overlay`、`Confirm`、`PickerHeading`、`SelectionMark` | 操作项包含 `label`、`onClick`，可指定 `primary`、`secondary`、`muted`、`disabled`。弹层传入 `label`、`onClose`，通过 `sheet` 切换底部面板。删除确认用 `danger`，离开未保存编辑用 `unsaved`。 |
| 选项、日期 | `OptionSheet`、`DateSheet` | 两者都由页面保存选中值并传入 `onChange`、`onClose`。选项可即时生效或通过 `mode="confirm"` 确认，支持搜索和清空。日期使用 `YYYY-MM-DD`，按场景开放长期或清空。 |
| 上传、附件 | `UploadField`、`FileUploadField`、`AttachmentLink`、`AttachmentViewer` | 页面通过 `value`、`onChange` 保存附件标识。照片入口可调用设备拍照，文件入口可选本机文件，两者都支持预览、替换和确认移除。上传校验和提交由业务页面处理。 |

业务适配集中在 [mobile-ui.jsx](../src/pages/mobile-ui.jsx)。供应商状态映射、注册步骤、筛选字段名称以及原型字段的键盘配置由适配层传给通用组件。

## 在移动页面中复用

```jsx
import { Field, Section } from '../components/mobile/index.js';

<Section title="联系信息">
  <Field label="联系邮箱" type="email" inputMode="email" autoComplete="email"
    required value={email} onChange={setEmail} error={emailError} />
</Section>
```

复用弹层或附件时，接入现有移动入口的 `InteractionProvider` 和 `usePageIsolation`，获得返回层登记、弹层背景隔离及附件会话清理。需要改颜色或交互时，在组件目录修改通用实现，并使用当前移动端样式变量。现有公共样式按基础、普通移动端样式、动效的顺序加载，历史截图场景仍使用自身样式覆盖。

新增或调整组件时，同步更新 [交互示例](../src/components/mobile/catalog.jsx) 和本页。扩展前确认已有组件的参数能否表达需求。修改公共组件后，验证示例和实际使用页面，涉及弹层时覆盖打开、取消、确认以及退出后的状态。
