import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Breadcrumb, Button, ConfigProvider, DatePicker, Dropdown, Empty, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Tooltip, message } from 'antd';
import { ArrowRight, Building2, ChevronDown, ChevronsLeft, ChevronsRight, CircleHelp, ClipboardList, Download, LayoutDashboard, LogOut, Plus, Search, Trash2, UserRound, UserRoundPlus } from 'lucide-react';
import { bankDirectory, branches, cooperation, initialSuppliers, people, supplierIndustries, supplierStates, supplierTypes } from './pages/mobile-data.js';
import { bankChange, bankChangeCounts, normalizeBankChanges, readBankDraft, writeBankDraft } from './pages/mobile-bank-changes.js';
import { blankBank, bankError, fieldsFor } from './pages/mobile-forms.jsx';
import { canChangeSupplier, canDeleteSupplier, canReinviteSupplier } from './pages/mobile-rules.js';
import { reinviteCandidate } from './pages/mobile-edit-rules.js';

const CURRENT_USER = '陈才慧';
const EMPTY_SUPPLIER_FILTERS = { name: '', type: '', status: '', recommended: '', inviter: '', start: null, end: null };
const EMPTY_INVITATION_FILTERS = { name: '', status: '', type: '', registrationNumber: '', start: null, end: null };
const clone = (value) => JSON.parse(JSON.stringify(value));
const newId = () => 'pc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
const nowText = () => new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');
const dateText = (value) => value && typeof value.format === 'function' ? value.format('YYYY-MM-DD') : '';
const valueOrDash = (value) => value === null || value === undefined || value === '' ? '—' : value;
const readBankDraftSafe = (id) => { try { return readBankDraft(id); } catch { return null; } };

function readRoute() {
  const path = window.location.hash.replace(/^#/, '') || '/admin/suppliers';
  const detail = path.match(/^\/admin\/suppliers\/([^/?]+)/);
  if (detail) return { page: 'detail', id: decodeURIComponent(detail[1]) };
  if (path.startsWith('/admin/invitations')) return { page: 'invitations' };
  return { page: 'suppliers' };
}

function StatusTag({ value }) {
  const tones = { 邀请中: 'info', 注册中: 'info', 审批中: 'info', 已审批: 'success', 草稿: 'default', 注册驳回: 'danger', 变更中: 'warning' };
  return <Tag bordered={false} className={'pc-status pc-status-' + (tones[value] || 'default')}>{value || '—'}</Tag>;
}

function QueryField({ label, children }) {
  return <div className="pc-query-field"><label>{label}</label><div className="pc-query-control">{children}</div></div>;
}

function DetailGrid({ fields = [] }) {
  const rows = [];
  let row = [];
  let used = 0;
  fields.forEach((field) => {
    const span = Math.max(1, Math.min(3, field.span || 1));
    if (used + span > 3) {
      while (used < 3) { row.push({ empty: true }); used += 1; }
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push({ ...field, span });
    used += span;
    if (used === 3) { rows.push(row); row = []; used = 0; }
  });
  if (row.length) {
    while (used < 3) { row.push({ empty: true }); used += 1; }
    rows.push(row);
  }
  return (
    <div className="pc-detail-grid">
      {rows.map((items, rowIndex) => items.map((field, fieldIndex) => field.empty ? (
        <div key={'empty-' + rowIndex + '-' + fieldIndex} className="pc-detail-empty" style={{ gridColumn: 'span 2' }} aria-hidden="true" />
      ) : (
        <div key={field.label + '-' + rowIndex + '-' + fieldIndex} className="pc-detail-pair" style={{ gridColumn: 'span ' + (field.span * 2) }}>
          <div className="pc-detail-label">{field.label}</div>
          <div className="pc-detail-value">{valueOrDash(field.value)}</div>
        </div>
      )))}
    </div>
  );
}

function PcCard({ className = '', children }) {
  return <section className={'pc-card ' + className}>{children}</section>;
}

function SectionHeading({ title, extra }) {
  return <div className="pc-section-heading"><h3>{title}</h3>{extra}</div>;
}

function EmptyContent({ description = '暂无数据' }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} className="pc-empty" />;
}

function isDateInRange(value, start, end) {
  const date = String(value || '').slice(0, 10);
  const from = dateText(start);
  const to = dateText(end);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function exportCsv(rows, columns, filename) {
  const escape = (value) => {
    const text = String(value ?? '');
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const header = columns.map((column) => escape(column.title)).join(',');
  const body = rows.map((row) => columns.map((column) => escape(typeof column.value === 'function' ? column.value(row) : row[column.dataIndex])).join(','));
  const csv = '\uFEFF' + [header, ...body].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SupplierQueryPage({ filters, setFilters, onSearch, onReset, rows, selectedIds, setSelectedIds, onInvite, onRegister, onDelete, onExport, onOpenDetail, onDetailAction }) {
  const activeFilter = Object.values(filters).some((value) => !!value);
  const columns = [
    { title: '供应商名称', dataIndex: 'name', width: 240, render: (name, record) => <Tooltip title={name}><button className="pc-link pc-name-link" onClick={() => onOpenDetail(record, 'suppliers')}>{name}</button></Tooltip> },
    { title: '供应商类型', dataIndex: 'type', width: 130 },
    { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
    { title: '注册方式', dataIndex: 'mode', width: 120, align: 'center' },
    { title: '邀请人', dataIndex: 'inviter', width: 110 },
    { title: '邀请时间', dataIndex: 'date', width: 180, align: 'center' },
    { title: '更新时间', dataIndex: 'updated', width: 180, align: 'center' },
    { title: '评分', dataIndex: 'score', width: 100, align: 'center', render: (value) => value || '未评分' },
    {
      title: '操作', key: 'actions', width: 190, fixed: 'right', align: 'center',
      render: (_, record) => <Space size={8} className="pc-row-actions">
        <Button type="link" size="small" onClick={() => onOpenDetail(record, 'suppliers')}>详情</Button>
        {canChangeSupplier(record) && (
          <Dropdown menu={{ items: [
            { key: 'banks', label: '修改银行' },
            { key: 'inviter', label: '变更邀请人' },
          ], onClick: ({ key }) => onDetailAction(record, key) }}>
            <Button size="small">变更 <ChevronDown size={12} /></Button>
          </Dropdown>
        )}
      </Space>,
    },
  ];

  return (
    <div className="pc-page-stack">
      <PcCard className="pc-query-card">
        <div className="pc-query-grid">
          <QueryField label="供应商名称"><Input allowClear value={filters.name} placeholder="请输入供应商名称" onChange={(event) => setFilters('name', event.target.value)} onPressEnter={onSearch} /></QueryField>
          <QueryField label="供应商类型"><Select allowClear value={filters.type || undefined} placeholder="请选择供应商类型" options={supplierTypes.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('type', value || '')} /></QueryField>
          <QueryField label="供应商状态"><Select allowClear value={filters.status || undefined} placeholder="请选择供应商状态" options={supplierStates.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('status', value || '')} /></QueryField>
          <QueryField label="邀请时间（起）"><DatePicker value={filters.start} placeholder="请选择开始日期" format="YYYY-MM-DD" onChange={(value) => setFilters('start', value)} /></QueryField>
          <QueryField label="邀请时间（止）"><DatePicker value={filters.end} placeholder="请选择结束日期" format="YYYY-MM-DD" onChange={(value) => setFilters('end', value)} /></QueryField>
          <QueryField label="供应商推荐"><Select allowClear showSearch optionFilterProp="label" value={filters.recommended || undefined} placeholder="请选择供应商推荐" options={supplierIndustries.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('recommended', value || '')} /></QueryField>
          <QueryField label="邀请人"><Input allowClear value={filters.inviter} placeholder="请输入邀请人" onChange={(event) => setFilters('inviter', event.target.value)} onPressEnter={onSearch} /></QueryField>
        </div>
        <div className="pc-query-actions"><Button onClick={onReset}>重置</Button><Button type="primary" icon={<Search size={15} />} onClick={onSearch}>查询</Button></div>
      </PcCard>

      <PcCard className="pc-list-card">
        <div className="pc-list-toolbar">
          <Space size={8} wrap>
            <Button type="primary" icon={<UserRoundPlus size={15} />} onClick={onInvite}>邀请注册</Button>
            <Button onClick={onRegister}>代注册</Button>
            <Button danger disabled={!selectedIds.length} icon={<Trash2 size={15} />} onClick={() => onDelete(selectedIds, false)}>删除</Button>
            <Button icon={<Download size={15} />} onClick={onExport}>导出</Button>
          </Space>
          <span className="pc-demo-note">演示数据</span>
        </div>
        {selectedIds.length > 0 && <div className="pc-batch-bar"><span>已选择 <strong>{selectedIds.length}</strong> 条</span><Button type="link" danger size="small" onClick={() => onDelete(selectedIds, false)}>删除所选</Button><Button type="link" size="small" onClick={() => setSelectedIds([])}>取消选择</Button></div>}
        <Table
          rowKey="id"
          className="pc-table"
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys),
            getCheckboxProps: (record) => ({ disabled: !canDeleteSupplier(record, false) }),
            columnWidth: 48,
          }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => '共 ' + total + ' 条', position: ['bottomRight'] }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <EmptyContent description={activeFilter ? '暂无匹配结果' : '暂无数据'} /> }}
          onChange={() => setSelectedIds([])}
        />
      </PcCard>
    </div>
  );
}

function MyInvitationsPage({ filters, setFilters, onSearch, onReset, rows, selectedIds, setSelectedIds, onOpenDetail, onChangeInviter, onReinvite, onDelete, onExport }) {
  const activeFilter = Object.values(filters).some((value) => !!value);
  const selectedRecords = rows.filter((record) => selectedIds.includes(record.id));
  const allDeletable = selectedRecords.length > 0 && selectedRecords.every((record) => canDeleteSupplier(record, true));
  const columns = [
    { title: '供应商名称', dataIndex: 'name', width: 230, render: (name, record) => <Tooltip title={name}><button className="pc-link pc-name-link" onClick={() => onOpenDetail(record, 'invitations')}>{name}</button></Tooltip> },
    { title: '证件号码', dataIndex: 'code', width: 180, render: (value) => value || '—' },
    { title: '供应商类型', dataIndex: 'type', width: 130 },
    { title: '联系人姓名', dataIndex: 'contact', width: 120, render: (value) => value || '—' },
    { title: '联系人邮箱', dataIndex: 'email', width: 200, render: (value) => value || '—' },
    { title: '联系人电话', dataIndex: 'phone', width: 150, render: (value) => value || '—' },
    { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
    { title: '邀请时间', dataIndex: 'date', width: 180, align: 'center' },
    { title: '更新时间', dataIndex: 'updated', width: 180, align: 'center' },
    {
      title: '操作', key: 'actions', width: 250, fixed: 'right', align: 'center',
      render: (_, record) => {
        const items = [
          ...(canChangeSupplier(record) ? [{ key: 'inviter', label: '变更邀请人' }] : []),
          ...(canReinviteSupplier(record) ? [{ key: 'reinvite', label: '重新邀请' }] : []),
          ...(canDeleteSupplier(record, true) ? [{ key: 'delete', label: '删除', danger: true }] : []),
        ];
        if (!items.length) return '—';
        return <Dropdown menu={{ items, onClick: ({ key }) => {
          if (key === 'inviter') onChangeInviter([record.id]);
          if (key === 'reinvite') onReinvite(record);
          if (key === 'delete') onDelete([record.id], true);
        } }}>
          <Button size="small">变更 <ChevronDown size={12} /></Button>
        </Dropdown>;
      },
    },
  ];

  return (
    <div className="pc-page-stack">
      <PcCard className="pc-query-card">
        <div className="pc-query-grid">
          <QueryField label="供应商名称"><Input allowClear value={filters.name} placeholder="请输入供应商名称" onChange={(event) => setFilters('name', event.target.value)} onPressEnter={onSearch} /></QueryField>
          <QueryField label="供应商状态"><Select allowClear value={filters.status || undefined} placeholder="请选择供应商状态" options={supplierStates.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('status', value || '')} /></QueryField>
          <QueryField label="供应商类型"><Select allowClear value={filters.type || undefined} placeholder="请选择供应商类型" options={supplierTypes.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('type', value || '')} /></QueryField>
          <QueryField label="邀请时间（起）"><DatePicker value={filters.start} placeholder="请选择开始日期" format="YYYY-MM-DD" onChange={(value) => setFilters('start', value)} /></QueryField>
          <QueryField label="邀请时间（止）"><DatePicker value={filters.end} placeholder="请选择结束日期" format="YYYY-MM-DD" onChange={(value) => setFilters('end', value)} /></QueryField>
          <QueryField label="注册编号"><Input allowClear value={filters.registrationNumber} placeholder="请输入注册编号" onChange={(event) => setFilters('registrationNumber', event.target.value)} onPressEnter={onSearch} /></QueryField>
        </div>
        <div className="pc-query-actions"><Button onClick={onReset}>重置</Button><Button type="primary" icon={<Search size={15} />} onClick={onSearch}>查询</Button></div>
      </PcCard>

      <PcCard className="pc-list-card">
        <div className="pc-list-toolbar">
          <Space size={8} wrap><Button icon={<Download size={15} />} onClick={onExport}>导出</Button><Button disabled={!selectedIds.length} onClick={() => onChangeInviter(selectedIds)}>邀请人批量变更</Button></Space>
          <span className="pc-demo-note">演示数据</span>
        </div>
        {selectedIds.length > 0 && <div className="pc-batch-bar"><span>已选择 <strong>{selectedIds.length}</strong> 条</span><Button type="link" danger size="small" disabled={!allDeletable} onClick={() => onDelete(selectedIds, true)}>删除所选</Button><Button type="link" size="small" onClick={() => setSelectedIds([])}>取消选择</Button></div>}
        <Table
          rowKey="id"
          className="pc-table"
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys),
            getCheckboxProps: (record) => ({ disabled: !canChangeSupplier(record) && !canDeleteSupplier(record, true) }),
            columnWidth: 48,
          }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (total) => '共 ' + total + ' 条', position: ['bottomRight'] }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <EmptyContent description={activeFilter ? '暂无匹配结果' : '暂无数据'} /> }}
          onChange={() => setSelectedIds([])}
        />
      </PcCard>
    </div>
  );
}

function SupplierInformation({ supplier }) {
  const basic = supplier.basic || {};
  const fields = fieldsFor(supplier.type).map(([key, label, required, kind]) => ({
    label,
    value: key === 'supplierName' ? supplier.name : key === 'creditCode' ? (basic[key] || supplier.code) : basic[key],
    span: kind === 'textarea' ? 3 : kind === 'address' ? 2 : 1,
  }));
  if (basic.proof) fields.push({ label: '证照附件', value: basic.proof, span: 3 });
  return <DetailGrid fields={fields} />;
}

function RegistrationInformation({ supplier }) {
  return <DetailGrid fields={[
    { label: '供应商账号', value: supplier.supplierAccount || supplier.userCode || supplier.account },
    { label: '注册方式', value: supplier.mode },
    { label: '供应商状态', value: <StatusTag value={supplier.status} /> },
    { label: '邀请人', value: supplier.inviter },
    { label: '邀请时间', value: supplier.date },
    { label: '更新时间', value: supplier.updated },
    { label: '曾用名', value: supplier.supplierFormerName || supplier.formerName, span: 2 },
    { label: '供应商注册邮箱', value: supplier.email, span: 2 },
  ]} />;
}

function ContactsTab({ supplier }) {
  const contacts = supplier.contacts?.length ? supplier.contacts : (
    supplier.contact || supplier.phone || supplier.email
      ? [{ id: 'legacy-contact', name: supplier.contact, phone: supplier.phone, email: supplier.email }]
      : []
  );
  if (!contacts.length) return <EmptyContent description="暂无联系人信息" />;
  return <Table className="pc-table" bordered size="small" rowKey={(record) => record.id || record.name} dataSource={contacts} pagination={false} columns={[
    { title: '联系人姓名', dataIndex: 'name', width: 160 },
    { title: '联系人电话', dataIndex: 'phone', width: 180 },
    { title: '联系人邮箱', dataIndex: 'email', width: 240 },
    { title: '部门', dataIndex: 'department', width: 220 },
    { title: '职位', dataIndex: 'job', width: 180 },
    { title: '微信', dataIndex: 'wechat', width: 160 },
    { title: '备注', dataIndex: 'note', width: 220 },
  ]} scroll={{ x: 'max-content' }} />;
}

function BankInfoTab({ supplier, entries, onAdd, onEdit, onDelete, onReturn, onSubmit, pendingCount }) {
  const original = supplier.banks || [];
  const canEdit = canChangeSupplier(supplier);
  const columns = [
    { title: '账户类型', dataIndex: 'accountType', width: 100 },
    { title: '开户银行', dataIndex: 'bank', width: 180 },
    { title: '银行分行', dataIndex: 'branch', width: 200 },
    { title: '开户行所在国家/地区', dataIndex: 'country', width: 150 },
    { title: '开户所在省/市', width: 140, render: (_, record) => [record.province, record.city].filter(Boolean).join(' / ') || '—' },
    { title: '账户名称', dataIndex: 'name', width: 170 },
    { title: '银行账号', dataIndex: 'number', width: 190 },
    { title: '币种', dataIndex: 'currency', width: 90, align: 'center' },
    { title: '开户证明', dataIndex: 'proof', width: 170, render: (value) => value ? <span className="pc-attachment-name">{value}</span> : '—' },
    { title: '备注', dataIndex: 'note', width: 180 },
    {
      title: '变更状态', key: 'change', width: 130, align: 'center',
      render: (_, record) => {
        const action = bankChange(original, record).action;
        const labels = { 新增: '待提交新增', 修改: '待提交修改', 删除: '待提交删除' };
        return action ? <Tag bordered={false} className={'pc-change-tag pc-change-' + action}>{labels[action]}</Tag> : '—';
      },
    },
    {
      title: '操作', key: 'actions', width: 140, fixed: 'right', align: 'center',
      render: (_, record) => {
        const action = bankChange(original, record).action;
        if (!canEdit || action === '删除') return '—';
        return <Space size={8}><Button type="link" size="small" onClick={() => onEdit(record)}>修改</Button><Button type="link" danger size="small" onClick={() => onDelete(record)}>删除</Button></Space>;
      },
    },
  ];

  return (
    <div className="pc-bank-tab">
      <div className="pc-bank-summary">
        <div className="pc-bank-summary-copy">
          <strong>银行信息</strong>
          {pendingCount > 0 && <span>有 <b>{pendingCount}</b> 条银行变更待提交审批</span>}
          {supplier.status === '变更中' && <span className="pc-muted">银行信息变更已提交审批</span>}
        </div>
        {canEdit && <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>添加银行</Button>}
      </div>
      {entries.length ? (
        <Table
          className="pc-table"
          bordered
          size="small"
          rowKey="id"
          dataSource={entries}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
          expandable={{
            rowExpandable: (record) => bankChange(original, record).action === '修改',
            expandedRowRender: (record) => <div className="pc-bank-diff">{bankChange(original, record).fields.map((field) => (
              <div className="pc-bank-diff-row" key={field.key}>
                <span className="pc-bank-diff-label">{field.label}</span>
                <span className="pc-bank-diff-before">{field.previous || '—'}</span>
                <ArrowRight size={14} />
                <strong className="pc-bank-diff-after">{field.next || '—'}</strong>
              </div>
            ))}</div>,
          }}
        />
      ) : <EmptyContent description="暂无银行信息" />}
      {pendingCount > 0 && <div className="pc-bank-footer"><Button onClick={onReturn}>返回</Button><Button type="primary" onClick={onSubmit}>提交审批</Button></div>}
    </div>
  );
}

function PermissionsTab({ supplier }) {
  const records = supplier.permissions || [];
  if (!records.length) return <EmptyContent description="暂无权限记录" />;
  return <Table className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} columns={[
    { title: '所属权限', dataIndex: 'group', width: 220 },
    { title: '权限分类', dataIndex: 'category', width: 240 },
    { title: '备注', dataIndex: 'note' },
  ]} />;
}

function FinanceOUTab({ supplier }) {
  const records = supplier.financeOus || [];
  if (!records.length) return <EmptyContent description="暂无财务OU信息" />;
  return <Table className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} scroll={{ x: 'max-content' }} columns={[
    { title: '财务OU名称', dataIndex: 'orgName', width: 280 },
    { title: '负债账户', dataIndex: 'liabilityAccount', width: 300 },
    { title: '预付款账户', dataIndex: 'prepayAccount', width: 300 },
    { title: '地址', dataIndex: 'address', width: 220 },
  ]} />;
}

function BlacklistTab({ supplier }) {
  const records = supplier.blacklistRecords || [];
  if (!records.length) return <EmptyContent description="暂无黑名单操作记录" />;
  return <Table className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} scroll={{ x: 'max-content' }} columns={[
    { title: '操作状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
    { title: '拉黑操作人', dataIndex: 'applyUser', width: 170 },
    { title: '拉黑操作时间', dataIndex: 'applyTime', width: 180, align: 'center' },
    { title: '拉黑原因', dataIndex: 'applyReason', width: 260 },
    { title: '移除操作人', dataIndex: 'removeUser', width: 170 },
    { title: '移除操作时间', dataIndex: 'removeTime', width: 180, align: 'center' },
    { title: '移除原因', dataIndex: 'removeReason', width: 260 },
  ]} />;
}

function ApprovalTab({ supplier }) {
  const history = supplier.approvalHistory || [];
  const nodes = supplier.approvalNodes || [];
  return (
    <div className="pc-approval-tab">
      {history.length > 0 && <div className="pc-section-block">
        <SectionHeading title="历史审批记录" />
        <Table className="pc-table" bordered size="small" rowKey="number" dataSource={history} pagination={false} columns={[
          { title: '审批单号', dataIndex: 'number', width: 220 },
          { title: '审批类型', dataIndex: 'type', width: 150 },
          { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
          { title: '发起人', dataIndex: 'initiator', width: 160 },
          { title: '发起时间', dataIndex: 'startedAt', width: 180, align: 'center' },
          { title: '审批节点数', width: 110, align: 'center', render: (_, record) => record.nodes?.length || 0 },
        ]} />
      </div>}
      {nodes.length > 0 && <div className="pc-section-block">
        <SectionHeading title="当前审批进度" />
        <Table className="pc-table" bordered size="small" rowKey="id" dataSource={nodes} pagination={false} columns={[
          { title: '审批环节', dataIndex: 'name', width: 150 },
          { title: '审批人', dataIndex: 'person', width: 170 },
          { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
          { title: '审批时间', dataIndex: 'time', width: 180, align: 'center' },
          { title: '审批意见', dataIndex: 'opinion' },
        ]} />
      </div>}
      {!history.length && !nodes.length && <EmptyContent description="暂无审批记录" />}
    </div>
  );
}

function CooperationTab({ supplier }) {
  const records = cooperation.filter((record) => record.name === supplier.name);
  if (!records.length) return <EmptyContent description="暂无合作信息及评分记录" />;
  return <Table className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} scroll={{ x: 'max-content' }} columns={[
    { title: '合作类型', dataIndex: 'type', width: 150 },
    { title: '合作内容', dataIndex: 'content', width: 240 },
    { title: '业务线联系人', dataIndex: 'person', width: 150 },
    { title: '所属部门', dataIndex: 'department', width: 280 },
    { title: '合作时间', dataIndex: 'date', width: 140, align: 'center' },
    { title: '评分时间', dataIndex: 'rated', width: 180, align: 'center' },
    { title: '评价得分', dataIndex: 'score', width: 110, align: 'center' },
  ]} />;
}

function SupplierDetailPage({ supplier, activeTab, setActiveTab, bankEntries, pendingBankCount, onBankAdd, onBankEdit, onBankDelete, onBankReturn, onBankSubmit }) {
  const tabs = [
    { key: 'supplier', label: '供应商信息', children: <SupplierInformation supplier={supplier} /> },
    { key: 'contacts', label: '联系人信息', children: <ContactsTab supplier={supplier} /> },
    { key: 'banks', label: '银行信息', children: <BankInfoTab supplier={supplier} entries={bankEntries} pendingCount={pendingBankCount} onAdd={onBankAdd} onEdit={onBankEdit} onDelete={onBankDelete} onReturn={onBankReturn} onSubmit={onBankSubmit} /> },
    { key: 'permissions', label: '分配权限', children: <PermissionsTab supplier={supplier} /> },
    { key: 'finance', label: '财务OU', children: <FinanceOUTab supplier={supplier} /> },
    { key: 'blacklist', label: '黑名单操作记录', children: <BlacklistTab supplier={supplier} /> },
    { key: 'approval', label: '审批记录', children: <ApprovalTab supplier={supplier} /> },
    { key: 'cooperation', label: '合作信息及评分', children: <CooperationTab supplier={supplier} /> },
    { key: 'registration', label: '注册信息', children: <RegistrationInformation supplier={supplier} /> },
  ];
  return (
    <div className="pc-page-stack">
      <PcCard className="pc-detail-overview">
        <SectionHeading title="基本信息" />
        <div className="pc-overview-grid">
          <div><span>供应商名称</span><strong>{supplier.name || '—'}</strong></div>
          <div><span>供应商类型</span><strong>{supplier.type || '—'}</strong></div>
          <div><span>供应商账号</span><strong>{supplier.supplierAccount || supplier.userCode || supplier.account || '—'}</strong></div>
          <div><span>供应商状态</span><strong><StatusTag value={supplier.status} /></strong></div>
          <div><span>邀请人</span><strong>{supplier.inviter || '—'}</strong></div>
          <div><span>邀请时间</span><strong>{supplier.date || '—'}</strong></div>
          <div><span>注册方式</span><strong>{supplier.mode || '—'}</strong></div>
          <div><span>曾用名</span><strong>{supplier.supplierFormerName || supplier.formerName || '—'}</strong></div>
          <div><span>注册邮箱</span><strong>{supplier.email || '—'}</strong></div>
        </div>
      </PcCard>
      <PcCard className="pc-detail-tabs-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} tabBarGutter={24} className="pc-detail-tabs" />
      </PcCard>
    </div>
  );
}

function BankModal({ open, supplier, bank, onCancel, onSave }) {
  const [draft, setDraft] = useState(blankBank(supplier?.name || ''));
  const company = supplier?.type === supplierTypes[0];
  useEffect(() => {
    if (!open) return;
    setDraft(bank ? { ...bank } : { ...blankBank(supplier?.name || ''), id: newId() });
  }, [open, bank, supplier?.name]);
  const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const branchOptions = branches.filter((item) => item.bank === draft.bank).map((item) => ({ value: item.name, label: item.name }));
  const selectedBranch = branches.find((item) => item.name === draft.branch);
  return (
    <Modal
      open={open}
      centered
      width={760}
      title={bank ? '编辑银行信息' : '添加银行'}
      onCancel={onCancel}
      maskClosable={false}
      className="pc-modal"
      styles={{ body: { maxHeight: 'calc(100vh - 190px)', overflowY: 'auto', padding: '16px 20px' } }}
      footer={[<Button key="cancel" onClick={onCancel}>取消</Button>, <Button key="save" type="primary" onClick={() => onSave(draft)}>保存此账户</Button>]}
    >
      <div className="pc-bank-form-grid">
        {company && <div className="pc-bank-field"><label><em>*</em>账户类型</label><Select value={draft.accountType || undefined} placeholder="请选择账户类型" options={['基本账户', '一般账户'].map((value) => ({ value, label: value }))} onChange={(value) => change('accountType', value)} /></div>}
        <div className="pc-bank-field">
          <label><em>*</em>开户银行</label>
          <Select showSearch optionFilterProp="label" value={draft.bank || undefined} placeholder="请选择开户银行" options={bankDirectory.map((item) => ({ value: item.name, label: item.name }))} onChange={(value) => {
            const directory = bankDirectory.find((item) => item.name === value);
            setDraft((current) => ({ ...current, bank: value, branch: '', country: directory?.country || '', province: '', city: '' }));
          }} />
        </div>
        <div className="pc-bank-field">
          <label><em>*</em>银行分行</label>
          <Select showSearch optionFilterProp="label" value={draft.branch || undefined} placeholder={draft.bank ? '请选择银行分行' : '请先选择开户银行'} disabled={!draft.bank} options={branchOptions} onChange={(value) => {
            const branch = branches.find((item) => item.name === value);
            setDraft((current) => ({ ...current, branch: value, country: branch?.country || current.country, province: branch?.province || '', city: branch?.city || '' }));
          }} />
        </div>
        <div className="pc-bank-field"><label><em>*</em>开户行所在国家/地区</label><div className="pc-readonly-value">{draft.country || '选择开户银行后自动带出'}</div></div>
        <div className="pc-bank-field"><label>开户所在省</label><div className="pc-readonly-value">{draft.province || '—'}</div></div>
        <div className="pc-bank-field"><label>开户所在市</label><div className="pc-readonly-value">{draft.city || '—'}</div></div>
        <div className="pc-bank-field"><label><em>*</em>账户名称</label><Input value={draft.name} maxLength={100} placeholder="请输入账户名称" onChange={(event) => change('name', event.target.value)} /></div>
        <div className="pc-bank-field"><label><em>*</em>银行账号</label><Input value={draft.number} maxLength={50} placeholder="请输入银行账号" onChange={(event) => change('number', event.target.value)} /></div>
        <div className="pc-bank-field"><label><em>*</em>币种</label><Select value={draft.currency || undefined} placeholder="请选择币种" options={['人民币', '美元', '港币'].map((value) => ({ value, label: value }))} onChange={(value) => change('currency', value)} /></div>
        <div className="pc-bank-field">
          <label>{company && <em>*</em>}开户证明</label>
          <div className="pc-upload-control">
            <label className="pc-upload-button"><Plus size={15} /><span>{draft.proof ? '替换文件' : '上传文件'}</span><input type="file" onChange={(event) => change('proof', event.target.files?.[0]?.name || '')} /></label>
            <span className="pc-upload-name">{draft.proof || '未上传'}</span>
          </div>
        </div>
        <div className="pc-bank-field pc-bank-field-wide"><label>备注</label><Input.TextArea value={draft.note} maxLength={400} rows={3} placeholder="请输入备注" onChange={(event) => change('note', event.target.value)} /></div>
      </div>
      {selectedBranch && <div className="pc-form-help">已根据所选分行带出开户地区信息。</div>}
      <div className="pc-form-help">当前为演示资料，附件仅记录本次选择的文件名。</div>
    </Modal>
  );
}

function InvitationModal({ open, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  useEffect(() => { if (open) form.resetFields(); }, [open, form]);
  return (
    <Modal open={open} centered width={620} title="邀请注册" onCancel={onCancel} destroyOnClose className="pc-modal" footer={[
      <Button key="cancel" onClick={onCancel}>取消</Button>,
      <Button key="submit" type="primary" onClick={() => form.submit()}>提交邀请</Button>,
    ]}>
      <Form form={form} layout="vertical" initialValues={{ supplierType: supplierTypes[0] }} onFinish={onSubmit} className="pc-invite-form">
        <div className="pc-form-grid">
          <Form.Item name="supplierType" label="供应商类型" rules={[{ required: true, message: '请选择供应商类型' }]}><Select options={supplierTypes.map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="supplierName" label="供应商名称/姓名" rules={[{ required: true, whitespace: true, message: '请输入供应商名称/姓名' }]}><Input maxLength={120} placeholder="请输入供应商名称/姓名" /></Form.Item>
          <Form.Item name="contactName" label="联系人姓名" rules={[{ required: true, whitespace: true, message: '请输入联系人姓名' }]}><Input maxLength={60} placeholder="请输入联系人姓名" /></Form.Item>
          <Form.Item name="contactEmail" label="联系人邮箱" rules={[{ required: true, type: 'email', message: '请输入正确的联系人邮箱' }]}><Input maxLength={120} placeholder="请输入联系人邮箱" /></Form.Item>
          <Form.Item name="contactPhone" label="联系人手机" rules={[{ required: true, message: '请输入联系人手机' }, { pattern: /^\+?[\d -]{7,20}$/, message: '请输入正确的联系人手机' }]}><Input maxLength={20} placeholder="请输入联系人手机" /></Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

function InviterModal({ open, ids, suppliers, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  useEffect(() => { if (open) form.resetFields(); }, [open, form]);
  const targets = suppliers.filter((record) => ids.includes(record.id));
  return (
    <Modal open={open} centered width={620} title="变更邀请人" onCancel={onCancel} destroyOnClose className="pc-modal" footer={[
      <Button key="cancel" onClick={onCancel}>取消</Button>,
      <Button key="submit" type="primary" onClick={() => form.submit()}>确认变更</Button>,
    ]}>
      <div className="pc-modal-summary">本次变更 <strong>{targets.length}</strong> 家供应商的邀请人</div>
      <div className="pc-modal-records">{targets.map((record) => <div className="pc-modal-record" key={record.id}><span>{record.name}</span><span>原邀请人：{record.inviter || '—'}</span></div>)}</div>
      <Form form={form} layout="vertical" onFinish={(values) => onSubmit(values.inviter)} className="pc-inviter-form">
        <Form.Item name="inviter" label="新邀请人" rules={[{ required: true, message: '请选择新邀请人' }]}>
          <Select showSearch optionFilterProp="label" placeholder="请选择新邀请人" options={people.map((person) => ({ value: person.name, label: person.name + ' · ' + person.userCode + ' · ' + person.department }))} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function HelpModal({ open, onClose }) {
  return <Modal open={open} centered width={560} title="操作指导" onCancel={onClose} footer={[<Button key="close" type="primary" onClick={onClose}>知道了</Button>]} className="pc-modal">
    <div className="pc-help-content">
      <p>供应商查询支持按名称、类型、状态、推荐行业、邀请人和邀请时间筛选。</p>
      <p>点击供应商名称或【详情】查看供应商信息、联系人、银行账户、权限及审批记录。</p>
      <p>银行账户单条保存后仍需在银行信息页点击【提交审批】；提交成功后供应商进入【变更中】。</p>
    </div>
  </Modal>;
}

function PcAdminApp() {
  const [route, setRoute] = useState(readRoute);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarScrolled, setSidebarScrolled] = useState(false);
  const [contentScrolled, setContentScrolled] = useState(false);
  const mainScrollRef = useRef(null);
  const scrollPositions = useRef({ suppliers: 0, invitations: 0 });
  const detailReturnPage = useRef('suppliers');

  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = sessionStorage.getItem('supplier:pc-session:v1');
      return saved ? JSON.parse(saved) : clone(initialSuppliers);
    } catch {
      return clone(initialSuppliers);
    }
  });
  const [supplierFilters, setSupplierFilters] = useState({ ...EMPTY_SUPPLIER_FILTERS });
  const [appliedSupplierFilters, setAppliedSupplierFilters] = useState({ ...EMPTY_SUPPLIER_FILTERS });
  const [invitationFilters, setInvitationFilters] = useState({ ...EMPTY_INVITATION_FILTERS });
  const [appliedInvitationFilters, setAppliedInvitationFilters] = useState({ ...EMPTY_INVITATION_FILTERS });
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [selectedInvitationIds, setSelectedInvitationIds] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState('supplier');
  const [bankDrafts, setBankDrafts] = useState(() => Object.fromEntries(initialSuppliers.map((supplier) => [supplier.id, readBankDraftSafe(supplier.id) || clone(supplier.banks || [])])));
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviterOpen, setInviterOpen] = useState(false);
  const [inviterTargetIds, setInviterTargetIds] = useState([]);
  const [bankModal, setBankModal] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = route.page === 'detail' ? '供应商详情 - 搜狐供应商管理平台' : '搜狐供应商管理平台';
    if (!mainScrollRef.current) return;
    mainScrollRef.current.scrollTop = route.page === 'detail' ? 0 : (scrollPositions.current[route.page] || 0);
  }, [route.page, route.id]);

  useEffect(() => {
    try {
      sessionStorage.setItem('supplier:pc-session:v1', JSON.stringify(suppliers));
    } catch {
      messageApi.error('本次演示数据无法保存到当前会话。');
    }
  }, [suppliers, messageApi]);

  const currentSupplier = suppliers.find((supplier) => supplier.id === route.id) || suppliers[0];
  const currentBankEntries = currentSupplier ? (bankDrafts[currentSupplier.id] || currentSupplier.banks || []) : [];
  const originalBanks = currentSupplier?.banks || [];
  const pendingBankCount = currentSupplier ? bankChangeCounts(originalBanks, currentBankEntries).total : 0;

  const supplierRows = useMemo(() => suppliers.filter((record) => {
    const filters = appliedSupplierFilters;
    return (!filters.name || String(record.name || '').toLowerCase().includes(filters.name.trim().toLowerCase()))
      && (!filters.type || record.type === filters.type)
      && (!filters.status || record.status === filters.status)
      && (!filters.recommended || (record.industry || record.basic?.industry) === filters.recommended)
      && (!filters.inviter || String(record.inviter || '').includes(filters.inviter.trim()))
      && isDateInRange(record.date, filters.start, filters.end);
  }), [suppliers, appliedSupplierFilters]);

  const invitationRows = useMemo(() => suppliers.filter((record) => {
    const filters = appliedInvitationFilters;
    return record.inviter === CURRENT_USER
      && (!filters.name || String(record.name || '').toLowerCase().includes(filters.name.trim().toLowerCase()))
      && (!filters.status || record.status === filters.status)
      && (!filters.type || record.type === filters.type)
      && (!filters.registrationNumber || String(record.code || '').includes(filters.registrationNumber.trim()))
      && isDateInRange(record.date, filters.start, filters.end);
  }), [suppliers, appliedInvitationFilters]);

  const navigate = (path) => {
    if (window.location.hash === '#' + path) { setRoute(readRoute()); return; }
    window.location.hash = path;
  };
  const openDetail = (supplier, fromPage, tab = 'supplier') => {
    detailReturnPage.current = fromPage;
    if (mainScrollRef.current) scrollPositions.current[fromPage] = mainScrollRef.current.scrollTop;
    setActiveDetailTab(tab);
    navigate('/admin/suppliers/' + encodeURIComponent(supplier.id));
  };
  const backFromDetail = () => navigate(detailReturnPage.current === 'invitations' ? '/admin/invitations' : '/admin/suppliers');
  const setSupplierFilter = (key, value) => setSupplierFilters((current) => ({ ...current, [key]: value }));
  const setInvitationFilter = (key, value) => setInvitationFilters((current) => ({ ...current, [key]: value }));
  const applySupplierFilters = () => { setAppliedSupplierFilters({ ...supplierFilters }); setSelectedSupplierIds([]); };
  const resetSupplierFilters = () => { setSupplierFilters({ ...EMPTY_SUPPLIER_FILTERS }); setAppliedSupplierFilters({ ...EMPTY_SUPPLIER_FILTERS }); setSelectedSupplierIds([]); };
  const applyInvitationFilters = () => { setAppliedInvitationFilters({ ...invitationFilters }); setSelectedInvitationIds([]); };
  const resetInvitationFilters = () => { setInvitationFilters({ ...EMPTY_INVITATION_FILTERS }); setAppliedInvitationFilters({ ...EMPTY_INVITATION_FILTERS }); setSelectedInvitationIds([]); };

  const handleInviteSubmit = (values) => {
    const name = values.supplierName.trim();
    const duplicate = reinviteCandidate(suppliers, name, CURRENT_USER);
    if (duplicate) {
      if (duplicate.type !== values.supplierType) {
        messageApi.warning('同名供应商的类型与本次填写不一致，请核对供应商类型后重试。');
        return;
      }
      Modal.confirm({
        title: '重新邀请确认',
        content: '您名下存在同名且为草稿或注册驳回的供应商，是否重新进行邀请。',
        okText: '重新邀请',
        cancelText: '取消',
        onOk: () => {
          const latest = suppliers.find((record) => record.id === duplicate.id);
          if (!latest || latest.inviter !== CURRENT_USER || latest.name.trim() !== name || !canReinviteSupplier(latest) || latest.type !== values.supplierType) {
            messageApi.warning('供应商资料或办理状态已变化，请核对后重新提交。');
            return;
          }
          setSuppliers((current) => current.map((record) => record.id === duplicate.id ? { ...record, status: '邀请中', contact: values.contactName.trim(), email: values.contactEmail.trim(), phone: values.contactPhone.trim(), updated: nowText() } : record));
          setInviteOpen(false);
          messageApi.success('重新邀请已提交（演示数据）');
        },
      });
      return;
    }
    const time = nowText();
    const record = {
      id: newId(), name, type: values.supplierType, status: '邀请中', mode: '邀请注册',
      inviter: CURRENT_USER, date: time, updated: time, score: '未评分', code: '',
      email: values.contactEmail.trim(), contact: values.contactName.trim(), phone: values.contactPhone.trim(),
      banks: [], permissions: [],
    };
    setSuppliers((current) => [record, ...current]);
    setInviteOpen(false);
    messageApi.success('邀请已提交（演示数据）');
  };

  const handleReinvite = (record) => Modal.confirm({
    title: '重新邀请',
    content: '确认重新邀请“' + record.name + '”吗？',
    okText: '重新邀请',
    cancelText: '取消',
    onOk: () => {
      const latest = suppliers.find((item) => item.id === record.id);
      if (!latest || latest.inviter !== CURRENT_USER || !canReinviteSupplier(latest)) {
        messageApi.warning('该供应商当前状态已变化，请刷新列表后重试。');
        return;
      }
      setSuppliers((current) => current.map((item) => item.id === record.id ? { ...item, status: '邀请中', updated: nowText() } : item));
      messageApi.success('重新邀请已提交（演示数据）');
    },
  });

  const handleDelete = (ids, mine) => {
    const targets = suppliers.filter((record) => ids.includes(record.id));
    const invalid = targets.filter((record) => !canDeleteSupplier(record, mine));
    if (!targets.length || invalid.length) {
      messageApi.error(invalid.length ? '以下供应商当前状态不支持删除：' + invalid.map((record) => record.name).join('、') : '请选择供应商');
      return;
    }
    Modal.confirm({
      title: '删除供应商',
      content: '确认删除选中的 ' + targets.length + ' 家供应商吗？',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const latestTargets = suppliers.filter((record) => ids.includes(record.id));
        const latestInvalid = latestTargets.filter((record) => !canDeleteSupplier(record, mine));
        if (latestInvalid.length) {
          messageApi.error('供应商状态已变化，当前不可删除：' + latestInvalid.map((record) => record.name).join('、'));
          return;
        }
        setSuppliers((current) => current.filter((record) => !ids.includes(record.id)));
        setSelectedSupplierIds([]);
        setSelectedInvitationIds([]);
        messageApi.success('已删除所选演示记录');
      },
    });
  };

  const openInviter = (ids) => { setInviterTargetIds(ids); setInviterOpen(true); };
  const handleSupplierAction = (record, key) => {
    if (key === 'inviter') openInviter([record.id]);
    else openDetail(record, 'suppliers', key);
  };
  const handleInviterSubmit = (newInviter) => {
    const targets = suppliers.filter((record) => inviterTargetIds.includes(record.id));
    const invalid = targets.filter((record) => !canChangeSupplier(record));
    if (invalid.length) { messageApi.error('以下供应商当前不满足变更邀请人条件：' + invalid.map((record) => record.name).join('、')); return false; }
    const same = targets.filter((record) => record.inviter === newInviter);
    if (same.length) { messageApi.error('新邀请人与以下供应商的原邀请人相同：' + same.map((record) => record.name).join('、')); return false; }
    setSuppliers((current) => current.map((record) => inviterTargetIds.includes(record.id) ? { ...record, inviter: newInviter, updated: nowText() } : record));
    setInviterOpen(false);
    setSelectedInvitationIds([]);
    setSelectedSupplierIds([]);
    messageApi.success('邀请人已变更（演示数据）');
    return true;
  };

  const handleExportSuppliers = () => exportCsv(supplierRows, [
    { title: '供应商名称', dataIndex: 'name' }, { title: '供应商类型', dataIndex: 'type' },
    { title: '审批状态', dataIndex: 'status' }, { title: '注册方式', dataIndex: 'mode' },
    { title: '邀请人', dataIndex: 'inviter' }, { title: '邀请时间', dataIndex: 'date' },
    { title: '更新时间', dataIndex: 'updated' }, { title: '评分', dataIndex: 'score' },
  ], '供应商查询.csv');

  const handleExportInvitations = () => exportCsv(invitationRows, [
    { title: '供应商名称', dataIndex: 'name' }, { title: '证件号码', dataIndex: 'code' },
    { title: '供应商类型', dataIndex: 'type' }, { title: '联系人姓名', dataIndex: 'contact' },
    { title: '联系人邮箱', dataIndex: 'email' }, { title: '联系人电话', dataIndex: 'phone' },
    { title: '审批状态', dataIndex: 'status' }, { title: '邀请时间', dataIndex: 'date' },
    { title: '更新时间', dataIndex: 'updated' },
  ], '我的邀请.csv');

  const saveBankDraft = (supplierId, entries) => {
    try {
      writeBankDraft(supplierId, entries);
      setBankDrafts((current) => ({ ...current, [supplierId]: entries }));
      return true;
    } catch {
      messageApi.error('银行信息暂存失败，请检查浏览器本地存储后重试。');
      return false;
    }
  };
  const openBankModal = (bank) => setBankModal({ bank: bank ? { ...bank } : null });

  const handleBankSave = (draft) => {
    if (!currentSupplier || !canChangeSupplier(currentSupplier)) { messageApi.error('当前供应商状态不支持银行信息变更，请刷新资料后重试。'); return; }
    const error = bankError(draft, currentSupplier.type === supplierTypes[0]);
    if (error) { messageApi.error(error); return; }
    const current = currentBankEntries || [];
    const index = current.findIndex((entry) => entry.id === draft.id);
    const next = index >= 0 ? current.map((entry) => entry.id === draft.id ? { ...draft } : entry) : [...current, { ...draft, id: draft.id || newId() }];
    if (!saveBankDraft(currentSupplier.id, normalizeBankChanges(originalBanks, next))) return;
    setBankModal(null);
    messageApi.success('账户已保存，待提交审批');
  };

  const handleBankDelete = (bank) => Modal.confirm({
    title: '删除银行账户',
    content: '删除后需提交审批才会更新正式资料，确认删除该账户吗？',
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      const latest = suppliers.find((record) => record.id === currentSupplier?.id);
      if (!latest || !canChangeSupplier(latest)) { messageApi.error('供应商状态已变化，当前不可修改银行信息。'); return; }
      const existing = originalBanks.find((record) => record.id === bank.id);
      const next = existing ? currentBankEntries.map((record) => record.id === bank.id ? { ...record, change: '删除' } : record) : currentBankEntries.filter((record) => record.id !== bank.id);
      saveBankDraft(currentSupplier.id, normalizeBankChanges(originalBanks, next));
    },
  });

  const handleBankReturn = () => {
    if (pendingBankCount > 0) {
      Modal.confirm({
        title: '离开银行信息',
        content: '银行信息尚未提交审批，已保存内容将保留，可稍后继续处理。',
        okText: '确认离开',
        cancelText: '继续处理',
        onOk: backFromDetail,
      });
    } else backFromDetail();
  };

  const handleBankSubmit = () => {
    if (!currentSupplier || !canChangeSupplier(currentSupplier)) { messageApi.error('当前供应商状态不支持银行信息变更，请刷新资料后重试。'); return; }
    const counts = bankChangeCounts(originalBanks, currentBankEntries);
    if (!counts.total) { messageApi.warning('请先新增、修改或删除银行账户。'); return; }
    const activeEntries = currentBankEntries.filter((entry) => bankChange(originalBanks, entry).action !== '删除');
    const company = currentSupplier.type === supplierTypes[0];
    const invalid = activeEntries.map((entry) => ({ entry, error: bankError(entry, company) })).find((item) => item.error);
    if (invalid) { messageApi.error((invalid.entry.name || invalid.entry.number || '银行账户') + '：' + invalid.error); return; }
    if (company && activeEntries.filter((entry) => entry.accountType === '基本账户').length !== 1) { messageApi.error('企业供应商有效银行账户必须且只能有一个基本账户。'); return; }
    Modal.confirm({
      title: '提交银行信息变更审批',
      content: '确认提交 ' + counts.total + ' 条银行账户变更吗？提交成功后供应商状态将变为“变更中”。',
      okText: '提交审批',
      cancelText: '取消',
      onOk: () => {
        const latest = suppliers.find((record) => record.id === currentSupplier.id);
        if (!latest || !canChangeSupplier(latest)) { messageApi.error('供应商状态已变化，暂时无法提交银行信息变更。'); return; }
        try { writeBankDraft(currentSupplier.id, null); }
        catch { messageApi.error('待提交资料清理失败，本次未提交审批。'); return; }
        setBankDrafts((current) => ({ ...current, [currentSupplier.id]: clone(originalBanks) }));
        setSuppliers((current) => current.map((record) => record.id === currentSupplier.id ? { ...record, status: '变更中', updated: nowText() } : record));
        messageApi.success('银行信息变更已提交审批（演示数据）');
      },
    });
  };

  const isDetail = route.page === 'detail';
  const parentPage = isDetail ? detailReturnPage.current : route.page;
  const breadcrumbItems = [
    { title: <a href="#/admin/suppliers">供应商管理</a> },
    { title: isDetail ? <a href={parentPage === 'invitations' ? '#/admin/invitations' : '#/admin/suppliers'}>{parentPage === 'invitations' ? '我的邀请' : '供应商查询'}</a> : route.page === 'invitations' ? '我的邀请' : '供应商查询' },
  ];
  if (isDetail) breadcrumbItems.push({ title: currentSupplier?.name || '供应商详情' });

  const accountMenu = {
    items: [
      { key: 'account', label: '演示账号：' + CURRENT_USER, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogOut size={14} />, label: '返回协同门户' },
    ],
    onClick: ({ key }) => { if (key === 'logout') navigate('/login'); },
  };

  return (
    <ConfigProvider componentSize="middle" theme={{
      token: {
        colorPrimary: '#145CFF', colorInfo: '#145CFF', colorSuccess: '#14AE5C',
        colorWarning: '#F27D0C', colorError: '#EC221F', colorBgLayout: '#F2F5FA',
        colorBgContainer: '#FFFFFF', colorBorder: '#D3D9E5', colorText: '#1D2126',
        colorTextSecondary: '#545B66', colorTextTertiary: '#848B99', borderRadius: 4,
        controlHeight: 32, fontSize: 14, fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif',
      },
      components: {
        Button: { controlHeight: 32, borderRadius: 4, primaryShadow: 'none' },
        Input: { controlHeight: 32, borderRadius: 4 },
        Select: { controlHeight: 32, borderRadius: 4 },
        DatePicker: { controlHeight: 32, borderRadius: 4 },
        Table: { headerBg: '#F2F5FA', cellPaddingBlock: 9, cellPaddingInline: 12, borderColor: '#D3D9E5' },
        Modal: { borderRadiusLG: 12 },
        Tabs: { inkBarColor: '#145CFF', itemSelectedColor: '#145CFF', horizontalItemPadding: '10px 0' },
      },
    }}>
      {contextHolder}
      <div className={'pc-app ' + (collapsed ? 'is-collapsed' : '')}>
        <header className={'pc-topbar ' + (contentScrolled ? 'is-scrolled' : '')}>
          <a className="pc-brand" href="#/admin/suppliers" aria-label="搜狐供应商管理平台">
            <span className="pc-brand-mark"><strong>搜狐</strong><small>SOHU.com</small></span>
            <span className="pc-brand-name">供应商管理平台</span>
          </a>
          <div className="pc-topbar-context"><Breadcrumb items={breadcrumbItems} /></div>
          <div className="pc-topbar-actions">
            <Button type="text" icon={<CircleHelp size={16} />} onClick={() => setHelpOpen(true)}>操作指导</Button>
            <span className="pc-topbar-divider" />
            <Dropdown menu={accountMenu} trigger={['click']} placement="bottomRight">
              <button className="pc-user-trigger" type="button" aria-label="打开账户菜单"><Avatar size={28} className="pc-avatar">陈</Avatar><ChevronDown size={14} /></button>
            </Dropdown>
          </div>
        </header>
        <div className="pc-workspace">
          <aside className={'pc-sidebar ' + (sidebarScrolled ? 'is-scrolled' : '')}>
            <div className="pc-sidebar-nav" onScroll={(event) => setSidebarScrolled(event.currentTarget.scrollTop > 0)}>
              <div className="pc-menu-group">
                <div className="pc-menu-group-title"><Building2 size={15} /><span>供应商管理</span></div>
                <Tooltip title={collapsed ? '供应商查询' : ''} placement="right"><a className={'pc-menu-item ' + (parentPage === 'suppliers' ? 'is-active' : '')} href="#/admin/suppliers" aria-current={parentPage === 'suppliers' ? 'page' : undefined}><ClipboardList size={16} /><span className="pc-menu-label">供应商查询</span></a></Tooltip>
                <Tooltip title={collapsed ? '我的邀请' : ''} placement="right"><a className={'pc-menu-item ' + (parentPage === 'invitations' ? 'is-active' : '')} href="#/admin/invitations" aria-current={parentPage === 'invitations' ? 'page' : undefined}><UserRoundPlus size={16} /><span className="pc-menu-label">我的邀请</span></a></Tooltip>
              </div>
              <div className="pc-menu-group">
                <div className="pc-menu-group-title"><LayoutDashboard size={15} /><span>协同门户</span></div>
                <Tooltip title={collapsed ? '协同门户登录' : ''} placement="right"><a className="pc-menu-item" href="#/login"><UserRound size={16} /><span className="pc-menu-label">协同门户登录</span></a></Tooltip>
              </div>
            </div>
            <div className="pc-sidebar-footer">
              <Tooltip title={collapsed ? '展开侧栏' : '收起侧栏'} placement="right">
                <button type="button" className="pc-collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? '展开侧栏' : '收起侧栏'}>
                  {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
                  <span className="pc-menu-label">{collapsed ? '展开侧栏' : '收起侧栏'}</span>
                </button>
              </Tooltip>
            </div>
          </aside>
          <main className="pc-main">
            <div className="pc-main-scroll" ref={mainScrollRef} onScroll={(event) => setContentScrolled(event.currentTarget.scrollTop > 0)}>
              <div className="pc-main-content">
                {route.page === 'detail' && currentSupplier ? (
                  <SupplierDetailPage
                    supplier={currentSupplier}
                    activeTab={activeDetailTab}
                    setActiveTab={setActiveDetailTab}
                    bankEntries={currentBankEntries}
                    pendingBankCount={pendingBankCount}
                    onBankAdd={() => openBankModal(null)}
                    onBankEdit={(bank) => openBankModal(bank)}
                    onBankDelete={handleBankDelete}
                    onBankReturn={handleBankReturn}
                    onBankSubmit={handleBankSubmit}
                  />
                ) : route.page === 'invitations' ? (
                  <MyInvitationsPage
                    filters={invitationFilters}
                    setFilters={setInvitationFilter}
                    onSearch={applyInvitationFilters}
                    onReset={resetInvitationFilters}
                    rows={invitationRows}
                    selectedIds={selectedInvitationIds}
                    setSelectedIds={setSelectedInvitationIds}
                    onOpenDetail={openDetail}
                    onChangeInviter={openInviter}
                    onReinvite={handleReinvite}
                    onDelete={handleDelete}
                    onExport={handleExportInvitations}
                  />
                ) : (
                  <SupplierQueryPage
                    filters={supplierFilters}
                    setFilters={setSupplierFilter}
                    onSearch={applySupplierFilters}
                    onReset={resetSupplierFilters}
                    rows={supplierRows}
                    selectedIds={selectedSupplierIds}
                    setSelectedIds={setSelectedSupplierIds}
                    onInvite={() => setInviteOpen(true)}
                    onRegister={() => navigate('/register/company')}
                    onDelete={handleDelete}
                    onExport={handleExportSuppliers}
                    onOpenDetail={openDetail}
                    onDetailAction={handleSupplierAction}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      <InvitationModal open={inviteOpen} onCancel={() => setInviteOpen(false)} onSubmit={handleInviteSubmit} />
      <InviterModal open={inviterOpen} ids={inviterTargetIds} suppliers={suppliers} onCancel={() => setInviterOpen(false)} onSubmit={handleInviterSubmit} />
      <BankModal open={!!bankModal} supplier={currentSupplier} bank={bankModal?.bank} onCancel={() => setBankModal(null)} onSave={handleBankSave} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ConfigProvider>
  );
}

export { PcAdminApp };
