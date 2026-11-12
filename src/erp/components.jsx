import React from 'react';
import { Button, Card, Empty, Modal, Table, Tag, Tooltip, Typography } from 'antd-pc';
import { alignTableColumns } from './columnAlignment.js';

const statusTones = {
  草稿: 'default',
  待处理: 'default',
  待审批: 'warning',
  审批中: 'processing',
  已提交: 'processing',
  已审批: 'success',
  已处理: 'success',
  邀请中: 'processing',
  注册中: 'processing',
  注册驳回: 'danger',
  变更中: 'warning',
  同意: 'success',
  驳回: 'danger',
  未评分: 'default',
  已评分: 'success',
};

export function StatusTag({ value }) {
  return <Tag className={'pc-status pc-status-' + (statusTones[value] || 'default')}>{value || '-'}</Tag>;
}

function withPcTableFullText(columns = []) {
  return columns.map((column) => {
    if (!column) return column;
    if (column.children) return { ...column, children: withPcTableFullText(column.children) };
    const normalized = column.dataIndex && column.ellipsis === undefined ? { ...column, ellipsis: true } : column;
    if (!normalized.ellipsis || normalized.ellipsis?.showTitle === false) return normalized;
    const render = normalized.render;
    return {
      ...normalized,
      render: (value, record, index) => {
        const content = render ? render(value, record, index) : value;
        return typeof content === 'string' || typeof content === 'number'
          ? <Tooltip title={String(content)} trigger={['hover', 'focus']}><span tabIndex={0} className="pc-table-full-text">{content}</span></Tooltip>
          : content;
      },
    };
  });
}

export function PcTable({ columns = [], className = '', size = 'small', bordered = true, filtered = false, locale, rowSelection, ...props }) {
  const normalizedColumns = withPcTableFullText(alignTableColumns(columns));
  const classes = [...new Set(['pc-table', ...className.split(/\s+/).filter(Boolean)])].join(' ');
  return <Table {...props} columns={normalizedColumns} className={classes} rowSelection={rowSelection && { align: 'center', ...rowSelection }} size={size} bordered={bordered} locale={{ emptyText: <EmptyContent filtered={filtered} />, ...locale }} />;
}

export function QueryResults({ total, actions, conditions = [], onClear, batch, className = '', children }) {
  const applied = conditions.filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');
  return <Card size="small" title="查询结果" className={`pc-query-results ${className}`.trim()} extra={
    <div className="pc-query-result-tools">
      <Typography.Text type="secondary">共 {total} 条</Typography.Text>
      {actions}
    </div>
  }>
    {applied.length > 0 && <div className="pc-query-result-filters" aria-label="已应用的查询条件">
      {applied.map(([label, value]) => <Tag key={label} title={label + '：' + value}>{label}：{value}</Tag>)}
      {onClear && <Button type="link" size="small" onClick={onClear}>清除筛选</Button>}
    </div>}
    {batch}
    {children}
  </Card>;
}

export function QueryBatchBar({ count, children, onCancel }) {
  if (!count) return null;
  return <div className="pc-query-batch-bar" role="region" aria-label="批量操作">
    <span>已选本页 {count} 条</span>
    {children}
    <Button type="link" onClick={onCancel}>取消选择</Button>
  </div>;
}

export function EmptyContent({ filtered = false, description }) {
  return <Empty image={import.meta.env.BASE_URL + 'pc-table-empty.png'} styles={{ image: { height: 90, display: 'flex', justifyContent: 'center', alignItems: 'center' } }} description={description ?? (filtered ? '暂无匹配结果' : '暂无数据')} className="pc-empty" />;
}

export function PcModal({ className = '', ...props }) {
  return <Modal centered destroyOnHidden {...props} className={`pc-modal ${className}`.trim()} />;
}
