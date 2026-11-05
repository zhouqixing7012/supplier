# 移动端UI走查与修正（2026-11-05）

基于main 93fa420，覆盖69个路由/状态、详情9个页签，并检查联系人/资质/报价明细编辑、筛选及选择弹层。69包含别名和演示状态，不等于69个独立业务页面。基线截图61张已保存和逐张拼图检查；发现问题后另做针对性复测。

## 本轮完成

| 项目 | 处理结果 |
|---|---|
| 注册填写 | 移除只有取消填写的三点菜单，保留离开编辑保护 |
| 单选 | 简单单选居中、点击即选；选中项蓝色600字重，信息目录右侧蓝底白勾 |
| 附件 | 参考Figma 3316:9143，统一蓝色文件名及16px链接图标，覆盖详情、已上传证照、资质和报价多附件 |
| 草稿反馈 | Toast居中；草稿不再生成顶部操作结果条；保存后更新未保存基线再返回 |
| 筛选 | 单层轻量白底，固定字段名；输入/下拉/日期文字起点一致，底部重置及应用筛选；覆盖管理、评分、运维及门户 |
| 字数统计 | 单行及多行均位于控件内，预留计数及清空按钮空间 |
| 邮箱错误 | 注册邮箱、邮箱验证码分别维护错误，仅标记实际出错字段 |
| 跨页一致性 | 统一窄屏16px侧距、审批提醒字号及留白、确认弹窗样式、门户子页面标题；补资料变更对比的缺省空态 |
| 工作台图标 | 本轮保留配色。此前多色用于区分入口，但业务与颜色对应不稳定；建议统一蓝色为主、红色仅表示待办或异常，待用户决定 |

## 验证

最终构建1通过、0失败。浏览器已验证注册无三点菜单、单选即时回填及强调、银行申请6处计数在框内、邮箱/验证码分别报错、草稿居中且无顶部结果条、实际修改保存后无离开确认、筛选单层控件与文字起点、独立筛选应用返回、运维全屏筛选、联系人新增及删除末条、删除确认#EC221F及居中、资质文件链接与16px资产加载、报价多附件共用样式、资料变更对比缺省空态。详情9页签及69路由状态未见横向溢出。

未执行完整浏览器自动化套件、真机/窄屏、软键盘、全部错误组合与所有业务提交；无附件原件的历史演示条目不能据此认定实际原件预览已验证。后端未在本轮接入。

## 路由状态清单

|序号|路由|走查结果|
|---|---|---|
|01|`query-old`|已检查|
|02|`filter`|已检查|
|03|`query-add`|已检查|
|04|`query-more`|已检查|
|05|`detail-approval-empty`|已检查|
|06|`detail-bank`|已检查|
|07|`approval`|已检查|
|08|`bank-tip`|已检查|
|09|`bank`|已检查|
|10|`bank-form`|已检查|
|11|`bank-select`|已检查|
|12|`branch-select`|已检查|
|13|`bank-form-selected`|已检查|
|14|`permissions`|已检查|
|15|`permission-form`|已检查|
|16|`permissions-added`|已检查|
|17|`inviter`|已检查|
|18|`people-empty`|已检查|
|19|`people`|已检查|
|20|`inviter-selected`|已检查|
|21|`query-changing`|已检查|
|22|`approval-tip`|已检查|
|23|`approval-history`|已检查|
|24|`mine-empty`|已检查|
|25|`mine-batch`|已检查|
|26|`mine`|已检查|
|27|`export`|已检查|
|28|`register-basic-filled`|已检查|
|29|`register-contacts-empty`|已检查|
|30|`register-contacts`|已检查|
|31|`register-banks-empty`|已检查|
|32|`register-banks`|已检查|
|33|`rating-filter`|已检查|
|34|`department`|已检查|
|35|`ratings`|已检查|
|36|`rating-ops`|已检查|
|37|`bank-application`|已检查|
|38|`application-empty`|已检查|
|39|`query-batch`|已检查|
|40|`query-export`|已检查|
|41|`invite`|已检查|
|42|`expiry`|已检查|
|43|`address`|已检查|
|44|`region`|已检查|
|45|`register-banks-deleted`|已检查|
|46|`portal`|已检查|
|47|`portal-email`|已检查|
|48|`workspace-home`|已检查|
|49|`workspace-info`|已检查|
|50|`workspace-info?edit=1`|已检查|
|51|`workspace-changes`|已检查|
|52|`workspace-approval`|已检查|
|53|`workspace-tasks`|已检查|
|54|`workspace-quote-detail?record=MOCK-INQ-001`|已检查|
|55|`workspace-tax-detail`|已检查|
|56|`workspace-travel`|已检查|
|57|`workspace-account-email`|已检查|
|58|`workspace-account-password`|已检查|
|59|`register-supplier`|已检查|
|60|`supplier-registration-result`|已检查|
|61|`my-ratings`|已检查|
|62|`rating-edit`|已检查|
|63|`rating-detail`|已检查|
|64|`bank-application-form`|已检查|
|65|`register-edit-all`|已检查|
|66|`register-edit`|已检查|
|67|`inviter-batch`|已检查|
|68|`information-change`|已检查；缺省空态已补充并复测|
|69|`detail-ratings`|已检查|
