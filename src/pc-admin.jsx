import { InvitationEditor, InviterChangePage } from './pc/invitation-workspace.jsx';
import { SupplierExportModal } from './pc/supplier-export.jsx';
import { MyRatingsWorkspace, PcRatingEditor } from './pc/rating-workspace.jsx';
import FixedActionBar from './erp/FixedActionBar.jsx';
import SectionCardTitle from './erp/SectionCardTitle.jsx';
import { otherWorkspaceFeatures } from './pc/workspace-links.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Breadcrumb, Button, Card, ConfigProvider, DatePicker, Dropdown, Form, Input, Menu, Select, Space, Tabs, Tag, Tooltip, App } from 'antd-pc';
import zhCN from 'antd-pc/es/locale/zh_CN';
import { ChevronDown, ChevronRight, CircleHelp, Download, Plus, Trash2, UserRoundPlus } from 'lucide-react';
import { bankDirectory, branches, initialSuppliers, people, supplierIndustries, supplierStates, supplierTypes } from './pages/mobile-data.js';
import { bankChange, bankChangeCounts, normalizeBankChanges, readBankDraft, writeBankDraft } from './pages/mobile-bank-changes.js';
import { blankBank, bankError, bankFieldError, fieldsFor } from './pages/mobile-forms.jsx';
import { canChangeSupplier, canDeleteSupplier, canRateSupplier, canReinviteSupplier, canSelectSupplierForBatch,
  certificateNumber, displayCertificateNumber, supplierListActions } from './pages/mobile-rules.js';
import { attachmentFiles, attachmentName, rememberAttachment } from './pages/mobile-interaction.jsx';
import { bankAccountsError, isEffectiveBasicBankAccount, reinviteCandidate, validEmail } from './pages/mobile-edit-rules.js';

import { SupplierRegisterPage, registerTypeFromHash } from './pages/supplier-register.jsx';
import { PermissionModal, QuickSupplierModal } from './pc/admin-workflows.jsx';
import { SupplierProfileEditor } from './pc/record-editor.jsx';
import { ApprovalTaskDetail, ApprovalTaskList, createApprovalTask, initialApprovalTasks, Changes } from './pc/approval-workspace.jsx';
import { resolveSupplierApproval, supplierApprovalNodes, supplierProfileConflict } from './pc/supplier-approval.js';
import { BankApplicationPage } from './pc/bank-application.jsx';
import { BlacklistPage, ManualSyncPage, RatingPage } from './pc/admin-tools.jsx';
import { initialRatings } from './pages/mobile-workflows.jsx';
import erpTheme from './erp/theme.js';
import DelayedNavIcon from './erp/DelayedNavIcon.jsx';
import QueryBar, { QueryItem } from './erp/QueryBar.jsx';
import { DetailGrid, DetailItem } from './erp/DetailGrid.jsx';
import { PcTable, EmptyContent, StatusTag, PcModal, QueryResults, QueryBatchBar } from './erp/components.jsx';

const managementItems = [
  { key: 'suppliers', label: '供应商查询' },
  { key: 'assign-ou', label: '分配OU（已下线）', disabled: true },
  { key: 'invitations', label: '我的邀请' },
  { key: 'blacklist', label: '黑名单管理' },
  { key: 'quick-create', label: '快速创建供应商' },
  { key: 'login', label: '协同门户—登录' },
  { key: 'my-ratings', label: '我的评分' },
  { key: 'ratings', label: '供应商评分' },
  { key: 'manual-sync', label: '供应商运维-手动同步' },
  { key: 'rating-operations', label: '供应商运维-评分查询' },
  { key: 'bank-applications', label: '银行信息申请' },
];
const approvalItems = [
  { key: 'approval-pending', label: '待审批任务' },
  { key: 'approval-processed', label: '已审批任务' },
];
const menuItems = [
  { key: 'management', label: '供应商管理', kind: 'supplier', children: managementItems },
  { key: 'approvals', label: '审批任务管理', kind: 'approval', children: approvalItems },
];
const menuLabels = Object.fromEntries([...managementItems, ...approvalItems].map(({ key, label }) => [key, label]));
const approvalPages = new Set(approvalItems.map(({ key }) => key));
const ratingPages = new Set(['my-ratings', 'ratings', 'rating-operations']);
const compactSidebar = '(max-width: 960px)';
const compactDetail = '(max-width: 760px)';

function useMediaMatch(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

const CURRENT_USER = '陈才慧';
const CURRENT_DEPARTMENT = people.find((person) => person.name === CURRENT_USER)?.department || '集团总部.ERP部.平台技术部';
const supplierStorageKey = 'supplier:pc-session:v1';
const approvalStorageKey = 'supplier:pc-approval-tasks:v1';
const profileOf = (record) => ({
  type: record.type,
  basic: { supplierName: record.name, creditCode: record.code, registerEmail: record.registerEmail || (record.mode === '代注册' && !record.basic ? record.email : undefined), ...record.basic },
  contacts: record.contacts || (record.contact ? [{ id: 'legacy-contact', name: record.contact, phone: record.phone, email: record.email }] : []),
  banks: record.banks || [],
});
const pcBranches = [
  ...branches,
  { name: '北京市分行', bank: bankDirectory[1]?.name, country: '中国', province: '北京市', city: '北京市' },
  { name: '上海市分行', bank: bankDirectory[2]?.name, country: '中国', province: '上海市', city: '上海市' },
  { name: '广州市分行', bank: bankDirectory[3]?.name, country: '中国', province: '广东省', city: '广州市' },
  { name: '深圳市分行', bank: bankDirectory[4]?.name, country: '中国', province: '广东省', city: '深圳市' },
].filter((item) => item.bank);
const EMPTY_SUPPLIER_FILTERS = { name: '', type: '', status: '', recommended: '', inviter: '', certificate: '', start: null, end: null };
const EMPTY_INVITATION_FILTERS = { name: '', status: '', type: '', registrationNumber: '', start: null, end: null };
const clone = (value) => JSON.parse(JSON.stringify(value));
const newId = () => 'pc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
const nowText = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
const dateText = (value) => value && typeof value.format === 'function' ? value.format('YYYY-MM-DD') : '';
const invitationDay = (value) => String(value || '').replace(/^(\d{4})-(\d{1,2})-(\d{1,2})(?=\D|$)/,
  (_, year, month, day) => [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-')).slice(0, 10);
const latestInvitationFirst = (left, right) => invitationDay(right.date).localeCompare(invitationDay(left.date))
  || String(right.date || '').split(' ').at(-1).localeCompare(String(left.date || '').split(' ').at(-1));
const valueOrDash = (value) => value === null || value === undefined || value === '' ? '-' : value;
const readBankDraftSafe = (id) => { try { return readBankDraft(id); } catch { return null; } };
const detailPath = (id, from, action = '') => '/admin/suppliers/' + encodeURIComponent(id)
  + (action ? '/' + action : '') + (from === 'invitations' ? '?from=invitations' : '');

function useScrollbarActivity() {
  const timers = useRef(new Map());
  useEffect(() => () => {
    timers.current.forEach((timer, element) => {
      window.clearTimeout(timer);
      element.classList.remove('is-scroll-active');
    });
    timers.current.clear();
  }, []);
  return useCallback((event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const regions = new Set([target, target.closest('.ant-table-wrapper')]);
    regions.forEach((element) => {
      if (!element) return;
      window.clearTimeout(timers.current.get(element));
      element.classList.add('is-scroll-active');
      timers.current.set(element, window.setTimeout(() => {
        element.classList.remove('is-scroll-active');
        timers.current.delete(element);
      }, 600));
    });
  }, []);
}

function readRoute() {
  const [routePath, query] = window.location.hash.slice(1).split('?');
  const path = routePath || '/admin/suppliers';
  const params = new URLSearchParams(query);
  const origin = params.get('from') === 'invitations' ? 'invitations' : undefined;
  if (path === '/admin/register' || path.startsWith('/register/')) {
    return { page: 'register', type: registerTypeFromHash(path) };
  }
  const action = path.match(/^\/admin\/(suppliers|invitations)\/(invite|reinvite|change-inviter|draft|rating|banks|permissions|register)(?:\/([^/?]+))?$/);
  if (action && (action[3] || ['invite', 'change-inviter', 'register'].includes(action[2]))) {
    return { page: action[2], from: action[1], id: action[3] && decodeURIComponent(action[3]) };
  }
  const myRating = path.match(/^\/admin\/my-ratings\/(edit|detail)\/([^/?]+)$/);
  if (myRating) return { page: 'my-ratings', id: decodeURIComponent(myRating[2]), ratingReadOnly: myRating[1] === 'detail' };
  const bankApplication = path.match(/^\/admin\/bank-applications(?:\/(form|result))?$/);
  if (bankApplication) return { page: 'bank-applications', bankApplicationView: bankApplication[1] || 'notice' };
  const approval = path.match(/^\/admin\/(approval-pending|approval-processed)(?:\/([^/?]+))?$/);
  if (approval) return { page: approval[1], id: approval[2] && decodeURIComponent(approval[2]) };
  const page = path.split('/')[2];
  if (['blacklist', 'manual-sync', 'bank-applications'].includes(page) || ratingPages.has(page)) return { page };
  const detailMaintenance = path.match(/^\/admin\/suppliers\/([^/?]+)\/(banks|permissions)$/);
  if (detailMaintenance) return { page: detailMaintenance[2], id: decodeURIComponent(detailMaintenance[1]), fromDetail: true, origin };
  const detailRating = path.match(/^\/admin\/suppliers\/([^/?]+)\/rating$/);
  if (detailRating) return { page: 'rating', id: decodeURIComponent(detailRating[1]), fromDetail: true, origin };
  const edit = path.match(/^\/admin\/suppliers\/([^/?]+)\/edit$/);
  if (edit) return { page: 'profile-edit', id: decodeURIComponent(edit[1]) };
  const detail = path.match(/^\/admin\/suppliers\/([^/?]+)/);
  if (detail) return { page: 'detail', id: decodeURIComponent(detail[1]), origin };
  if (path.startsWith('/admin/invitations')) return { page: 'invitations' };
  return { page: 'suppliers' };
}

function SupplierFields({ fields, labelWidth }) {
  const compact = useMediaMatch(compactDetail);
  return (
    <DetailGrid columns={compact ? 1 : 3} labelWidth={labelWidth} className="pc-detail-grid">
      {fields.map((field) => (
        <DetailItem key={field.label} label={field.label} span={field.span}>
          {valueOrDash(field.value)}
        </DetailItem>
      ))}
    </DetailGrid>
  );
}

function isDateInRange(value, start, end) {
  const date = invitationDay(value);
  const from = dateText(start);
  const to = dateText(end);
  if (!date && (from || to)) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function exportCsv(rows, columns, filename) {
  const escape = (value) => {
    const text = String(value ?? '');
    const safeText = /^[=+@-]/.test(text) ? "'" + text : text;
    return '"' + safeText.replaceAll('"', '""') + '"';
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

function invitationDateRange(start, end) {
  return start || end ? (dateText(start) || '不限') + ' 至 ' + (dateText(end) || '不限') : '';
}

function SupplierQueryPage({ pagination, onPagination, canBatchDelete, filters, appliedFilters, setFilters, onSearch, onReset, rows, selectedIds, setSelectedIds, onInvite, onRegister, onDelete, onExport, onOpenDetail, onDetailAction }) {
  const appliedConditions = [
    ['搜索关键词', appliedFilters.name?.trim()],
    ['供应商类型', appliedFilters.type],
    ['供应商状态', appliedFilters.status],
    ['邀请时间', invitationDateRange(appliedFilters.start, appliedFilters.end)],
    ['供应商推荐', appliedFilters.recommended],
    ['邀请人', appliedFilters.inviter?.trim()],
    ['证件号码', appliedFilters.certificate?.trim()],
  ].filter(([, value]) => value);
  const columns = [
    { title: '供应商名称', dataIndex: 'name', width: 240, render: (name, record) => <Tooltip title={name}><button className="pc-link pc-name-link" onClick={() => onOpenDetail(record, 'suppliers')}>{name || '未填写供应商名称'}</button></Tooltip> },
    { title: '供应商类型', dataIndex: 'type', width: 130 },
    { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
    { title: '注册方式', dataIndex: 'mode', width: 120 },
    { title: '邀请人', dataIndex: 'inviter', width: 110 },
    { title: '邀请时间', dataIndex: 'date', width: 180, align: 'center' },
    { title: '更新时间', dataIndex: 'updated', width: 180, align: 'center' },
    { title: '评分', dataIndex: 'score', width: 100, alignmentType: 'number', render: (value, record) => value === '未评分'
      ? value : <Button type="link" size="small" className="pc-row-action-button"
        aria-label={'查看' + record.name + '的合作信息及评分（' + value + '）'}
        onClick={() => onOpenDetail(record, 'suppliers', 'cooperation')}>{value}</Button> },
    {
      title: '操作', key: 'actions', width: 88, fixed: 'right', align: 'right',
      render: (_, record) => {
        const actions = supplierListActions(record);
        const items = [
          ...(actions.bank ? [{ key: 'banks', label: '修改银行' }] : []),
          ...(actions.permissions ? [{ key: 'permissions', label: '分配权限' }] : []),
          ...(actions.inviter ? [{ key: 'inviter', label: '变更邀请人' }] : []),
          ...(actions.score ? [{ key: 'rate', label: '评分' }] : []),
          { key: 'approval', label: '查看审批进度' },
        ];
        return <Dropdown trigger={['click']} menu={{ items, onClick: ({ key }) => onDetailAction(record, key) }}>
          <Button className="pc-row-action-button" type="link" size="small">更多 <ChevronDown size={14} /></Button>
        </Dropdown>;
      },
    },
  ];

  return (
    <div className="pc-page-stack">
      <QueryBar onQuery={onSearch} onReset={onReset}>
        <QueryItem label="供应商名称"><Input allowClear value={filters.name} placeholder="搜索供应商名称" onChange={(event) => setFilters('name', event.target.value)} onPressEnter={onSearch} /></QueryItem>
        <QueryItem label="供应商类型"><Select allowClear value={filters.type || undefined} placeholder="请选择供应商类型" options={supplierTypes.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('type', value || '')} /></QueryItem>
        <QueryItem label="供应商状态"><Select allowClear value={filters.status || undefined} placeholder="请选择供应商状态" options={supplierStates.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('status', value || '')} /></QueryItem>
        <QueryItem label="邀请时间">
          <DatePicker.RangePicker
            className="pc-query-range"
            allowClear
            allowEmpty={[true, true]}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
            style={{ width: '100%' }}
            value={[filters.start, filters.end]}
            onChange={(dates) => {
              setFilters('start', dates?.[0] || null);
              setFilters('end', dates?.[1] || null);
            }}
          />
        </QueryItem>
        <QueryItem label="供应商推荐"><Select allowClear showSearch optionFilterProp="label" value={filters.recommended || undefined} placeholder="请选择供应商推荐" options={supplierIndustries.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('recommended', value || '')} /></QueryItem>
        <QueryItem label="邀请人"><Input allowClear value={filters.inviter} placeholder="请输入邀请人" onChange={(event) => setFilters('inviter', event.target.value)} onPressEnter={onSearch} /></QueryItem>
        <QueryItem label="证件号码"><Input allowClear value={filters.certificate} placeholder="请输入证件号码" onChange={(event) => setFilters('certificate', event.target.value)} onPressEnter={onSearch} /></QueryItem>
      </QueryBar>

      <QueryResults className="pc-list-card" total={rows.length} conditions={appliedConditions} onClear={onReset} actions={<>
        <Button icon={<Download size={15} />} onClick={onExport}>导出</Button>
        <Button onClick={onRegister}>代注册</Button>
        <Button type="primary" icon={<UserRoundPlus size={15} />} onClick={onInvite}>邀请注册</Button>
      </>} batch={canBatchDelete && <QueryBatchBar count={selectedIds.length} onCancel={() => setSelectedIds([])}>
        <Button danger icon={<Trash2 size={15} />} onClick={() => onDelete(selectedIds, false)}>删除所选</Button>
      </QueryBatchBar>}>
        <PcTable
          rowKey="id"
          className="pc-table"
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          rowSelection={canBatchDelete ? {
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys),
            getCheckboxProps: (record) => ({ disabled: !canDeleteSupplier(record, false) }),
            columnWidth: 48,
          } : undefined}
          pagination={{ current: pagination?.current || 1, pageSize: pagination?.pageSize || 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], position: ['bottomRight'] }}
          scroll={{ x: 'max-content' }}
          filtered={appliedConditions.length > 0}
          onChange={(next, _filters, _sorter, extra) => { if (extra.action === 'paginate') { onPagination(next); setSelectedIds([]); } }}
        />
      </QueryResults>
    </div>
  );
}

function MyInvitationsPage({ pagination, onPagination, onEditDraft, filters, appliedFilters, setFilters, onSearch, onReset, rows, selectedIds, setSelectedIds, onOpenDetail, onChangeInviter, onReinvite, onModifyProfile, onOpenMaintenance, onInvite, onRegister, onDelete, onExport }) {
  const { name, status, type, registrationNumber, start, end } = appliedFilters;
  const appliedConditions = [
    ['供应商名称', name.trim()], ['供应商状态', status], ['供应商类型', type],
    ['注册编号', registrationNumber.trim()], ['邀请时间', invitationDateRange(start, end)],
  ].filter(([, value]) => value);
  const columns = [
    { title: '供应商名称', dataIndex: 'name', width: 230, render: (name, record) => <Tooltip title={name}><button className="pc-link pc-name-link" onClick={() => onOpenDetail(record, 'invitations')}>{name || '未填写供应商名称'}</button></Tooltip> },
    { title: '证件号码', dataIndex: 'code', width: 180, render: (_, record) => displayCertificateNumber(record) || '—' },
    { title: '供应商类型', dataIndex: 'type', width: 130 },
    { title: '联系人姓名', dataIndex: 'contact', width: 120, render: (value) => value || '-' },
    { title: '联系人邮箱', dataIndex: 'email', width: 200, render: (value) => value || '-' },
    { title: '联系人电话', dataIndex: 'phone', width: 150, render: (value) => value || '-' },
    { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
    { title: '邀请时间', dataIndex: 'date', width: 180, align: 'center' },
    { title: '更新时间', dataIndex: 'updated', width: 180, align: 'center' },
    {
      title: '操作', key: 'actions', width: 150, fixed: 'right', align: 'right',
      render: (_, record) => {
        const actions = supplierListActions(record, { mine: true, inviter: CURRENT_USER });
        const primary = actions.editDraft ? <Button className="pc-row-action-button" type="link" size="small" onClick={() => onEditDraft(record)}>修改草稿</Button>
          : actions.editAll ? <Button className="pc-row-action-button" type="link" size="small" onClick={() => onModifyProfile(record)}>修改全部信息</Button>
          : null;
        const items = [
          ...(actions.inviter ? [{ key: 'inviter', label: '变更邀请人' }] : []),
          ...(actions.bank ? [{ key: 'banks', label: '修改银行' }] : []),
          ...(actions.permissions ? [{ key: 'permissions', label: '分配权限' }] : []),
          ...(actions.reinvite ? [{ key: 'reinvite', label: '重新邀请' }] : []),
          ...(actions.delete ? [{ key: 'delete', label: '删除', danger: true }] : []),
          ...(actions.approval ? [{ key: 'approval', label: '查看审批进度' }] : []),
        ];
        return primary || items.length ? <Space size={4} className="pc-row-actions">
          {items.length > 0 && <Dropdown trigger={['click']} menu={{ items, onClick: ({ key }) => {
            if (key === 'inviter') onChangeInviter([record.id]);
            if (key === 'reinvite') onReinvite(record);
            if (key === 'banks' || key === 'permissions') onOpenMaintenance(record, key);
            if (key === 'approval') onOpenDetail(record, 'invitations', 'approval');
            if (key === 'delete') onDelete([record.id], true);
          } }}>
            <Button className="pc-row-action-button" type="link" size="small">更多 <ChevronDown size={14} /></Button>
          </Dropdown>}{primary}
        </Space> : '-';
      },
    },
  ];

  return (
    <div className="pc-page-stack">
      <QueryBar onQuery={onSearch} onReset={onReset}>
        <QueryItem label="供应商名称"><Input allowClear value={filters.name} placeholder="请输入供应商名称" onChange={(event) => setFilters('name', event.target.value)} onPressEnter={onSearch} /></QueryItem>
        <QueryItem label="供应商状态"><Select allowClear value={filters.status || undefined} placeholder="请选择供应商状态" options={supplierStates.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('status', value || '')} /></QueryItem>
        <QueryItem label="供应商类型"><Select allowClear value={filters.type || undefined} placeholder="请选择供应商类型" options={supplierTypes.map((value) => ({ value, label: value }))} onChange={(value) => setFilters('type', value || '')} /></QueryItem>
        <QueryItem label="邀请时间">
          <DatePicker.RangePicker
            className="pc-query-range"
            allowClear
            allowEmpty={[true, true]}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
            style={{ width: '100%' }}
            value={[filters.start, filters.end]}
            onChange={(dates) => {
              setFilters('start', dates?.[0] || null);
              setFilters('end', dates?.[1] || null);
            }}
          />
        </QueryItem>
        <QueryItem label="注册编号"><Input allowClear value={filters.registrationNumber} placeholder="请输入注册编号" onChange={(event) => setFilters('registrationNumber', event.target.value)} onPressEnter={onSearch} /></QueryItem>
      </QueryBar>

      <QueryResults className="pc-list-card" total={rows.length} conditions={appliedConditions} onClear={onReset}
        actions={<>
          <Button icon={<Download size={15} />} onClick={onExport}>导出</Button>
          <Button onClick={onRegister}>代注册</Button>
          <Button type="primary" icon={<UserRoundPlus size={15} />} onClick={onInvite}>邀请注册</Button>
        </>}
        batch={<QueryBatchBar count={selectedIds.length} onCancel={() => setSelectedIds([])}>
          <Button danger onClick={() => onDelete(selectedIds, true)}>删除所选</Button>
          <Button onClick={() => onChangeInviter(selectedIds, 'invitations', true)}>邀请人批量变更</Button>
        </QueryBatchBar>}>
        <PcTable
          rowKey="id"
          className="pc-table"
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys),
            getCheckboxProps: (record) => ({ disabled: !canSelectSupplierForBatch(record, true, CURRENT_USER) }),
            columnWidth: 48,
          }}
          pagination={{ current: pagination?.current || 1, pageSize: pagination?.pageSize || 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], position: ['bottomRight'] }}
          scroll={{ x: 'max-content' }}
          filtered={appliedConditions.length > 0}
          onChange={(next, _filters, _sorter, extra) => { if (extra.action === 'paginate') { onPagination(next); setSelectedIds([]); } }}
        />
      </QueryResults>
    </div>
  );
}

function SupplierInformation({ supplier }) {
  const basic = supplier.basic || {};
  const fields = fieldsFor(supplier.type).filter(([key]) => key !== 'supplierName').map(([key, label, required, kind]) => ({
    label,
    value: key === 'creditCode' ? displayCertificateNumber(supplier) : key === 'industry' ? (basic[key] || supplier.industry) : basic[key],
    span: kind === 'textarea' ? 3 : kind === 'address' ? 2 : 1,
  }));
  if (basic.proof) fields.push({ label: '证照附件', value: basic.proof, span: 3 });
  return <SupplierFields fields={fields} />;
}

function RegistrationInformation({ supplier }) {
  return <div className="pc-page-stack"><SupplierFields labelWidth={128} fields={[
    { label: '供应商账号', value: supplier.supplierAccount || supplier.userCode || supplier.account },
    { label: '注册方式', value: supplier.mode },
    { label: '邀请人', value: supplier.inviter },
    { label: '邀请时间', value: supplier.date },
    { label: '更新时间', value: supplier.updated },
    { label: '供应商注册邮箱', value: profileOf(supplier).basic.registerEmail },
    { label: '曾用名', value: supplier.supplierFormerName || supplier.formerName },
  ]} />
    {!!supplier.inviterChanges?.length && <section>
      <SectionCardTitle>邀请人变更记录</SectionCardTitle>
      <PcTable rowKey="id" pagination={false} dataSource={supplier.inviterChanges} scroll={{ x: 'max-content' }} columns={[
        { title: '原邀请人', dataIndex: 'previous', width: 120 }, { title: '新邀请人', dataIndex: 'next', width: 120 },
        { title: '发起人', dataIndex: 'operator', width: 120 }, { title: '操作时间', dataIndex: 'time', width: 180, align: 'center' },
        { title: '办理结果', dataIndex: 'result', width: 120, alignmentType: 'status' },
      ]} />
    </section>}
  </div>;
}

function ContactsTab({ supplier }) {
  const contacts = supplier.contacts?.length ? supplier.contacts : (
    supplier.contact || supplier.phone || supplier.email
      ? [{ id: 'legacy-contact', name: supplier.contact, phone: supplier.phone, email: supplier.email }]
      : []
  );
  if (!contacts.length) return <EmptyContent description="暂无联系人信息" />;
  return <PcTable className="pc-table" bordered size="small" rowKey={(record) => record.id || record.name} dataSource={contacts} pagination={false} columns={[
    { title: '联系人姓名', dataIndex: 'name', width: 160 },
    { title: '联系人电话', dataIndex: 'phone', width: 180 },
    { title: '联系人邮箱', dataIndex: 'email', width: 240 },
    { title: '部门', dataIndex: 'department', width: 220 },
    { title: '职位', dataIndex: 'job', width: 180 },
    { title: '微信', dataIndex: 'wechat', width: 160 },
    { title: '备注', dataIndex: 'note', width: 220 },
  ]} scroll={{ x: 'max-content' }} />;
}

function BankInformation({ supplier, entries, onAdd, onEdit, onDelete, onOpen, pendingCount = 0, pendingApproval, showProof = true }) {
  const original = supplier.banks || [];
  const canEdit = !!onAdd && canChangeSupplier(supplier);
  const counts = bankChangeCounts(original, entries);
  const comparison = entries.flatMap((entry) => {
    const { action, fields } = bankChange(original, entry);
    return action === '修改' ? fields.map((field) => ({ ...field, key: entry.id + ':' + field.key, account: entry.bank + ' · 尾号 ' + String(entry.number).slice(-4) })) : [];
  });
  const columns = [
    { title: '账户类型', dataIndex: 'accountType', width: 100 },
    { title: '开户银行', dataIndex: 'bank', width: 180 },
    { title: '银行分行', dataIndex: 'branch', width: 200 },
    { title: '开户行所在国家/地区', dataIndex: 'country', width: 150 },
    { title: '开户所在省/市', width: 140, render: (_, record) => [record.province, record.city].filter(Boolean).join(' / ') || '-' },
    { title: '账户名称', dataIndex: 'name', width: 170 },
    { title: '银行账号', dataIndex: 'number', width: 190 },
    { title: '币种', dataIndex: 'currency', width: 90 },
    ...(showProof ? [{ title: '开户证明', dataIndex: 'proof', width: 170, render: (value) => <BankProof value={value} /> }] : []),
    { title: '备注', dataIndex: 'note', width: 180 },
    ...(canEdit ? [{
      title: '变更状态', key: 'change', width: 130, align: 'center',
      render: (_, record) => {
        const action = bankChange(original, record).action;
        const labels = { 新增: '待提交新增', 修改: '待提交修改', 删除: '待提交删除' };
        return action ? <Tag bordered={false} className={'pc-change-tag pc-change-' + action}>{labels[action]}</Tag> : '-';
      },
    },
    {
      title: '操作', key: 'actions', width: 140, fixed: 'right', align: 'right',
      render: (_, record) => {
        const action = bankChange(original, record).action;
        if (!canEdit || action === '删除') return '-';
        return <Space size={8}><Button type="link" danger size="small" onClick={() => onDelete(record)}>删除</Button><Button type="link" size="small" onClick={() => onEdit(record)}>修改</Button></Space>;
      },
    }] : []),
  ];

  return (
    <div className="pc-bank-tab">
      <div className="pc-bank-summary">
        <div className="pc-bank-summary-copy">
          <SectionCardTitle>银行信息</SectionCardTitle>
          {pendingCount > 0 && <span className="pc-bank-pending">有 <b>{pendingCount}</b> 条银行变更待提交审批（新增 {counts.新增}、修改 {counts.修改}、删除 {counts.删除}）</span>}
          {pendingApproval && <span className="pc-muted">银行信息变更已提交审批</span>}
        </div>
        {canEdit && <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>添加银行</Button>}
        {onOpen && canChangeSupplier(supplier) && <Button onClick={onOpen}>修改银行</Button>}
      </div>
      {comparison.length > 0 && <PcTable rowKey="key" pagination={false} scroll={{ x: 'max-content' }}
        dataSource={comparison} columns={[
          { title: '账户', dataIndex: 'account', width: 220 }, { title: '字段', dataIndex: 'label', width: 150 },
          { title: '修改前', dataIndex: 'previous', width: 230 }, { title: '修改后', dataIndex: 'next', width: 230 },
        ]} />}
      {entries.length ? (
        <PcTable
          className="pc-table"
          bordered
          size="small"
          rowKey="id"
          dataSource={entries}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      ) : <EmptyContent description="暂无银行信息" />}
    </div>
  );
}

function PermissionsInformation({ supplier, onStage, onSave, onOpen, onReturn, leaveRef }) {
  const { modal } = App.useApp();
  const original = supplier.permissions || [];
  const [editor, setEditor] = useState(null);
  const editable = !!onSave && canChangeSupplier(supplier);
  const records = editable ? supplier.permissionDrafts?.[CURRENT_USER] || original : original;
  const changed = records !== original && JSON.stringify(records) !== JSON.stringify(original);
  const leave = (action) => changed ? modal.confirm({
    centered: true, className: 'pc-confirm', title: '权限变更尚未提交',
    content: '已保存内容将保留，可稍后继续处理。',
    okText: '确认离开', cancelText: '继续处理', onOk: action,
  }) : action();
  React.useImperativeHandle(leaveRef, () => ({ leave }));
  const columns = [
    { title: '所属权限', dataIndex: 'group', width: 220 },
    { title: '权限分类', dataIndex: 'category', width: 240 },
    { title: '备注', dataIndex: 'note' },
    ...(changed ? [{ title: '变更状态', dataIndex: 'change', width: 120, align: 'center', render: (value) => value ? <Tag className={'pc-change-tag pc-change-' + value}>待提交{value}</Tag> : '—' }] : []),
  ];
  if (editable) columns.push({ title: '操作', key: 'action', width: 100, align: 'right', render: (_, row) => row.change === '删除' ? '—' : <Space size={4}>
    <Button type="link" size="small" danger onClick={() => modal.confirm({
      centered: true, className: 'pc-confirm', title: '删除权限', content: row.group + ' / ' + row.category,
      okText: '删除', cancelText: '取消', okButtonProps: { danger: true },
      onOk: () => onStage(records.flatMap((item) => item.id !== row.id ? [item] : original.some((entry) => entry.id === row.id) ? [{ ...item, change: '删除' }] : [])),
    })}>删除</Button>
    <Button type="link" size="small" onClick={() => setEditor({ row })}>修改</Button>
  </Space> });
  return <div className="pc-page-stack">
    <div className="pc-bank-summary">
      <div className="pc-bank-summary-copy"><SectionCardTitle>权限信息</SectionCardTitle></div>
      {editable && <Button type="primary" icon={<Plus size={15} />} onClick={() => setEditor({})}>添加权限</Button>}
      {onOpen && canChangeSupplier(supplier) && <Button onClick={onOpen}>分配权限</Button>}
    </div>
    <PcTable rowKey="id" dataSource={editable ? records : original} pagination={false} columns={columns} scroll={{ x: 'max-content' }} />
    {editable && <FixedActionBar className="pc-maintenance-footer">
      <Button onClick={() => leave(onReturn)}>返回</Button>
      <Button type="primary" disabled={!changed} onClick={() => onSave(records.filter((row) => row.change !== '删除').map(({ change, ...row }) => row))}>提交变更</Button>
    </FixedActionBar>}
    {editor && <PermissionModal initial={editor.row} existing={records.filter((row) => row.change !== '删除')} onCancel={() => setEditor(null)} onSave={(row) => {
      const before = original.find((item) => item.id === row.id);
      const change = !before ? '新增' : ['group', 'category', 'note'].some((key) => (before[key] || '') !== (row[key] || '')) ? '修改' : '';
      const next = change ? { ...row, change } : before;
      if (onStage(editor.row ? records.map((item) => item.id === row.id ? next : item) : [...records, next])) setEditor(null);
    }} />}
  </div>;
}

function FinanceOUTab({ supplier }) {
  const records = supplier.financeOus || [];
  if (!records.length) return <EmptyContent description="暂无财务OU信息" />;
  return <PcTable className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} scroll={{ x: 'max-content' }} columns={[
    { title: '财务OU名称', dataIndex: 'orgName', width: 280 },
    { title: '负债账户', dataIndex: 'liabilityAccount', width: 300 },
    { title: '预付款账户', dataIndex: 'prepayAccount', width: 300 },
    { title: '地址', dataIndex: 'address', width: 220 },
  ]} />;
}

function BlacklistTab({ supplier }) {
  const records = supplier.blacklistRecords || [];
  if (!records.length) return <EmptyContent description="暂无黑名单操作记录" />;
  return <PcTable className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} scroll={{ x: 'max-content' }} columns={[
    { title: '操作状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
    { title: '拉黑操作人', dataIndex: 'applyUser', width: 170 },
    { title: '拉黑操作时间', dataIndex: 'applyTime', width: 180, align: 'center' },
    { title: '拉黑原因', dataIndex: 'applyReason', width: 260 },
    { title: '移除操作人', dataIndex: 'removeUser', width: 170 },
    { title: '移除操作时间', dataIndex: 'removeTime', width: 180, align: 'center' },
    { title: '移除原因', dataIndex: 'removeReason', width: 260 },
  ]} />;
}

function ApprovalTab({ supplier, currentTask, tasks, onOpen }) {
  const history = [...tasks.map((task) => ({
    ...task, initiator: task.applicant, startedAt: task.submittedAt, nodes: supplierApprovalNodes(task),
  })), ...(supplier.approvalHistory || []).filter((record) => !tasks.some((task) => task.number === record.number))];
  const nodes = currentTask ? supplierApprovalNodes(currentTask) : supplier.approvalNodes || [];
  return (
    <div className="pc-approval-tab">
      {history.length > 0 && <div className="pc-section-block">
        <SectionCardTitle>历史审批记录</SectionCardTitle>
        <PcTable className="pc-table" bordered size="small" rowKey="number" dataSource={history} pagination={false} columns={[
          { title: '审批单号', dataIndex: 'number', width: 220, render: (number) => tasks.some((task) => task.number === number)
            ? <Button type="link" size="small" onClick={() => onOpen(number)}>{number}</Button> : number },
          { title: '审批类型', dataIndex: 'type', width: 150 },
          { title: '审批状态', dataIndex: 'status', width: 110, align: 'center', render: (value) => <StatusTag value={value} /> },
          { title: '发起人', dataIndex: 'initiator', width: 160 },
          { title: '发起时间', dataIndex: 'startedAt', width: 180, align: 'center' },
          { title: '审批节点数', width: 110, align: 'right', render: (_, record) => record.nodes?.length || 0 },
        ]} />
      </div>}
      {nodes.length > 0 && <div className="pc-section-block">
        <SectionCardTitle>当前审批进度</SectionCardTitle>
        {currentTask && <Button type="link" size="small" onClick={() => onOpen(currentTask.number)}>{currentTask.type} · {currentTask.number}</Button>}
        <PcTable className="pc-table" bordered size="small" rowKey="id" dataSource={nodes} pagination={false} columns={[
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

function CooperationTab({ supplier, ratings }) {
  const records = ratings.filter((record) => record.supplierId ? record.supplierId === supplier.id : record.name === supplier.name);
  if (!records.length) return <EmptyContent description="暂无合作信息及评分记录" />;
  return <PcTable className="pc-table" bordered size="small" rowKey="id" dataSource={records} pagination={false} scroll={{ x: 'max-content' }} columns={[
    { title: '合作类型', dataIndex: 'type', width: 150 },
    { title: '合作内容', dataIndex: 'content', width: 240 },
    { title: '业务线联系人', dataIndex: 'person', width: 150 },
    { title: '所属部门', dataIndex: 'department', width: 280 },
    { title: '合作时间', dataIndex: 'date', width: 140, align: 'center' },
    { title: '评分时间', dataIndex: 'rated', width: 180, align: 'center' },
    { title: '评价得分', dataIndex: 'score', width: 110, alignmentType: 'number' },
  ]} />;
}

function SupplierDetailPage({ supplier, ratings, onAddRating, maintenanceTask, supplierTasks, onOpenApproval, activeTab, setActiveTab, onOpenBanks, onOpenPermissions }) {
  const tabs = [
    { key: 'supplier', label: '供应商信息', children: <SupplierInformation supplier={supplier} /> },
    { key: 'contacts', label: '联系人信息', children: <ContactsTab supplier={supplier} /> },
    { key: 'banks', label: '银行信息', children: <BankInformation supplier={supplier} entries={supplier.banks || []} showProof={false} pendingApproval={maintenanceTask?.type === '银行信息变更' && maintenanceTask.status === '待审批'} onOpen={onOpenBanks} /> },
    { key: 'permissions', label: '权限信息', children: <PermissionsInformation key={supplier.id} supplier={supplier} onOpen={onOpenPermissions} /> },
    { key: 'finance', label: '财务OU', children: <FinanceOUTab supplier={supplier} /> },
    { key: 'blacklist', label: '黑名单操作记录', children: <BlacklistTab supplier={supplier} /> },
    { key: 'approval', label: '审批记录', children: <div className="pc-page-stack">
      {supplier.pendingProfile && !maintenanceTask && <Changes before={profileOf(supplier)} after={supplier.pendingProfile} />}
      <ApprovalTab supplier={supplier} currentTask={maintenanceTask} tasks={supplierTasks} onOpen={onOpenApproval} />
    </div> },
    { key: 'cooperation', label: '合作信息及评分', children: <CooperationTab supplier={supplier} ratings={ratings} /> },
  ];
  return (
    <div className="pc-page-stack">
      <Card size="small" className="pc-detail-overview">
        <div className="pc-detail-identity">
          <div className="pc-detail-identity-main">
            <h1>{supplier.name || '供应商详情'}</h1>
            <Tag bordered={false} className="pc-detail-type">{supplier.type || '未知类型'}</Tag>
          </div>
          <StatusTag value={supplier.status} />
        </div>
        <RegistrationInformation supplier={supplier} />
      </Card>
      <Card size="small" className="pc-detail-tabs-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} tabBarGutter={24} className="pc-detail-tabs"
          tabBarExtraContent={activeTab === 'cooperation' && onAddRating && canRateSupplier(supplier) &&
            <Button type="primary" icon={<Plus size={15} />} onClick={onAddRating}>新增</Button>} />
      </Card>
    </div>
  );
}

function BankProof({ value }) {
  if (!value) return '—';
  const name = attachmentName(value);
  const entry = attachmentFiles.get(value);
  return entry
    ? <a className="pc-attachment-name" href={entry.url} target="_blank" rel="noreferrer" title={name}>{name}</a>
    : <span className="pc-attachment-name" title={name}>{name}</span>;
}

function BankModal({ open, supplier, bank, onCancel, onSave }) {
  const [draft, setDraft] = useState(blankBank(supplier?.name || ''));
  const company = supplier?.type === supplierTypes[0];
  useEffect(() => {
    if (!open) return;
    setDraft(bank ? { ...bank, country: bank.country || bankDirectory.find((item) => item.name === bank.bank)?.country || '' } : { ...blankBank(supplier?.name || ''), id: newId() });
  }, [open, bank, supplier?.name]);
  const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const branchOptions = pcBranches.filter((item) => item.bank === draft.bank).map((item) => ({ value: item.name, label: item.name }));
  const selectedBranch = pcBranches.find((item) => item.name === draft.branch);
  return (
    <PcModal
      open={open}
      width={720}
      title={bank ? '编辑银行信息' : '添加银行'}
      onCancel={onCancel}
      maskClosable={false}
     
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
            const branch = pcBranches.find((item) => item.name === value);
            setDraft((current) => ({ ...current, branch: value, country: branch?.country || current.country, province: branch?.province || '', city: branch?.city || '' }));
          }} />
        </div>
        <div className="pc-bank-field"><label><em>*</em>开户行所在国家/地区</label><div className="pc-readonly-value">{draft.country || '选择开户银行后自动带出'}</div></div>
        <div className="pc-bank-field"><label>开户所在省</label><div className="pc-readonly-value">{draft.province || '-'}</div></div>
        <div className="pc-bank-field"><label>开户所在市</label><div className="pc-readonly-value">{draft.city || '-'}</div></div>
        <div className="pc-bank-field"><label><em>*</em>账户名称</label><Input value={draft.name} maxLength={100} placeholder="请输入账户名称" onChange={(event) => change('name', event.target.value)} /></div>
        <div className="pc-bank-field"><label><em>*</em>银行账号</label><Input value={draft.number} maxLength={50} placeholder="请输入银行账号" onChange={(event) => change('number', event.target.value)} /></div>
        <div className="pc-bank-field"><label><em>*</em>币种</label><Select value={draft.currency || undefined} placeholder="请选择币种" options={['人民币', '美元', '港币'].map((value) => ({ value, label: value }))} onChange={(value) => change('currency', value)} /></div>
        <div className="pc-bank-field">
          <label>{company && <em>*</em>}开户证明</label>
          <div className="pc-upload-control">
            <label className="pc-upload-button"><Plus size={15} /><span>{draft.proof ? '替换文件' : '上传文件'}</span><input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) change('proof', rememberAttachment(file).key); }} /></label>
            {draft.proof ? <BankProof value={draft.proof} /> : <span className="pc-upload-name">未上传</span>}
          </div>
        </div>
        <div className="pc-bank-field pc-bank-field-wide"><label>备注</label><Input.TextArea value={draft.note} maxLength={400} rows={3} placeholder="请输入备注" onChange={(event) => change('note', event.target.value)} /></div>
      </div>
      {selectedBranch && <div className="pc-form-help">已根据所选分行带出开户地区信息。</div>}
    </PcModal>
  );
}

function HelpModal({ open, onClose }) {
  return <PcModal open={open} width={560} title="操作指导" onCancel={onClose} footer={[<Button key="close" type="primary" onClick={onClose}>知道了</Button>]}>
    <div className="pc-help-content">
      <p>供应商查询支持按名称、类型、状态、推荐行业、邀请人和邀请时间筛选。</p>
      <p>点击供应商名称查看供应商信息、联系人、银行账户、权限及审批记录。</p>
      <p>银行账户单条保存后仍需在银行信息页点击【提交审批】；提交成功后供应商进入【变更中】。</p>
    </div>
  </PcModal>;
}

function SupplierAdmin() {
  const [route, setRoute] = useState(readRoute);
  // 原型角色只控制演示入口，正式授权由实际系统提供。
  const [canBatchDelete] = useState(() => new URLSearchParams(window.location.hash.split('?')[1]).get('role') !== 'employee');
  const compact = useMediaMatch(compactSidebar);
  const [sidebarPreference, setSidebarPreference] = useState(null);
  const collapsed = sidebarPreference ?? compact;
  const sidebarItems = useMemo(() => menuItems.map(({ kind, label, ...item }) => ({
    ...item, label, 'aria-label': label,
    icon: <DelayedNavIcon kind={kind} tooltip={collapsed ? label : undefined} />,
  })), [collapsed]);
  const sidebarToggleLabel = collapsed ? '展开侧栏' : '收起侧栏';
  const [openMenuKeys, setOpenMenuKeys] = useState(['management', 'approvals']);
  const toggleSidebar = () => setSidebarPreference(!collapsed);
  const [sidebarScrolled, setSidebarScrolled] = useState(false);
  const mainScrollRef = useRef(null);
  const scrollPositions = useRef({ suppliers: 0, invitations: 0 });
  const detailReturnPage = useRef('suppliers');
  const approvalReturn = useRef(null);

  const [approvalTasks, setApprovalTasks] = useState(() => {
    try {
      const saved = sessionStorage.getItem(approvalStorageKey);
      return saved ? JSON.parse(saved) : initialApprovalTasks();
    } catch {
      return initialApprovalTasks();
    }
  });
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = sessionStorage.getItem(supplierStorageKey);
      const rows = saved ? JSON.parse(saved) : clone(initialSuppliers);
      return rows.map((row) => {
        const task = row.maintenanceApproval && approvalTasks.find((item) => item.number === row.maintenanceApproval);
        return task ? resolveSupplierApproval(row, task) : row;
      });
    } catch {
      return clone(initialSuppliers);
    }
  });
  const [approvalViews, setApprovalViews] = useState({});
  const [ratings, setRatings] = useState(() => {
    try {
      const saved = sessionStorage.getItem('supplier:pc-ratings:v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // 会话不可读取时，使用现有原型样例。
    }
    return initialRatings.map((row) => ({ ...row, contract: row.status === '未评分', created: row.date + ' 18:52:32' }));
  });
  const [bankApplication, setBankApplication] = useState(null);
  const bankApplicationReturnPath = useRef('/admin/suppliers');
  const [supplierFilters, setSupplierFilters] = useState({ ...EMPTY_SUPPLIER_FILTERS });
  const [appliedSupplierFilters, setAppliedSupplierFilters] = useState({ ...EMPTY_SUPPLIER_FILTERS });
  const [invitationFilters, setInvitationFilters] = useState({ ...EMPTY_INVITATION_FILTERS });
  const [appliedInvitationFilters, setAppliedInvitationFilters] = useState({ ...EMPTY_INVITATION_FILTERS });
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [selectedInvitationIds, setSelectedInvitationIds] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState('supplier');
  const [bankDrafts, setBankDrafts] = useState(() => Object.fromEntries(suppliers.map((supplier) => [supplier.id, readBankDraftSafe(supplier.id) || clone(supplier.banks || [])])));
  const [exportSource, setExportSource] = useState(null);
  const [listPagination, setListPagination] = useState({});
  const [ratingView, setRatingView] = useState({});
  const [quickOpen, setQuickOpen] = useState(false);
  const workspaceLeave = useRef(null);

  const [inviterTargetIds, setInviterTargetIds] = useState([]);
  const latestSuppliers = useRef(suppliers);
  latestSuppliers.current = suppliers;
  const latestApprovalTasks = useRef(approvalTasks);
  latestApprovalTasks.current = approvalTasks;
  const [bankModal, setBankModal] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const { message: messageApi, modal } = App.useApp();
  const confirm = (options) => modal.confirm({ width: 400, centered: true, ...options, className: "pc-confirm" });
  const onScrollbarActivity = useScrollbarActivity();

  useEffect(() => {
    const onHashChange = () => { setBankModal(null); setRoute(readRoute()); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const titles = { banks: '修改银行', permissions: '分配权限', detail: '供应商详情', register: '代注册', 'profile-edit': '修改全部信息', invite: '邀请注册', reinvite: '重新邀请', 'change-inviter': '变更邀请人', draft: '修改草稿', rating: '供应商评分' };
    const pageTitle = titles[route.page] || menuLabels[route.page];
    document.title = pageTitle ? pageTitle + ' - 搜狐供应商管理平台' : '搜狐供应商管理平台';
    if (!mainScrollRef.current) return;
    mainScrollRef.current.scrollTop = route.id || route.from || route.bankApplicationView ? 0 : (scrollPositions.current[route.page] || 0);
  }, [route.page, route.id, route.bankApplicationView]);

  useEffect(() => {
    try {
      sessionStorage.setItem(supplierStorageKey, JSON.stringify(suppliers));
    } catch {
      messageApi.error('当前会话保存失败，请检查浏览器存储后重试。');
    }
  }, [suppliers, messageApi]);

  useEffect(() => {
    try { sessionStorage.setItem(approvalStorageKey, JSON.stringify(approvalTasks)); }
    catch { messageApi.error('审批任务会话保存失败，请检查浏览器存储后重试。'); }
  }, [approvalTasks, messageApi]);

  const currentSupplier = route.id ? suppliers.find((supplier) => supplier.id === route.id) : suppliers[0];
  const fromInvitations = route.from === 'invitations' || route.origin === 'invitations';
  const accessibleSupplier = currentSupplier && (!fromInvitations || currentSupplier.inviter === CURRENT_USER);
  const currentBankEntries = currentSupplier ? (bankDrafts[currentSupplier.id] || currentSupplier.banks || []) : [];
  const originalBanks = currentSupplier?.banks || [];
  const pendingBankCount = currentSupplier ? bankChangeCounts(originalBanks, currentBankEntries).total : 0;

  const supplierScope = useMemo(() => suppliers.filter((record) => {
    const filters = appliedSupplierFilters;
    return (!filters.name || String(record.name || '').toLowerCase().includes(filters.name.trim().toLowerCase()))
      && (!filters.type || record.type === filters.type)
      && (!filters.status || record.status === filters.status)
      && (!filters.recommended || (record.industry || record.basic?.industry) === filters.recommended)
      && (!filters.inviter || String(record.inviter || '').includes(filters.inviter.trim()))
      && (!filters.certificate?.trim() || String(certificateNumber(record)).toUpperCase().includes(filters.certificate.trim().toUpperCase()));
  }).sort(latestInvitationFirst), [suppliers, appliedSupplierFilters]);

  const invitationScope = useMemo(() => suppliers.filter((record) => {
    const filters = appliedInvitationFilters;
    return record.inviter === CURRENT_USER
      && (!filters.name || String(record.name || '').toLowerCase().includes(filters.name.trim().toLowerCase()))
      && (!filters.status || record.status === filters.status)
      && (!filters.type || record.type === filters.type)
      && (!filters.registrationNumber || String(record.documentNo || '').includes(filters.registrationNumber.trim()));
  }).sort(latestInvitationFirst), [suppliers, appliedInvitationFilters]);

  const supplierRows = supplierScope.filter((record) => isDateInRange(record.date, appliedSupplierFilters.start, appliedSupplierFilters.end))
    .map((record) => record.score == null || record.score === '' || record.score === '未评分'
      ? { ...record, score: ratings.some((rating) => rating.status === '已评分' && (rating.supplierId ? rating.supplierId === record.id : rating.name === record.name)) ? '已评分' : '未评分' }
      : record);
  const invitationRows = invitationScope.filter((record) => isDateInRange(record.date, appliedInvitationFilters.start, appliedInvitationFilters.end));

  const navigate = (path) => {
    if (!canBatchDelete && path.startsWith('/admin/')) path += (path.includes('?') ? '&' : '?') + 'role=employee';
    if (window.location.hash === '#' + path) { setRoute(readRoute()); return; }
    window.location.hash = path;
  };
  const openAction = (from, action, id) => {
    scrollPositions.current[from] = mainScrollRef.current?.scrollTop || 0;
    navigate('/admin/' + from + '/' + action + (id ? '/' + encodeURIComponent(id) : ''));
  };
  const backFromAction = () => {
    if (route.fromDetail && currentSupplier) {
      setActiveDetailTab({ banks: 'banks', permissions: 'permissions' }[route.page] || 'cooperation');
      navigate(detailPath(currentSupplier.id, route.origin));
    } else navigate('/admin/' + (route.from || 'suppliers'));
  };
  const setPagination = (key, page) => setListPagination((current) => ({ ...current, [key]: page }));
  const openMyRating = (record, readOnly) => {
    openAction('my-ratings', readOnly ? 'detail' : 'edit', record.id);
  };
  const saveRating = (row) => {
    const next = ratings.some((item) => item.id === row.id)
      ? ratings.map((item) => item.id === row.id ? row : item) : [row, ...ratings];
    try { sessionStorage.setItem('supplier:pc-ratings:v1', JSON.stringify(next)); }
    catch { messageApi.error('评分保存失败，请重试'); return false; }
    setRatings(next);
    return true;
  };
  const openDetail = (supplier, fromPage, tab = 'supplier') => {
    detailReturnPage.current = fromPage;
    if (mainScrollRef.current) scrollPositions.current[fromPage] = mainScrollRef.current.scrollTop;
    setActiveDetailTab(tab);
    navigate(detailPath(supplier.id, fromPage));
  };
  const backFromDetail = () => navigate('/admin/' + (route.page === 'profile-edit' ? 'invitations' : route.origin || detailReturnPage.current));
  const setSupplierFilter = (key, value) => setSupplierFilters((current) => ({ ...current, [key]: value }));
  const setInvitationFilter = (key, value) => setInvitationFilters((current) => ({ ...current, [key]: value }));
  const applySupplierFilters = () => { setAppliedSupplierFilters({ ...supplierFilters }); setSelectedSupplierIds([]); setPagination('suppliers', { current: 1, pageSize: listPagination.suppliers?.pageSize }); };
  const resetSupplierFilters = () => { setSupplierFilters({ ...EMPTY_SUPPLIER_FILTERS }); setAppliedSupplierFilters({ ...EMPTY_SUPPLIER_FILTERS }); setSelectedSupplierIds([]); setPagination('suppliers', { current: 1, pageSize: listPagination.suppliers?.pageSize }); };
  const applyInvitationFilters = () => { setAppliedInvitationFilters({ ...invitationFilters }); setSelectedInvitationIds([]); setPagination('invitations', { current: 1, pageSize: listPagination.invitations?.pageSize }); };
  const resetInvitationFilters = () => { setInvitationFilters({ ...EMPTY_INVITATION_FILTERS }); setAppliedInvitationFilters({ ...EMPTY_INVITATION_FILTERS }); setSelectedInvitationIds([]); setPagination('invitations', { current: 1, pageSize: listPagination.invitations?.pageSize }); };

  const persistSuppliers = (next) => {
    sessionStorage.setItem(supplierStorageKey, JSON.stringify(next));
    latestSuppliers.current = next;
    setSuppliers(next);
  };
  const handleInviteSubmit = (values) => {
    const name = values.supplierName.trim();
    const rows = latestSuppliers.current;
    const explicit = route.page === 'reinvite';
    const personal = values.supplierType === supplierTypes[1];
    const original = explicit ? rows.find((row) => row.id === route.id)
      : personal ? undefined : reinviteCandidate(rows, name, CURRENT_USER);
    const details = { name, type: values.supplierType, contact: values.contactName.trim(),
      email: values.contactEmail.trim(), phone: values.contactPhone.trim(), status: '邀请中', mode: '邀请注册' };
    const complete = (targetId) => {
      const latest = latestSuppliers.current;
      const target = targetId && latest.find((row) => row.id === targetId);
      if (targetId && (!target || target.inviter !== CURRENT_USER || !canReinviteSupplier(target) ||
        target.type !== details.type || target.name.trim() !== original.name.trim()
        || !['邀请注册', '代注册'].includes(target.mode))) {
        messageApi.warning('供应商资料或办理状态已变化，请核对后重新提交。');
        return;
      }
      if (!personal && latest.some((row) => row.id !== targetId && row.name.trim() === name)) {
        messageApi.error('供应商名称已存在');
        return;
      }
      const time = nowText();
      // 邀请注册重邀保留身份和原邀请时间，登记资料随旧邀请作废。
      const reuse = target?.mode === '邀请注册';
      const id = reuse ? target.id : newId();
      const invitation = {
        ...details, id, supplierCode: reuse ? target.supplierCode : 'MOCK-SUP-' + id,
        inviter: CURRENT_USER, inviterCode: target?.inviterCode, inviterDept: target?.inviterDept || CURRENT_DEPARTMENT,
        date: reuse ? target.date : time, updated: time, invitationNo: 'MOCK-INV-' + newId(),
        invitationExpiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        score: '未评分', code: '', banks: [], permissions: [],
      };
      const next = reuse ? latest.map((row) => row.id === targetId ? invitation : row)
        : [invitation, ...latest.filter((row) => row.id !== targetId)];
      try { persistSuppliers(next); }
      catch { messageApi.error('本次邀请记录保存失败，请重试'); return; }
      setSelectedInvitationIds([]);
      setSelectedSupplierIds([]);
      messageApi.success(reuse ? '原型邀请记录已更新' : '原型邀请记录已创建');
      navigate('/admin/invitations');
    };
    if (explicit && !original) return messageApi.warning('该供应商当前不可重新邀请');
    if (original && original.type !== details.type) return messageApi.warning('供应商类型与原记录不一致，请核对后重新提交。');
    if (!explicit && original) {
      confirm({ title: '重新邀请确认', content: '您名下存在同名且为邀请中或草稿的供应商，是否重新进行邀请。',
        okText: '重新邀请', cancelText: '取消', onOk: () => complete(original.id) });
    } else complete(original?.id);
  };
  const handleReinvite = (record, from = 'invitations') => {
    if (record.inviter === CURRENT_USER && canReinviteSupplier(record)) openAction(from, 'reinvite', record.id);
  };

  const handleDelete = (ids, mine) => {
    if (!mine && !canBatchDelete) return messageApi.warning('仅管理员可在供应商查询删除供应商');
    if (!ids.length) return messageApi.warning('请选择供应商');
    const deletionErrors = () => ids.map((id) => {
      const record = latestSuppliers.current.find((row) => row.id === id);
      if (!record) return '供应商记录已不存在';
      if (mine && record.inviter !== CURRENT_USER) return record.name + '：已移出我的邀请';
      if (record.hasCooperation) return record.name + '：已有合作记录';
      return canDeleteSupplier(record, mine) ? '' : record.name + '：当前状态不可删除';
    }).filter(Boolean);
    const errors = deletionErrors();
    if (errors.length) return messageApi.warning(errors.join('；'));
    confirm({
      title: '删除供应商',
      content: '确认删除选中的 ' + ids.length + ' 家供应商吗？删除后原有信息将作废。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const latestErrors = deletionErrors();
        if (latestErrors.length) { messageApi.warning(latestErrors.join('；')); return; }
        try { persistSuppliers(latestSuppliers.current.filter((record) => !ids.includes(record.id))); }
        catch { messageApi.error('删除结果保存失败，请重试'); return; }
        setSelectedSupplierIds([]);
        setSelectedInvitationIds([]);
        messageApi.success('已删除所选供应商');
      },
    });
  };

  const openInviter = (ids, from = 'invitations', batch = false) => {
    if (!ids.length) return messageApi.warning('请选择要变更的供应商');
    if (ids.some((id) => !latestSuppliers.current.some((record) => record.id === id
      && (from !== 'invitations' || record.inviter === CURRENT_USER)))) {
      return messageApi.warning('所选供应商已不存在或归属已变化，请重新选择');
    }
    setInviterTargetIds(batch ? ids : []);
    openAction(from, 'change-inviter', batch ? undefined : ids[0]);
  };
  const editDraft = (record, from) => {
    if (record.inviter === CURRENT_USER && record.status === '草稿') openAction(from, 'draft', record.id);
  };
  const handleSupplierAction = (record, key) => {
    if (key === 'inviter') openInviter([record.id], 'suppliers');
    else if (key === 'rate') openAction('suppliers', 'rating', record.id);
    else if (key === 'banks' || key === 'permissions') openAction('suppliers', key, record.id);
    else openDetail(record, 'suppliers', key);
  };
  const inviterIds = route.id ? [route.id] : inviterTargetIds;
  const inviterTargets = suppliers.filter((row) => inviterIds.includes(row.id) && (!fromInvitations || row.inviter === CURRENT_USER));
  const inviterError = (row, person) => {
    if (!row) return '供应商记录已不存在';
    if (route.from === 'invitations' && row.inviter !== CURRENT_USER) return row.name + '：已移出我的邀请';
    if (!canChangeSupplier(row)) return row.name + '：须为已审批且未拉黑的供应商';
    if (row.inviterCode ? row.inviterCode === person.userCode : row.inviter === person.name) return row.name + '：新邀请人与原邀请人相同';
    return '';
  };
  const checkInviters = (ids, person) => ids.map((id) => inviterError(latestSuppliers.current.find((row) => row.id === id), person)).filter(Boolean);
  const handleInviterSubmit = (ids, person) => {
    const errors = checkInviters(ids, person);
    if (errors.length) return errors;
    const updated = nowText();
    const next = latestSuppliers.current.map((row) => ids.includes(row.id) ? {
      ...row, inviter: person.name, inviterCode: person.userCode, inviterDept: person.department,
      inviterPhone: person.phone, inviterFullDept: person.department, inviterDeptPart: '', inviterDeptCode: '', updated,
      inviterChanges: [...(row.inviterChanges || []), { id: newId(), previous: row.inviter, next: person.name, operator: CURRENT_USER, time: updated, result: '已变更' }],
    } : row);
    try { persistSuppliers(next); }
    catch { return ['本次变更保存失败，请重试']; }
    setSelectedInvitationIds([]);
    setSelectedSupplierIds([]);
    messageApi.success('已更新 ' + ids.length + ' 家供应商的邀请人');
    backFromAction();
    return [];
  };
  const saveRegistrationDraft = (profile, submit) => {
    const rows = latestSuppliers.current;
    const draftId = route.id || profile.id;
    const record = draftId && rows.find((row) => row.id === draftId);
    if (draftId && (!record || record.inviter !== CURRENT_USER || record.status !== '草稿')) {
      messageApi.error('当前供应商不可继续办理草稿');
      return false;
    }
    const name = profile.basic.supplierName?.trim() || '';
    const code = profile.basic.creditCode?.trim() || '';
    if (supplierProfileConflict(rows, profile, record?.id)) {
      messageApi.error('供应商名称或证件号码已存在');
      return false;
    }
    const updated = nowText();
    const next = { inviter: CURRENT_USER, mode: '代注册', date: updated, permissions: [], score: '未评分',
      ...record, ...profile, id: record?.id || profile.id || newId(), name, code, updated,
      contact: profile.contacts[0]?.name || '', phone: profile.contacts[0]?.phone || profile.basic.mobile || '',
      email: profile.contacts[0]?.email || profile.basic.email || '', status: submit ? '审批中' : '草稿' };
    const task = submit ? makeApprovalTask('注册', next, profileOf(next)) : null;
    if (task) next.maintenanceApproval = task.number;
    const savedRows = record ? rows.map((row) => row.id === record.id ? next : row) : [next, ...rows];
    if (task) {
      if (!persistApprovalWorkflow(savedRows, [task, ...latestApprovalTasks.current])) return false;
    } else {
      try { sessionStorage.setItem(supplierStorageKey, JSON.stringify(savedRows)); }
      catch { messageApi.error('草稿保存失败，请检查浏览器存储后重试。'); return false; }
      latestSuppliers.current = savedRows;
      setSuppliers(savedRows);
    }
    messageApi.success(submit ? '草稿已提交，等待审批' : '草稿已保存');
    if (submit) navigate('/admin/invitations');
    return next;
  };

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
  const canMaintainSupplier = (record) => !!record && canChangeSupplier(record)
    && (route.from !== 'invitations' || record.inviter === CURRENT_USER);

  const handleBankSave = (draft) => {
    const latest = latestSuppliers.current.find((record) => record.id === currentSupplier?.id);
    if (!canMaintainSupplier(latest)) { messageApi.error('当前供应商状态不支持银行信息变更，请刷新资料后重试。'); return; }
    const current = currentBankEntries;
    const company = latest.type === supplierTypes[0];
    const otherBasic = company && current.some((row) => row.id !== draft.id && row.change !== '删除' && row.accountType === '基本账户');
    const account = { ...draft, number: draft.number?.replace(/\s/g, '') || '' };
    const error = bankFieldError(account, company, otherBasic)?.message;
    if (error) { messageApi.error(error); return; }
    const index = current.findIndex((entry) => entry.id === account.id);
    const next = index >= 0 ? current.map((entry) => entry.id === account.id ? account : entry) : [...current, { ...account, id: account.id || newId() }];
    if (!saveBankDraft(currentSupplier.id, normalizeBankChanges(originalBanks, next))) return;
    setBankModal(null);
    messageApi.success('账户已保存，待提交审批');
  };

  const handleBankDelete = (bank) => {
    if (!canMaintainSupplier(currentSupplier)) { messageApi.error('当前供应商不可修改银行信息。'); return; }
    if (isEffectiveBasicBankAccount(bank, originalBanks, currentSupplier.type === supplierTypes[0])) {
      messageApi.warning('企业供应商基本账户不可删除');
      return;
    }
    confirm({
      title: '删除银行账户',
      content: <><p>开户银行：{bank.bank}</p><p>账户名称：{bank.name}</p><p>账号尾号：{String(bank.number || '').slice(-4) || '—'}</p><p>{originalBanks.some((item) => item.id === bank.id) ? '确认后列为本次待提交删除。' : '确认后移除本次新增的账户。'}</p></>,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        const latest = latestSuppliers.current.find((record) => record.id === currentSupplier.id);
        if (!canMaintainSupplier(latest)) { messageApi.error('供应商状态已变化，当前不可修改银行信息。'); return; }
        const existing = latest.banks?.find((record) => record.id === bank.id);
        const next = existing ? currentBankEntries.map((record) => record.id === bank.id ? { ...record, change: '删除' } : record) : currentBankEntries.filter((record) => record.id !== bank.id);
        saveBankDraft(currentSupplier.id, normalizeBankChanges(originalBanks, next));
      },
    });
  };

  const leaveBankMaintenance = (action) => {
    if (pendingBankCount > 0) {
      confirm({
        title: '离开银行信息',
        content: '银行信息尚未提交审批，已保存内容将保留，可稍后继续处理。',
        okText: '确认离开',
        cancelText: '继续处理',
        onOk: action,
      });
    } else action();
  };
  const handleBankReturn = () => leaveBankMaintenance(backFromAction);

  const makeApprovalTask = (type, record, profile, before) => createApprovalTask({
      number: 'MOCK-SUP-' + newId().slice(3).toUpperCase(), type, applicant: CURRENT_USER,
      submittedAt: nowText(), profile, before, permissions: record.permissions, affiliation: record.department, supplierId: record.id,
  });
  const persistApprovalWorkflow = (rows, tasks) => {
    try {
      const previousRows = sessionStorage.getItem(supplierStorageKey);
      sessionStorage.setItem(supplierStorageKey, JSON.stringify(rows));
      try { sessionStorage.setItem(approvalStorageKey, JSON.stringify(tasks)); }
      catch (error) {
        if (previousRows === null) sessionStorage.removeItem(supplierStorageKey);
        else sessionStorage.setItem(supplierStorageKey, previousRows);
        throw error;
      }
    } catch {
      messageApi.error('审批资料保存失败，请检查浏览器存储后重试。');
      return false;
    }
    latestSuppliers.current = rows;
    latestApprovalTasks.current = tasks;
    setSuppliers(rows);
    setApprovalTasks(tasks);
    return true;
  };
  const submitMaintenanceApproval = (type, record, profile, before) => {
    const task = makeApprovalTask(type, record, profile, before);
    const rows = latestSuppliers.current.map((item) => item.id === record.id
      ? { ...item, maintenanceApproval: task.number, status: '变更中', updated: task.submittedAt,
          ...(type === '权限变更' ? { permissionDrafts: undefined } : {}) } : item);
    return persistApprovalWorkflow(rows, [task, ...latestApprovalTasks.current]);
  };
  const handleBankSubmit = () => {
    if (!canMaintainSupplier(currentSupplier)) { messageApi.error('当前供应商状态不支持银行信息变更，请刷新资料后重试。'); return; }
    const counts = bankChangeCounts(originalBanks, currentBankEntries);
    if (!counts.total) { messageApi.warning('请先新增、修改或删除银行账户。'); return; }
    const activeEntries = currentBankEntries.filter((entry) => bankChange(originalBanks, entry).action !== '删除').map(({ change, ...account }) => account);
    const company = currentSupplier.type === supplierTypes[0];
    const invalid = activeEntries.map((entry) => ({ entry, error: bankError(entry, company) })).find((item) => item.error);
    if (invalid) { messageApi.error((invalid.entry.name || invalid.entry.number || '银行账户') + '：' + invalid.error); return; }
    const accountError = bankAccountsError(activeEntries, company, originalBanks);
    if (accountError) { messageApi.error(accountError); return; }
    confirm({
      title: '提交银行信息变更审批',
      content: '确认提交 ' + counts.total + ' 条银行账户变更吗？提交成功后供应商状态将变为“变更中”。',
      okText: '提交审批',
      cancelText: '取消',
      onOk: () => {
        const latest = latestSuppliers.current.find((record) => record.id === currentSupplier.id);
        if (!canMaintainSupplier(latest)) { messageApi.error('供应商状态已变化，暂时无法提交银行信息变更。'); return; }
        try { writeBankDraft(currentSupplier.id, null); }
        catch { messageApi.error('待提交资料清理失败，本次未提交审批。'); return; }
        const before = profileOf(latest);
        if (!submitMaintenanceApproval('银行信息变更', latest, { ...before, banks: activeEntries }, before)) {
          saveBankDraft(currentSupplier.id, currentBankEntries);
          return;
        }
        setBankDrafts((current) => ({ ...current, [currentSupplier.id]: clone(originalBanks) }));
        messageApi.success('银行信息变更已记录');
        backFromAction();
      },
    });
  };

  const createSupplier = (profile, mode, extra = {}) => {
    const name = profile.basic.supplierName.trim();
    const code = profile.basic.creditCode?.trim() || '';
    const time = nowText();
    const record = { ...profile, ...extra, id: newId(), name, code, mode, status: mode === '代注册' ? '审批中' : '已审批',
      email: profile.contacts[0]?.email || '', contact: profile.contacts[0]?.name || '', phone: profile.contacts[0]?.phone || '',
      date: time, updated: time, inviter: CURRENT_USER, score: '未评分', permissions: extra.permissions || [] };
    setSuppliers((current) => [record, ...current]);
    messageApi.success('演示供应商记录已创建');
    return record;
  };
  const saveQuickSupplier = ({ name, type, code, address, company, department, entity, liabilityAccount, prepayAccount, permissions }) => {
    if (type !== supplierTypes[1] && suppliers.some((record) => record.name === name.trim())) return messageApi.error('已存在同名供应商');
    createSupplier({ type, basic: { supplierName: name, creditCode: code, address }, contacts: [], banks: [] }, '快速注册', {
      company, department, permissions, financeOus: entity ? [{ id: newId(), orgName: entity, liabilityAccount, prepayAccount, address }] : [],
    });
    setQuickOpen(false);
    resetSupplierFilters();
  };
  const navigateFromMenu = (key) => {
    const action = () => {
      if (key === 'quick-create') setQuickOpen(true);
      else if (key === 'bank-applications') {
        if (route.page !== 'bank-applications') bankApplicationReturnPath.current = window.location.hash.slice(1) || '/admin/suppliers';
        navigate('/admin/bank-applications');
      } else navigate(key.startsWith('/') ? key : key === 'login' ? '/login' : '/admin/' + key);
    };
    if (workspaceLeave.current) workspaceLeave.current.leave(action);
    else if (route.page === 'banks') leaveBankMaintenance(action);
    else action();
  };
  const editProfile = (record) => {
    if (record.inviter !== CURRENT_USER || !canChangeSupplier(record)) return messageApi.warning('当前供应商资料不可修改');
    detailReturnPage.current = 'invitations';
    if (mainScrollRef.current) scrollPositions.current.invitations = mainScrollRef.current.scrollTop;
    navigate('/admin/suppliers/' + encodeURIComponent(record.id) + '/edit');
  };
  const submitProfile = (profile) => {
    const latest = latestSuppliers.current.find((record) => record.id === route.id);
    if (!latest || latest.inviter !== CURRENT_USER || !canChangeSupplier(latest)) return messageApi.error('供应商状态已变化，当前不可提交变更');
    if (supplierProfileConflict(latestSuppliers.current, profile, latest.id)) return messageApi.error('供应商名称或证件号码已存在');
    if (latest.type !== supplierTypes[1] && (!profile.contacts.length
      || profile.contacts.some((contact) => !contact.name?.trim() || !contact.phone?.trim() || !validEmail(contact.email)))) {
      return messageApi.error('请至少填写一名完整的联系人，包含姓名、电话及邮箱');
    }
    const bankError = bankAccountsError(profile.banks, latest.type === supplierTypes[0], latest.banks || []);
    if (bankError) return messageApi.error(bankError);
    if (!submitMaintenanceApproval('资料变更', latest, profile, profileOf(latest))) return;
    messageApi.success('资料变更已提交，等待审批');
    backFromDetail();
  };
  const stagePermissions = (records) => {
    const rows = latestSuppliers.current;
    const latest = rows.find((row) => row.id === currentSupplier?.id);
    if (!canMaintainSupplier(latest)) { messageApi.error('供应商状态已变化，当前不可变更权限'); return false; }
    const entry = { ...latest, permissionDrafts: { ...latest.permissionDrafts, [CURRENT_USER]: records } };
    try { persistSuppliers(rows.map((row) => row.id === entry.id ? entry : row)); }
    catch { messageApi.error('权限暂存失败，请重试'); return false; }
    return true;
  };
  const savePermissions = (permissions) => {
    if (!currentSupplier) return messageApi.error('当前供应商不可变更权限');
    const latest = latestSuppliers.current.find((row) => row.id === currentSupplier.id);
    if (!canMaintainSupplier(latest)) return messageApi.error('供应商状态已变化，当前不可变更权限');
    if (JSON.stringify(latest.permissions || []) === JSON.stringify(permissions)) return messageApi.warning('请先新增、修改或删除权限');
    const before = { ...profileOf(latest), permissions: latest.permissions || [] };
    if (!submitMaintenanceApproval('权限变更', latest, { ...before, permissions }, before)) return;
    messageApi.success('权限变更已提交，等待审批');
    backFromAction();
  };
  const maintenanceTitle = { banks: '修改银行', permissions: '分配权限' }[route.page];
  const isProfileEdit = route.page === 'profile-edit';
  const isDetail = route.page === 'detail';
  const isRegister = route.page === 'register';
  const parentPage = route.from || (isProfileEdit ? 'invitations' : isDetail || route.fromDetail ? route.origin || detailReturnPage.current : isRegister ? 'suppliers' : route.page);
  const isApprovalPage = approvalPages.has(parentPage);
  const isApprovalDetail = isApprovalPage && !!route.id;
  const processed = route.page === 'approval-processed';
  const approvalTask = isApprovalDetail ? approvalTasks.find((item) => item.number === route.id && (item.status !== '待审批') === processed) : null;
  const supplierTasks = isDetail && currentSupplier ? approvalTasks.filter((task) => task.supplierId
    ? task.supplierId === currentSupplier.id : task.number === currentSupplier.maintenanceApproval) : [];
  const currentMaintenanceTask = supplierTasks.find((task) => task.number === currentSupplier?.maintenanceApproval);
  const openSupplierApproval = (number) => {
    const task = supplierTasks.find((item) => item.number === number);
    if (!task) return;
    approvalReturn.current = { number, supplierId: currentSupplier.id, origin: route.origin };
    navigate('/admin/approval-' + (task.status === '待审批' ? 'pending' : 'processed') + '/' + encodeURIComponent(number));
  };
  const backFromApproval = () => {
    const origin = approvalReturn.current;
    if (origin?.number !== route.id) return navigate('/admin/' + route.page);
    approvalReturn.current = null;
    setActiveDetailTab('approval');
    navigate(detailPath(origin.supplierId, origin.origin));
  };
  const completeApproval = (decision) => {
    const tasks = latestApprovalTasks.current;
    const task = tasks.find((item) => item.number === route.id && item.status === '待审批');
    if (!task) return messageApi.error('审批任务已变化，请返回列表核对。');
    const rows = latestSuppliers.current;
    const supplier = rows.find((record) => task.supplierId ? record.id === task.supplierId : record.maintenanceApproval === task.number);
    const completed = { ...task, ...decision, handledAt: nowText(), approver: CURRENT_USER, supplierId: task.supplierId || supplier?.id };
    const updated = supplier && resolveSupplierApproval(supplier, completed);
    if ((task.supplierId && !supplier) || (supplier && updated === supplier)) {
      return messageApi.error('供应商状态或本次审批关联已变化，请核对后重试。');
    }
    const nextRows = updated ? rows.map((record) => record.id === supplier.id ? updated : record) : rows;
    if (!persistApprovalWorkflow(nextRows, tasks.map((item) => item.number === task.number ? completed : item))) return;
    if (updated && updated.banks !== supplier.banks) {
      setBankDrafts((current) => bankChangeCounts(supplier.banks || [], current[supplier.id] || []).total ? current
        : { ...current, [supplier.id]: updated.banks || [] });
    }
    navigate('/admin/approval-processed/' + encodeURIComponent(route.id));
    messageApi.success('本次演示审批任务已办理');
  };
  const breadcrumbItems = [
    { title: isApprovalPage ? '审批任务管理' : '供应商管理' },
    { title: isDetail || isRegister || isProfileEdit || isApprovalDetail || route.fromDetail || route.from || route.page === 'my-ratings' && route.id
      ? <a href={'#/admin/' + parentPage} onClick={(event) => { event.preventDefault(); navigateFromMenu(parentPage); }}>{menuLabels[parentPage]}</a> : menuLabels[parentPage] },
  ];
  if (route.from && !isRegister) breadcrumbItems.push({ title: { invite: '邀请注册', reinvite: '重新邀请', draft: '修改草稿',
    'change-inviter': route.id ? '变更邀请人' : '批量变更邀请人', rating: '评分' }[route.page] || maintenanceTitle });
  if (route.page === 'my-ratings' && route.id) breadcrumbItems.push({ title: route.ratingReadOnly ? '评分详情' : '填写评分' });
  if (isApprovalDetail) breadcrumbItems.push({ title: route.id });
  if (isProfileEdit) breadcrumbItems.push({ title: '修改全部信息' });
  if (isRegister) breadcrumbItems.push({ title: '代注册' });
  if (route.fromDetail) breadcrumbItems.push({ title: <a href={'#' + detailPath(route.id, route.origin)}
    onClick={(event) => { event.preventDefault();
      if (route.page === 'banks') handleBankReturn();
      else if (workspaceLeave.current) workspaceLeave.current.leave(backFromAction);
      else backFromAction(); }}>
    {currentSupplier?.name || '供应商详情'}</a> }, { title: maintenanceTitle || '新增评分' });
  if (isDetail) breadcrumbItems.push({ title: currentSupplier?.name || '供应商详情' });

  const accountMenu = {
    items: [
      { key: 'account', label: CURRENT_USER, disabled: true },
      { type: 'divider' },
      otherWorkspaceFeatures({ key: '/login', label: '协同门户登录' }),
    ],
    onClick: ({ key }) => navigateFromMenu(key),
  };

  return (
    <>
      <div className={'pc-app ' + (collapsed ? 'is-collapsed' : '')} onScrollCapture={onScrollbarActivity}>
        <div className="pc-workspace">
          <aside className={'pc-sidebar ' + (sidebarScrolled ? 'is-scrolled' : '')}>
            <a className="pc-sidebar-brand" href="#/admin/suppliers" aria-label="搜狐供应商管理平台">
              <img className="pc-sidebar-logo" src={import.meta.env.BASE_URL + 'sohu-logo.png'} alt="搜狐" />
              <span className="pc-sidebar-brand-label">供应商管理平台</span>
            </a>
            <nav id="pc-sidebar-navigation" className="pc-sidebar-nav" aria-label="后台主导航"
              onScroll={(event) => setSidebarScrolled(event.currentTarget.scrollTop > 0)}>
              <Menu tooltip={{ trigger: ['hover', 'focus'] }} mode="inline" inlineCollapsed={collapsed} items={sidebarItems}
                selectedKeys={[parentPage]} openKeys={collapsed ? undefined : openMenuKeys}
                onOpenChange={(keys) => { if (!collapsed) setOpenMenuKeys(keys); }}
                onClick={({ key }) => navigateFromMenu(key)}
              />
            </nav>
            <div className="pc-sidebar-footer">
              <Tooltip title={sidebarToggleLabel} trigger={['hover', 'focus']} placement="right">
                <button type="button" className="pc-collapse-button" onClick={toggleSidebar} aria-label={sidebarToggleLabel}
                  aria-expanded={!collapsed} aria-controls="pc-sidebar-navigation">
                  <DelayedNavIcon kind={collapsed ? 'open' : 'close'} size={18} />
                  <span className="pc-menu-label" aria-hidden={collapsed}>{sidebarToggleLabel}</span>
                </button>
              </Tooltip>
            </div>
          </aside>
          <main className="pc-main">
            <header className="pc-topbar">
              <Tooltip title={sidebarToggleLabel} trigger={['hover', 'focus']} placement="bottom">
                <button type="button" className="pc-topbar-collapse" onClick={toggleSidebar} aria-label={sidebarToggleLabel}
                  aria-expanded={!collapsed} aria-controls="pc-sidebar-navigation">
                  <DelayedNavIcon kind={collapsed ? 'open' : 'close'} size={18} />
                </button>
              </Tooltip>
              <div className="pc-topbar-context"><Breadcrumb items={breadcrumbItems} separator={<ChevronRight size={14} aria-hidden="true" />} /></div>
              <div className="pc-topbar-actions">
                <Button className="pc-help-button" type="text" icon={<CircleHelp size={16} />} onClick={() => setHelpOpen(true)}><span className="pc-help-label">操作指导</span></Button>
                <span className="pc-topbar-divider" />
                <Dropdown menu={accountMenu} trigger={['click']} placement="bottomRight">
                  <button className="pc-user-trigger" type="button" aria-label={'打开账户菜单：' + CURRENT_USER}><Avatar size={28} className="pc-avatar">{CURRENT_USER.slice(0, 1)}</Avatar><span className="pc-user-name">{CURRENT_USER}</span><ChevronDown size={14} /></button>
                </Dropdown>
              </div>
            </header>
            <div className="pc-main-scroll" ref={mainScrollRef} data-pc-scroll-region>
              <div className="pc-main-content" data-pc-scroll-content>
                {isApprovalPage ? (isApprovalDetail
                  ? <ApprovalTaskDetail key={route.id + route.page} task={approvalTask} approver={CURRENT_USER}
                    onBack={backFromApproval} onComplete={completeApproval} />
                  : <ApprovalTaskList key={route.page} tasks={approvalTasks} processed={processed}
                    view={approvalViews[route.page] || {}} setView={(view) => setApprovalViews((current) => ({ ...current, [route.page]: view }))}
                    onOpen={(number) => { approvalReturn.current = null; navigate('/admin/' + route.page + '/' + encodeURIComponent(number)); }} />
                ) : route.page === 'my-ratings' ? (
                  <MyRatingsWorkspace records={ratings} suppliers={suppliers} currentUser={CURRENT_USER} onSave={(record) => {
                    if (!saveRating(record)) return false;
                    navigate('/admin/my-ratings');
                    return true;
                  }}
                    leaveRef={workspaceLeave} view={ratingView} onViewChange={setRatingView}
                    editing={route.id ? { recordId: route.id, readOnly: route.ratingReadOnly } : null}
                    onOpen={openMyRating} onBack={() => navigate('/admin/my-ratings')} />
                ) : route.page === 'rating' ? (
                  <PcRatingEditor key={route.id} supplier={route.id && !fromInvitations ? currentSupplier : undefined} currentUser={CURRENT_USER} requireEligibleSupplier
                    onBack={backFromAction} leaveRef={workspaceLeave} onSave={(record) => {
                      const latest = latestSuppliers.current.find((row) => row.id === route.id);
                      if (!latest || fromInvitations || !canRateSupplier(latest)) { messageApi.error('当前供应商状态不支持评分'); return false; }
                      if (!saveRating(record)) return false;
                      backFromAction();
                      return true;
                    }} />
                ) : route.page === 'change-inviter' ? (
                  <InviterChangePage key={route.from + (route.id || '')} targets={inviterTargets} batch={!route.id} leaveRef={workspaceLeave}
                    onBack={backFromAction} check={checkInviters} onSubmit={handleInviterSubmit} />
                ) : route.page === 'invite' || route.page === 'reinvite' ? (
                  route.page === 'invite' || currentSupplier?.id === route.id && currentSupplier.inviter === CURRENT_USER && canReinviteSupplier(currentSupplier)
                    ? <InvitationEditor key={route.id || 'new'} record={route.id ? currentSupplier : undefined}
                      leaveRef={workspaceLeave} onBack={route.page === 'invite' ? () => navigate('/admin/suppliers') : backFromAction} onSubmit={handleInviteSubmit} />
                    : <Card size="small"><EmptyContent description="当前供应商不可重新邀请" /><Button onClick={backFromAction}>返回</Button></Card>
                ) : route.page === 'draft' ? (
                  currentSupplier?.id === route.id && currentSupplier.inviter === CURRENT_USER && currentSupplier.status === '草稿'
                    ? <SupplierRegisterPage key={route.id} profile={profileOf(currentSupplier)} leaveRef={workspaceLeave} onBack={backFromAction}
                      onSaveDraft={(profile) => saveRegistrationDraft(profile, false)} onSubmit={(profile) => saveRegistrationDraft(profile, true)} />
                    : <Card size="small"><EmptyContent description="当前供应商草稿不可办理" /><Button onClick={backFromAction}>返回</Button></Card>
                ) : ratingPages.has(route.page) ? (
                  <RatingPage key={route.page} mode={route.page} records={ratings} suppliers={suppliers} currentUser={CURRENT_USER}
                    onSave={saveRating} exportRows={exportCsv} />
                ) : route.page === 'blacklist' ? (
                  <BlacklistPage suppliers={suppliers} onOpen={(supplier) => openDetail(supplier, 'blacklist', 'blacklist')} />
                ) : route.page === 'manual-sync' ? <ManualSyncPage />
                : route.page === 'bank-applications' ? (
                  <BankApplicationPage currentUser={CURRENT_USER} department={CURRENT_DEPARTMENT} leaveRef={workspaceLeave}
                    application={bankApplication} view={route.bankApplicationView} onSave={setBankApplication}
                    onBack={() => window.location.replace('#' + bankApplicationReturnPath.current)}
                    onViewChange={(view, options) => {
                      const path = '/admin/bank-applications' + (view === 'notice' ? '' : '/' + view);
                      if (options?.replace) window.location.replace('#' + path);
                      else navigate(path);
                    }} />
                ) : maintenanceTitle ? (
                  route.id && accessibleSupplier && canChangeSupplier(currentSupplier) ? (
                    <Card size="small" title={currentSupplier.name}>
                      {route.page === 'banks' ? <>
                        <BankInformation supplier={currentSupplier} entries={currentBankEntries} pendingCount={pendingBankCount}
                          onAdd={() => openBankModal(null)} onEdit={openBankModal} onDelete={handleBankDelete} />
                        <FixedActionBar className="pc-maintenance-footer">
                          <Button onClick={handleBankReturn}>返回</Button>
                          <Button type="primary" disabled={!pendingBankCount} onClick={handleBankSubmit}>提交审批</Button>
                        </FixedActionBar>
                      </> : <PermissionsInformation key={currentSupplier.id} supplier={currentSupplier}
                        onStage={stagePermissions} onSave={savePermissions} onReturn={backFromAction} leaveRef={workspaceLeave} />}
                    </Card>
                  ) : <Card size="small"><EmptyContent description="当前供应商不可办理此操作" /><Button onClick={backFromAction}>返回</Button></Card>
                ) : isProfileEdit ? (
                  currentSupplier && currentSupplier.inviter === CURRENT_USER && canChangeSupplier(currentSupplier)
                    ? <SupplierProfileEditor key={currentSupplier.id} leaveRef={workspaceLeave} profile={profileOf(currentSupplier)}
                      onCancel={backFromDetail} onSubmit={submitProfile} />
                    : <Card size="small"><EmptyContent description="当前供应商资料不可修改" /><Button onClick={backFromDetail}>返回</Button></Card>
                ) : route.page === 'detail' ? (accessibleSupplier ? (
                  <SupplierDetailPage
                    supplier={currentSupplier}
                    ratings={ratings}
                    onAddRating={fromInvitations ? undefined : () => navigate(detailPath(currentSupplier.id, route.origin, 'rating'))}
                    maintenanceTask={currentMaintenanceTask}
                    supplierTasks={supplierTasks.filter((task) => task.status !== '待审批')}
                    onOpenApproval={openSupplierApproval}
                    activeTab={activeDetailTab}
                    setActiveTab={setActiveDetailTab}
                    onOpenBanks={() => navigate(detailPath(currentSupplier.id, route.origin, 'banks'))}
                    onOpenPermissions={() => navigate(detailPath(currentSupplier.id, route.origin, 'permissions'))}
                  />
                ) : <Card size="small"><EmptyContent description="供应商记录不存在或已删除" /></Card>) : route.page === 'invitations' ? (
                  <MyInvitationsPage
                    filters={invitationFilters}
                    appliedFilters={appliedInvitationFilters}
                    setFilters={setInvitationFilter}
                    onSearch={applyInvitationFilters}
                    onReset={resetInvitationFilters}
                    rows={invitationRows}
                    selectedIds={selectedInvitationIds}
                    setSelectedIds={setSelectedInvitationIds}
                    onOpenDetail={openDetail}
                    onChangeInviter={openInviter}
                    onEditDraft={(record) => editDraft(record, 'invitations')}
                    pagination={listPagination.invitations} onPagination={(page) => setPagination('invitations', page)}
                    onReinvite={handleReinvite}
                    onModifyProfile={editProfile}
                    onOpenMaintenance={(record, action) => openAction('invitations', action, record.id)}
                    onInvite={() => openAction('invitations', 'invite')}
                    onRegister={() => openAction('invitations', 'register')}
                    onDelete={handleDelete}
                    onExport={() => setExportSource('invitations')}
                  />
                ) : (
                  <>
                    <div hidden={isRegister}>
                      <SupplierQueryPage
                        filters={supplierFilters}
                        appliedFilters={appliedSupplierFilters}
                        setFilters={setSupplierFilter}
                        onSearch={applySupplierFilters}
                        onReset={resetSupplierFilters}
                        rows={supplierRows}
                        selectedIds={selectedSupplierIds}
                        setSelectedIds={setSelectedSupplierIds}
                        onInvite={() => openAction('suppliers', 'invite')}
                        pagination={listPagination.suppliers} onPagination={(page) => setPagination('suppliers', page)}
                        canBatchDelete={canBatchDelete}
                        onRegister={() => {
                          scrollPositions.current.suppliers = mainScrollRef.current?.scrollTop || 0;
                          navigate('/admin/register');
                        }}
                        onDelete={handleDelete}
                        onExport={() => setExportSource('suppliers')}
                        onOpenDetail={openDetail}
                        onDetailAction={handleSupplierAction}
                      />
                    </div>
                    {isRegister && <SupplierRegisterPage key={route.type || route.from} initialType={route.type} onSaveDraft={(profile) => saveRegistrationDraft(profile, false)} leaveRef={workspaceLeave} onBack={backFromAction} onSubmit={(profile) => saveRegistrationDraft(profile, true)} />}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      {quickOpen && <QuickSupplierModal onCancel={() => setQuickOpen(false)} onSave={saveQuickSupplier} />}
      {exportSource && <SupplierExportModal open mine={exportSource === 'invitations'}
        initial={exportSource === 'invitations' ? appliedInvitationFilters : appliedSupplierFilters}
        suppliers={exportSource === 'invitations' ? invitationScope : supplierScope} onClose={() => setExportSource(null)} />}
      <BankModal open={route.page === 'banks' && !!bankModal} supplier={currentSupplier} bank={bankModal?.bank} onCancel={() => setBankModal(null)} onSave={handleBankSave} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export function PcAdminApp() {
  return (
    <ConfigProvider locale={zhCN} theme={erpTheme}>
      <App><SupplierAdmin /></App>
    </ConfigProvider>
  );
}
