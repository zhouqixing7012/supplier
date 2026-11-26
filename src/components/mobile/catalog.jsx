import React, { useState } from 'react';
import {
  ActionSheet, Actions, AddressForm, AppliedFilters, CardActions, Checkbox, Confirm, CountTabs, DateRange, DateSheet, Empty, Field, FileUploadField, FilterButton, FilterSummary,
  FullscreenPanel, Header, MultiAttachmentField, OptionSheet, Overlay, PickerHeading,
  RecordCard, RecordCollection, ReferencePicker, Row, SearchBox,
  Section, StatusBadge, Steps, Tabs, UploadField,
} from './index.js';
import { usePageIsolation } from '../../pages/mobile-interaction.jsx';
import { regionData } from '../../pages/registration-regions.js';
import { SupplierExamples, WorkflowExamples } from './supplier-examples.jsx';
import { BatchExamples, ProcurementExamples, RatingExamples } from './transaction-examples.jsx';
import './styles.js';
import './catalog.css';

const stages = ['基本信息', '联系人信息', '预览提交'];
const information = [
  { title: '注册信息', field: '注册方式', value: '邀请注册' },
  { title: '联系人信息', field: '联系人', value: '示例联系人' },
  { title: '银行信息', field: '账户类型', value: '基本账户' },
];
const suppliers = [
  { name: '示例办公用品供应商', type: '企业', tone: 'success', status: '已审批' },
  { name: '示例技术服务供应商', type: '企业', tone: 'info', status: '邀请中' },
  { name: '示例个人供应商', type: '个人', tone: 'neutral', status: '草稿' },
];

function NavigationExamples() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countStatus, setCountStatus] = useState('全部');

  return <>
    <Section title="页签" collapsible={false}>
      <Tabs items={information.map(item => item.title)} active={active} onChange={setActive} />
      <Row label={information[active].field}>{information[active].value}</Row>
    </Section>
    <Section title="步骤条与操作栏" collapsible={false}>
      <Steps items={stages} active={step} expanded={expanded} onExpandedChange={setExpanded} />
      {saved && <p role="status" className="m-catalog-note">已保存演示数据</p>}
    </Section>
    <Section title="数量页签" collapsible={false}>
      <CountTabs label="示例记录状态" items={[{ label: '全部', count: 3 }, { label: '未评分', count: 2 }, { label: '已评分', count: 1 }]}
        active={countStatus} onChange={setCountStatus} />
    </Section>
    <Actions items={[
      { label: '上一步', secondary: true, disabled: step === 0, onClick: () => { setStep(step - 1); setSaved(false); } },
      step === stages.length - 1
        ? { label: '保存示例', primary: true, onClick: () => setSaved(true) }
        : { label: '下一步', primary: true, onClick: () => setStep(step + 1) },
    ]} />
  </>;
}

function FieldExamples() {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [dateRange, setDateRange] = useState(['', '']);
  const [notes, setNotes] = useState('');
  const [checked, setChecked] = useState(false);

  return <>
    <Section title="表单字段">
      <Field label="供应商名称" value={name} onChange={setName} required
        error={checked && !name.trim() ? '请填写供应商名称' : undefined} />
      <Field label="供应商类型" options={['企业', '个人', '政府机构', '国外供应商']}
        value={type} onChange={setType} searchable />
      <Field label="申请日期" type="date" value={date} onChange={setDate} allowClearDate />
      <DateRange label="邀请时间" value={dateRange} onChange={setDateRange} />
      <Field label="登记方式" value="邀请注册" readOnly />
      <Field label="备注" value={notes} onChange={setNotes} multiline maxLength={100} />
    </Section>
    <Actions items={[{ label: '校验名称', onClick: () => setChecked(true) }]} />
  </>;
}

function SearchExamples() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [open, setOpen] = useState(false);
  const matches = suppliers.filter(row => (!type || row.type === type) && row.name.includes(query.trim()));

  return <>
    <SearchBox value={query} onChange={setQuery} placeholder="搜索示例供应商">
      <FilterButton active={!!type} onClick={() => setOpen(true)} />
    </SearchBox>
    <AppliedFilters count={type ? 1 : 0} onClear={() => setType('')} />
    <FilterSummary count={matches.length} />
    {matches.length > 0
      ? <RecordCollection title="搜索结果" count={matches.length} showTitle={false}>
        {matches.map(row => <RecordCard key={row.name} title={row.name}
          status={<StatusBadge tone={row.tone}>{row.status}</StatusBadge>}>
          <Row label="供应商类型">{row.type}</Row>
        </RecordCard>)}
      </RecordCollection>
      : <Empty search text="暂无匹配结果" />}
    {open && <OptionSheet title="供应商类型" options={['企业', '个人']} value={type}
      mode="confirm" onChange={setType} onClose={() => setOpen(false)} />}
  </>;
}

const samplePeople = [
  { name: '示例采购员', code: '001', searchFields: ['示例采购员', '001'], rows: [['部门', '采购部']] },
  { name: '示例业务员', code: '002', searchFields: ['示例业务员', '002'], rows: [['部门', '业务部']] },
];
const sampleBanks = [
  { name: '中国农业发展银行', rows: [['国家（地区）', '中国']] },
  { name: '中国工商银行', rows: [['国家（地区）', '中国']] },
];

function AddressAndDirectoryExamples() {
  const [address, setAddress] = useState('');
  const [person, setPerson] = useState('');
  const [bank, setBank] = useState('');
  const [open, setOpen] = useState('');
  const close = () => setOpen('');

  return <>
    <Section title="地址编辑" collapsible={false}>
      <Field label="注册地址" value={address} onPick={() => setOpen('address')} />
    </Section>
    <Section title="目录选择" collapsible={false}>
      <Field label="选择人员" value={person} onPick={() => setOpen('person')} />
      <Field label="开户银行" value={bank} onPick={() => setOpen('bank')} />
    </Section>
    {open === 'address' && <AddressForm sheet regions={regionData} initial={address}
      onCancel={close} onConfirm={value => { setAddress(value); close(); }} />}
    {open === 'person' && <FullscreenPanel title="选择人员" onBack={close}>
      <ReferencePicker entries={samplePeople} selected={person} mode="confirm"
        searchLabel="搜索姓名或工号" searchPrompt="请输入姓名搜索人员"
        onConfirm={value => { setPerson(value); close(); }} />
    </FullscreenPanel>}
    {open === 'bank' && <Overlay sheet label="开户银行" onClose={close}>
      <PickerHeading title="开户银行" />
      <ReferencePicker entries={sampleBanks} selected={bank} onCancel={close} searchLabel="搜索银行名称"
        onConfirm={value => { setBank(value); close(); }} />
    </Overlay>}
  </>;
}

function RecordExamples() {
  const [visible, setVisible] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [selected, setSelected] = useState(false);

  return <>
    <Section title="状态标签" collapsible={false}>
      <div className="m-catalog-badges">
        <StatusBadge>草稿</StatusBadge>
        <StatusBadge tone="info">邀请中</StatusBadge>
        <StatusBadge tone="success">已审批</StatusBadge>
        <StatusBadge tone="warning">审批中</StatusBadge>
        <StatusBadge tone="danger">注册驳回</StatusBadge>
      </div>
    </Section>
    <RecordCollection title="联系人" count={visible ? 1 : 0} addLabel="添加示例联系人"
      onAdd={visible ? undefined : () => setVisible(true)}>
      <RecordCard title="示例联系人" status={<StatusBadge tone="info">主要联系人</StatusBadge>}>
        <Row label="联系邮箱">contact@example.com</Row>
        <Row label="批量选择"><Checkbox label="勾选示例联系人" checked={selected} onChange={setSelected} /></Row>
        <CardActions><button type="button" className="m-action-danger" onClick={() => setRemoving(true)}>移除</button></CardActions>
      </RecordCard>
    </RecordCollection>
    {removing && <Confirm danger text="确认移除示例联系人？" confirmLabel="移除"
      onCancel={() => setRemoving(false)}
      onConfirm={() => { setRemoving(false); setVisible(false); setSelected(false); }} />}
  </>;
}

function DialogExamples() {
  const [dialog, setDialog] = useState('');
  const [expiry, setExpiry] = useState('');
  const close = () => setDialog('');

  return <>
    <Section title="弹层和确认框" collapsible={false}>
      <CardActions>
        <button type="button" onClick={() => setDialog('sheet')}>打开底部弹层</button>
        <button type="button" onClick={() => setDialog('confirm')}>打开确认框</button>
      </CardActions>
    </Section>
    <Section title="日期选择" collapsible={false}>
      <Field label="证件有效期" type="date" value={expiry} onPick={() => setDialog('date')} />
    </Section>
    {dialog === 'sheet' && <ActionSheet title="更多操作" onClose={close}>
      <button type="button" onClick={() => setDialog('confirm')}>确认操作</button>
      <button type="button" className="cancel" onClick={close}>取消</button>
    </ActionSheet>}
    {dialog === 'confirm' && <Confirm text="确认提交演示资料？" onCancel={close} onConfirm={close} />}
    {dialog === 'date' && <DateSheet title="证件有效期" value={expiry} allowLong allowClear
      onChange={setExpiry} onClose={close} />}
  </>;
}

function AttachmentExamples() {
  const [certificate, setCertificate] = useState('');
  const [image, setImage] = useState('');
  const [file, setFile] = useState('');
  const [attachments, setAttachments] = useState([]);

  return <Section title="上传与预览">
    <UploadField label="营业执照" variant="file-photo" value={certificate} onChange={setCertificate} />
    <UploadField variant="file-photo" label="开户证明" value={image} onChange={setImage} />
    <FileUploadField label="证明文件" value={file} onChange={setFile} />
    <MultiAttachmentField label="报价附件" value={attachments} onChange={setAttachments} />
    <p className="m-catalog-note">示例文件仅在本次页面会话中预览。</p>
  </Section>;
}

const groups = [
  { label: '导航', Examples: NavigationExamples },
  { label: '表单', Examples: FieldExamples },
  { label: '搜索筛选', Examples: SearchExamples },
  { label: '卡片与状态', Examples: RecordExamples },
  { label: '弹层', Examples: DialogExamples },
  { label: '附件', Examples: AttachmentExamples },
  { label: '地址与目录', Examples: AddressAndDirectoryExamples },
  { label: '供应商资料', Examples: SupplierExamples },
  { label: '审批与预览', Examples: WorkflowExamples },
  { label: '评分', Examples: RatingExamples },
  { label: '采购明细', Examples: ProcurementExamples },
  { label: '批量操作', Examples: BatchExamples },
];

export default function MobileComponentCatalog() {
  const [group, setGroup] = useState(0);
  const { Examples } = groups[group];
  usePageIsolation();

  return <main className="mobile-page m-catalog" data-scene="component-library">
    <Header title="移动端组件库" onBack={() => { window.location.hash = '#/mobile/page-map'; }} />
    <nav className="m-catalog-nav" aria-label="组件分类">
      {groups.map(({ label }, index) => <button key={label} type="button" aria-pressed={index === group}
        onClick={() => { if (index !== group) { setGroup(index); window.scrollTo(0, 0); } }}>{label}</button>)}
    </nav>
    <Examples />
  </main>;
}
