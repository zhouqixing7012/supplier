import React from 'react';
import { Empty, Modal, Table, Tag, Tooltip } from 'antd-pc';

export function StatusTag({ value }) {
  const tones = { 邀请中: 'processing', 注册中: 'processing', 审批中: 'processing', 已审批: 'success', 草稿: 'default', 注册驳回: 'danger', 变更中: 'warning', 待审批: 'processing', 同意: 'success', 驳回: 'danger', 未评分: 'default', 已评分: 'success' };
  return <Tag className={'pc-status pc-status-' + (tones[value] || 'default')}>{value || '-'}</Tag>;
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

export function PcTable({ columns = [], className = '', size = 'small', bordered = true, locale, ...props }) {
  const normalizedColumns = withPcTableFullText(columns);
  const classes = [...new Set(['pc-table', ...className.split(/\s+/).filter(Boolean)])].join(' ');
  return <Table {...props} columns={normalizedColumns} className={classes} size={size} bordered={bordered} locale={{ emptyText: <EmptyContent />, ...locale }} />;
}

export function EmptyContent({ description = '暂无数据' }) {
  return <Empty image={import.meta.env.BASE_URL + 'pc-table-empty.png'} styles={{ image: { height: 90, display: 'flex', justifyContent: 'center', alignItems: 'center' } }} description={description} className="pc-empty" />;
}

export function PcModal({ className = '', ...props }) {
  return <Modal centered destroyOnHidden {...props} className={`pc-modal ${className}`.trim()} />;
}
