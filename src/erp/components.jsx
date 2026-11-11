import React from 'react';
import { Empty, Modal, Table, Tag, Tooltip } from 'antd-pc';

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

export function PcTable({ columns = [], className = '', size = 'small', bordered = true, filtered = false, locale, ...props }) {
  const normalizedColumns = withPcTableFullText(columns);
  const classes = [...new Set(['pc-table', ...className.split(/\s+/).filter(Boolean)])].join(' ');
  return <Table {...props} columns={normalizedColumns} className={classes} size={size} bordered={bordered} locale={{ emptyText: <EmptyContent filtered={filtered} />, ...locale }} />;
}

export function EmptyContent({ filtered = false, description }) {
  return <Empty image={import.meta.env.BASE_URL + 'pc-table-empty.png'} styles={{ image: { height: 90, display: 'flex', justifyContent: 'center', alignItems: 'center' } }} description={description ?? (filtered ? '暂无匹配结果' : '暂无数据')} className="pc-empty" />;
}

export function PcModal({ className = '', ...props }) {
  return <Modal centered destroyOnHidden {...props} className={`pc-modal ${className}`.trim()} />;
}
