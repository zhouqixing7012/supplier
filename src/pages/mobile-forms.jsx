import { usePanelState } from './mobile-motion.jsx';
import { Actions, AttachmentLink, PickerHeading, ReferencePicker, CardActions, RecordCard, RecordCollection, Confirm, DateSheet, FullscreenPanel, OptionSheet, Overlay, Row, Section, UploadField } from '../components/mobile/index.js';
import React, { useEffect, useRef, useState } from 'react';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { ChangeTag, Field } from './mobile-ui.jsx';
import { bankNames, bankDirectory, branches, people, permissionGroups, supplierTypes, supplierIndustries } from './mobile-data.js';
import { createSessionId, useDirtyForm, useBackLayer, attachmentFiles, attachmentName } from './mobile-interaction.jsx';

import { recognizeCompanyLicense } from './mobile-document-recognition.js';
import { withAccountBank, restoreBankDirectoryFields, personalCertificateTypes, personalCertificatePhotoFields } from './mobile-edit-rules.js';

export const blankBank = name => ({ accountType: '', bank: '', branch: '', country: '', province: '', city: '', name: name || '', number: '', currency: '', proof: '', note: '' });
export function bankError(bank, company = true) {
  for (const [key, label] of [['bank', '开户银行'], ['branch', '银行分行'], ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种']]) if (!bank[key]?.trim()) return `请填写${label}`;
  if (!bank.country?.trim()) return '请选择开户银行以带出开户行所在国家/地区';
  if (!bank.province?.trim() || !bank.city?.trim()) return '请选择银行分行以带出开户所在省和市；缺少目录资料时请联系业务对接人';
  if (company && !bank.accountType) return '请选择账户类型';
  if (company && !bank.proof) return '请上传开户证明';
  return '';
}

export function BankFields({ bank, setBank, company = true, proofRequired = company, onCancel }) {
  const [picker, setPicker] = useState(null);
  const guard = useDirtyForm(bank);
  useEffect(() => {
    const restored = restoreBankDirectoryFields(bank, bankDirectory, branches);
    if (restored !== bank) setBank(restored);
  }, [bank, setBank]);
  useEffect(() => {
    if (!onCancel) return;
    const close = () => guard.leave(onCancel);
    window.addEventListener('mobile-close-register-bank', close);
    return () => window.removeEventListener('mobile-close-register-bank', close);
  });
  const change = (key, value) => setBank({ ...bank, [key]: value });
  return <div className="m-bank-fields"><Section title="开户银行信息">
    {company && <Field label="账户类型" required options={['基本账户', '一般账户']} value={bank.accountType} onChange={v => change('accountType', v)} />}
    <Field label="开户银行" required value={bank.bank} help="开户银行来自银行基础数据，未查询到时请联系业务对接人。" onPick={() => setPicker('bank')} />
    <Field label="银行分行" required value={bank.branch} help="选择开户银行后选择对应分行。" onPick={() => bank.bank ? setPicker('branch') : window.dispatchEvent(new CustomEvent('mobile-validation', { detail: '请先选择开户银行' }))} />
    <Field label="开户行所在国家/地区" required value={bank.country} readOnly />
    <Field label="开户所在省" required value={bank.province} readOnly /><Field label="开户所在市" required value={bank.city} readOnly />
    </Section><Section title="账户信息"><Field label="账户名称" required value={bank.name} onChange={v => change('name', v)} maxLength={100} />
    <Field label="银行账号" required value={bank.number} onChange={v => change('number', v)} maxLength={50} />
    <Field label="币种" required options={['人民币', '美元', '港币']} value={bank.currency} onChange={v => change('currency', v)} />
    </Section><Section title="证明及备注"><UploadField label="开户证明" required={proofRequired} value={bank.proof} onChange={proof => change('proof', proof)} help="上传银行开户证明。" />
    <Field label="备注" multiline value={bank.note} onChange={v => change('note', v)} maxLength={400} />
    </Section>{picker && <Overlay label={picker === 'bank' ? '开户银行' : '银行分行'} onClose={() => setPicker(null)} sheet><PickerHeading title={picker === 'bank' ? '开户银行' : '银行分行'} /><ReferenceList kind={picker} selected={picker === 'bank' ? bank.bank : bank.branch} bank={bank.bank} onCancel={() => setPicker(null)} onConfirm={v => { if (picker === 'bank') setBank(withAccountBank(bank, v, bankDirectory)); else { const branch = branches.find(x => x.bank === bank.bank && x.name === v); setBank({ ...bank, branch: v, country: branch?.country || bankDirectory.find(entry => entry.name === bank.bank)?.country || '', province: branch?.province || '', city: branch?.city || '' }); } setPicker(null); }} /></Overlay>}
  </div>;
}

export function ReferenceList({ kind, bank = bankNames[0], ...props }) {
  const isPeople = kind === 'people';
  const isBranch = kind === 'branch';
  const entries = isPeople
    ? (props.includeCurrent ? [...people, { name: '陈才慧', userCode: 'MOCK-CURRENT', department: '演示 ERP 部门' }] : people).map(person => ({
      name: person.name, code: person.userCode || '—', searchFields: [person.name, person.userCode, person.phone],
      rows: [['座机', person.phone], ['邮箱', person.email], ['职位', person.job], ['部门', person.department]],
    }))
    : isBranch
      ? branches.filter(entry => entry.bank === bank).map(entry => ({
        name: entry.name,
        rows: [['银行名称', entry.bank], ['国家（地区）代码', bankDirectory.find(item => item.name === entry.bank)?.countryCode], ['国家（地区）', entry.country], ['省份', entry.province], ['城市', entry.city]],
      }))
      : bankDirectory.map(entry => ({
        name: entry.name, rows: [['国家（地区）代码', entry.countryCode], ['国家（地区）', entry.country]],
      }));
  return <ReferencePicker {...props} entries={entries} radioName={'reference-' + kind}
    searchLabel={isPeople ? '搜索姓名或工号' : '搜索银行或分行名称'}
    searchPrompt={isPeople ? '请输入姓名搜索人员' : undefined}
    emptyText={isBranch ? '当前银行没有可用分行，请核对银行或联系业务对接人申请补充 EBS 银行目录' : undefined}
    noMatchText={isPeople ? undefined : '未找到匹配银行或分行，请核对关键词；目录缺失请联系业务对接人申请补充 EBS 银行目录'} />;
}

export function BankCard({ bank, onEdit, onDelete, onPreview, deleteDisabledReason = '', fileProof = false, changeLabel }) {
  const [blockedDelete, setBlockedDelete] = useState(false);
  return <><article data-motion-key={"bank-" + bank.id} className="m-bank-card" data-change={bank.change || undefined}><div className="m-record-heading"><h3>{bank.accountType || '银行账户'} · {bank.bank || '未选择银行'}{bank.number ? ' · 尾号' + bank.number.slice(-4) : ''}</h3><ChangeTag value={changeLabel ?? bank.change} /></div><div className="m-card-body">
    {bank.accountType && <Row label="账户类型" compact>{bank.accountType}</Row>}<Row label="开户银行" compact>{bank.bank}</Row><Row label="银行分行" compact>{bank.branch}</Row><Row label="开户行所在国家/地区" compact>{bank.country}</Row><Row label="开户所在省" compact>{bank.province}</Row><Row label="开户所在市" compact>{bank.city}</Row><Row label="账户名称" compact>{bank.name}</Row><Row label="银行账号" compact>{bank.number}</Row><Row label="币种" compact>{bank.currency}</Row><Row label="开户证明" compact>{bank.proof ? <AttachmentLink value={bank.proof} onPreview={onPreview} /> : '—'}</Row><Row label="备注" compact>{bank.note}</Row>
    {(onEdit || onDelete) && <CardActions>{onEdit && <button onClick={onEdit}>修改</button>}{(onDelete || (onEdit && deleteDisabledReason)) && <button className="m-action-danger" onClick={() => deleteDisabledReason ? setBlockedDelete(true) : onDelete?.()}>删除</button>}</CardActions>}
  </div></article>{blockedDelete && <Overlay label="银行删除校验" onClose={() => setBlockedDelete(false)}><h2>无法删除</h2><p>{deleteDisabledReason}</p><div className="m-dialog-actions"><button type="button" onClick={() => setBlockedDelete(false)}>知道了</button></div></Overlay>}</>;
}

export function PermissionForm({ initial = {}, onSave, onCancel, notify }) {
  const [data, setData] = useState({ group: '', category: '', note: '', ...initial });
  const guard = useDirtyForm(data);
  useEffect(() => { const close = () => guard.leave(onCancel); window.addEventListener('mobile-close-permission', close); return () => window.removeEventListener('mobile-close-permission', close); });
  return <><Field label="所属权限" searchable required options={Object.keys(permissionGroups)} value={data.group} onChange={group => setData({ ...data, group, category: '' })} /><Field label="权限分类" searchable={data.group === '媒体权限'} required options={permissionGroups[data.group] || []} value={data.category} onChange={category => setData({ ...data, category })} /><Field label="备注" multiline value={data.note} maxLength={100} onChange={note => setData({ ...data, note })} /><Actions items={[{ label: '取消', onClick: () => guard.leave(onCancel) }, { label: '保存此权限', onClick: () => data.group && data.category ? onSave(data) : notify('请选择所属权限和权限分类') }]} /></>;
}

const basicCompany = [
  ['supplierName', '供应商名称', true], ['creditCode', '统一社会信用代码', true],
  ['establishedAt', '成立日期', true, 'date'], ['licenseUntil', '证件有效期至', true, 'date'],
  ['legalRepresentative', '法人代表', true], ['companyPhone', '公司电话'],
  ['companyType', '企业类型', true, ['有限责任公司', '股份有限公司', '其他']],
  ['industry', '所属行业', true, supplierIndustries],
  ['capital', '注册资金', true], ['currency', '注册币种', true, ['人民币', '美元', '港币']],
  ['country', '国家', true, ['国内', '国外']], ['address', '注册地址', true, 'address'],
  ['invoiceAddress', '接收发票地址'], ['website', '公司网址'], ['taxpayer', '纳税人资格', false, ['一般纳税人', '小规模纳税人']],
  ['businessScope', '经营范围', true, 'textarea'], ['cooperation', '与搜狐合作事项', true, 'textarea'], ['businessAdvantage', '经营优势及业务优势', true, 'textarea'], ['remark', '备注', false, 'textarea'],
];
const personalFields = [
  ['certificateType', '证件类型', true, ['身份证', '港澳通行证', '护照']], ['supplierName', '姓名', true],
  ['gender', '性别', true, ['男', '女']], ['creditCode', '证件号码', true], ['establishedAt', '证件有效起始日期', true, 'date'], ['licenseUntil', '证件有效截止日期', true, 'date'],
  ['country', '国家', true, ['国内', '国外']], ['address', '注册地址', true, 'address'], ['email', '邮箱', true, 'email'], ['mobile', '手机', true], ['qq', 'QQ'], ['wechat', '微信'], ['cooperation', '与搜狐合作事项', true, 'textarea'], ['businessAdvantage', '经营优势及业务优势', true, 'textarea'], ['remark', '备注', false, 'textarea'],
];
const governmentFields = [['supplierName', '供应商名称', true], ['country', '国家', true, ['国内', '国外']], ['address', '注册地址', true, 'address'], ['cooperation', '与搜狐合作事项', true, 'textarea'], ['businessAdvantage', '经营优势及业务优势', true, 'textarea'], ['remark', '备注', false, 'textarea']];
const foreignFields = [['supplierName', '供应商名称', true], ['creditCode', '证件号码', true], ['establishedAt', '成立日期', true, 'date'], ['licenseUntil', '证件有效期至', true, 'date'], ['legalRepresentative', '法人代表', true], ['companyPhone', '公司电话'], ['capital', '注册资金', true], ['currency', '注册币种', true, ['人民币', '美元', '港币']], ['country', '国家', true, ['国内', '国外']], ['address', '注册地址', true], ['cooperation', '与搜狐合作事项', true, 'textarea'], ['businessAdvantage', '经营优势及业务优势', true, 'textarea'], ['remark', '备注', false, 'textarea']];
export const fieldsFor = type => type === supplierTypes[1] ? personalFields : type === supplierTypes[2] ? governmentFields : type === supplierTypes[3] ? foreignFields : basicCompany;

export const filledBasic = { registerEmail: 'supplier@example.com', type: supplierTypes[0], proof: '营业执照.jpg', supplierName: '北京初然文化传媒有限公司483920', creditCode: '73652184MACA1H2A43', establishedAt: '2023-03-07', licenseUntil: '2053-03-06', legalRepresentative: '王嵩涵', companyPhone: '010-52867111', companyType: '有限责任公司', industry: '文化、体育、娱乐业', capital: '100', currency: '人民币', country: '国内', address: '', invoiceAddress: '', website: '', taxpayer: '', businessScope: '', cooperation: '', businessAdvantage: '', remark: '' };

export function BasicFields({ data, setData, shot = false, onAddress, initialDate = false, identityReadOnly = false, hideSupplierType = false, initialPanel }) {
  const [nextType, setNextType] = useState('');
  const [picker, setPicker] = useState(initialDate ? { key: 'licenseUntil', title: '证件有效期至' } : null);
  const change = (key, value) => setData({ ...data, [key]: value });
  const basicDraft = useRef(data); basicDraft.current = data;
  const writeBasic = useRef(setData); writeBasic.current = setData;
  const pendingLicense = useRef(null);
  const [recognition, setRecognition] = useState('');
  useEffect(() => () => { pendingLicense.current = null; }, []);
  async function changeLicense(proof, file) {
    pendingLicense.current = proof;
    const original = basicDraft.current;
    writeBasic.current({ ...original, proof });
    setRecognition('');
    if (!file || original.type !== supplierTypes[0] || shot) return;
    const isCurrent = () => pendingLicense.current === proof && basicDraft.current.type === original.type;
    setRecognition('正在识别营业执照并查询企业资料…');
    try {
      const values = await recognizeCompanyLicense(file, isCurrent);
      const current = basicDraft.current;
      if (!values || !isCurrent() || current.proof !== proof) return;
      const unchanged = Object.entries(values).filter(([key]) => current[key] === original[key] && !(identityReadOnly && key === 'supplierName'));
      writeBasic.current({ ...current, ...Object.fromEntries(unchanged) });
      setRecognition('企业资料已回填，请核对并补齐。');
    } catch (error) {
      if (isCurrent()) setRecognition(error?.message || '未能回填企业资料，请手工填写。');
    }
  }
  const renderField = ([key, label, required, kind]) => {
    const isCertificateType = key === 'certificateType';
    const readOnly = identityReadOnly && key === 'supplierName';
    const options = isCertificateType ? personalCertificateTypes : Array.isArray(kind) ? kind : undefined;
    const onChange = value => {
      if (isCertificateType) {
        if (value !== data.certificateType) setData({ ...data, certificateType: value, proof: '', personalSupplierBackPicture: '' });
      } else change(key, value);
    };
    const field = <Field key={key} layout={!shot && ['supplierName', 'creditCode', 'address', 'invoiceAddress', 'website', 'email'].includes(key) ? 'stacked' : undefined} label={label} required={required && !readOnly} readOnly={readOnly} value={data[key] || ''} onChange={readOnly ? undefined : onChange} options={options} searchable={key === 'industry'} type={kind === 'date' ? 'date' : kind === 'email' ? 'email' : 'text'} multiline={kind === 'textarea'} maxLength={kind === 'textarea' ? 500 : undefined} onPick={kind === 'date' ? () => setPicker({ key, title: label }) : kind === 'address' ? onAddress : undefined} />;
    if (key === 'supplierName' && !shot) return [field, <Field key="registerEmail" layout="stacked" label="供应商注册邮箱" required type="email" value={data.registerEmail || ''} help="用于供应商登录协同门户及修改密码时接收验证码" onChange={v => change('registerEmail', v)} />];
    if (isCertificateType) return [field, ...personalCertificatePhotoFields(data.certificateType).map(([photo, name]) =>
      <UploadField key={data.certificateType + photo} label={name} required imageOnly value={data[photo]} onChange={value => change(photo, value)} />)];
    return [field];
  };
  const proof = <>{[supplierTypes[0], supplierTypes[3]].includes(data.type) && <UploadField label={data.type === supplierTypes[0] ? '营业执照' : '证书'} required value={data.proof} onChange={changeLicense} help="上传证照附件。" />}{data.type === supplierTypes[0] && recognition && <p className="m-input-note" role="status">{recognition}</p>}</>;
  return <>
    {!hideSupplierType && <Field label="供应商类型" required={!identityReadOnly} readOnly={identityReadOnly} options={identityReadOnly ? undefined : supplierTypes} value={data.type} onChange={type => { if (type === data.type) return; if (Object.entries(data).some(([key, value]) => !['type', 'supplierName', 'registerEmail'].includes(key) && value)) setNextType(type); else setData({ type, supplierName: data.supplierName || '', registerEmail: data.registerEmail || '' }); }} />}
    {proof}{fieldsFor(data.type).flatMap(renderField)}
    {data.type === supplierTypes[0] && <QualificationInfo initialEditing={initialPanel === 'qualification'} records={data.qualifications} onChange={qualifications => change('qualifications', qualifications)} />}
    {nextType && <Confirm text="切换供应商类型会清除不适用的基本信息，是否继续？" onCancel={() => setNextType('')} onConfirm={() => { setData({ type: nextType, supplierName: data.supplierName || '', registerEmail: data.registerEmail || '' }); setNextType(''); }} />}
    {picker && <DateSheet title={picker.title} value={data[picker.key]} onChange={v => change(picker.key, v)} onClose={() => setPicker(null)} allowLong={picker.key === 'licenseUntil'} />}
  </>;
}

export function ContactFields({ contacts, setContacts, initialPanel }) {
  const [editing, setEditing] = usePanelState(initialPanel === 'contact' ? -1 : null);
  const [removing, setRemoving] = useState(null);
  const [draft, setDraft] = useState(() => initialPanel === 'contact' ? { id: createSessionId() } : null);
  const guard = useDirtyForm(draft, editing !== null);
  const close = () => guard.leave(() => setEditing(null));
  useBackLayer(editing !== null, close);
  return <><RecordCollection title="联系人信息" count={contacts.length} emptyText="暂无联系人信息" addLabel="添加联系人" onAdd={() => { setDraft({ id: createSessionId(), name: '', phone: '', email: '', department: '', job: '', wechat: '', note: '' }); setEditing(-1); }}>
    {contacts.map((c, i) => <RecordCard motionKey={'contact-' + c.id} key={c.id} title={c.name || '联系人 ' + (i + 1)}><Row label="电话">{c.phone || '—'}</Row><Row label="邮箱">{c.email || '—'}</Row><CardActions><button type="button" onClick={() => { setDraft({ ...c }); setEditing(i); }}>编辑</button><button type="button" className="m-action-danger" onClick={() => setRemoving(i)}>删除</button></CardActions></RecordCard>)}
  </RecordCollection>
    {editing !== null && <FullscreenPanel className="m-record-editor" title={editing === -1 ? '新增联系人' : '编辑联系人'} onBack={close}>
      <Section title="联系人信息" collapsible={false}>{[['name', '姓名', true], ['phone', '电话', true], ['email', '邮箱', true], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label, required]) => <Field key={key} label={label} required={required} value={draft[key] || ''} type={key === 'email' ? 'email' : 'text'} multiline={key === 'note'} maxLength={['department', 'job'].includes(key) ? 50 : key === 'note' ? 400 : undefined} onChange={value => setDraft({ ...draft, [key]: value })} />)}</Section>
      <Actions items={[{ label: '取消', secondary: true, onClick: close }, { label: '保存', onClick: () => {
        const email = (draft.email || '').trim();
        const error = !(draft.name || '').trim() ? '请填写姓名' : !(draft.phone || '').trim() ? '请填写电话' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '请输入正确的邮箱格式' : '';
        if (error) return window.dispatchEvent(new CustomEvent('mobile-validation', { detail: error }));
        const contact = { ...draft, email };
        guard.accept(); setContacts(editing < 0 ? [...contacts, contact] : contacts.map((c, i) => i === editing ? contact : c)); setEditing(null);
      } }]} />
    </FullscreenPanel>}
    {removing !== null && <Confirm danger text="确认删除这位联系人？" onCancel={() => setRemoving(null)} onConfirm={() => { setContacts(contacts.filter((_, i) => i !== removing)); setRemoving(null); }} />}
  </>;
}

export function InviteForm({ initial, onSave, onCancel, notify, lockIdentity = false }) {
  const [data, setData] = useState({ type: '', name: '', contact: '', email: '', phone: '', ...initial });
  const guard = useDirtyForm(data);
  const change = (key, value) => setData({ ...data, [key]: value });
  return <><Section title="企业名称"><Field label="供应商类型" required readOnly={lockIdentity} options={lockIdentity ? undefined : supplierTypes} value={data.type} onChange={v => change('type', v)} /><p className="m-orange-copy">请选择正确的供应商类型，以免影响供应商准入、合同及付款业务</p><Field label="供应商名称" required readOnly={lockIdentity} value={data.name} onChange={v => change('name', v)} /><Field label="联系人姓名" required value={data.contact} onChange={v => change('contact', v)} /><Field label="邮箱" required type="email" value={data.email} onChange={v => change('email', v)} /><Field label="手机号" required value={data.phone} onChange={v => change('phone', v)} /><div className="m-orange-copy"><p>邀请须知：</p><p>1、邀请提交后，邀请注册地址将通过邮件发送至填写的联系人邮箱内</p><p>2、请通知供应商通过邮件内的邀请注册地址，登陆供应商协同门户注册账号</p><p>3、系统将引导供应商填写基本信息、证照、联系人、银行信息</p></div></Section><Actions items={[{ label: '取消', onClick: () => guard.leave(onCancel) }, { label: '提交', onClick: () => { for (const [key, label] of [['type', '供应商类型'], ['name', '供应商名称'], ['contact', '联系人姓名'], ['email', '邮箱'], ['phone', '手机号']]) if (!data[key].trim()) return notify('请填写' + label); const email = data.email.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return notify('请输入正确的邮箱格式'); if (!/^1\d{10}$/.test(data.phone)) return notify('请输入11位手机号'); onSave({ ...data, email }, guard.accept); } }]} /></>;
}







