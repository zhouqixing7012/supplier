// 采购类型与两个日期字段的口径由用户明确确认。
export const purchaseTypes = ['电子设备', '耗材', '网络设备', '服务器', '服务器备件', '网络设备备件', '带宽'];
export function matchesPortalTask(record, query = '', filters = {}) {
  return (!query.trim() || record.number.includes(query.trim()))
    && (!filters.company?.trim() || record.unit.includes(filters.company.trim()))
    && (!filters.type || record.type === filters.type)
    && (!filters.start || !!record.created && record.created.slice(0, 10) >= filters.start)
    && (!filters.end || !!record.end && record.end.slice(0, 10) <= filters.end);
}
