// 列表入口与执行校验共用用户确认的状态规则。
export const canChangeSupplier = supplier => supplier.status === '已审批' && !supplier.blacklisted && Number(supplier.blackFlag || 0) !== 1;
export const canRateSupplier = supplier => ['变更中', '已审批'].includes(supplier.status);
export const canReinviteSupplier = supplier => ['草稿', '注册驳回'].includes(supplier.status);
export const deleteStatuses = mine => mine ? ['邀请中', '注册中', '草稿', '注册驳回'] : ['草稿', '注册驳回'];
export const canDeleteSupplier = (supplier, mine = false) => deleteStatuses(mine).includes(supplier.status);
