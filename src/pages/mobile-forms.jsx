import { usePanelState } from './mobile-motion.jsx';
import React, { useEffect, useState } from 'react';
import { Check, FileText, ChevronRight, MoreHorizontal, Plus, Trash2, UserRoundPlus } from 'lucide-react';
import { QualificationInfo } from './mobile-qualifications.jsx';
import { Actions, ChangeTag, Confirm, DateSheet, Empty, Field, Header, OptionSheet, Overlay, Row, SearchBox, Section, UploadField } from './mobile-ui.jsx';
import { bankNames, branches, people, permissionGroups, supplierTypes, supplierIndustries } from './mobile-data.js';
import { createSessionId, useDirtyForm, useBackLayer, attachmentFiles, attachmentName } from './mobile-interaction.jsx';

export const blankBank = name => ({ accountType: '', bank: '', branch: '', country: '', province: '', city: '', name: name || '', number: '', currency: '', proof: '', note: '' });
export function bankError(bank, company = true) {
  for (const [key, label] of [['bank', '开户银行'], ['branch', '银行分行'], ['name', '账户名称'], ['number', '银行账号'], ['currency', '币种']]) if (!bank[key]?.trim()) return `请填写${label}`;
  if (company && !bank.accountType) return '请选择账户类型';
  if (company && !bank.proof) return '请上传开户证明';
  return '';
}

export function BankFields({ bank, setBank, company = true, proofRequired = company, onCancel }) {
  const [picker, setPicker] = useState(null);
  const guard = useDirtyForm(bank);
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
    {!bank.branch && <p className="m-bank-location-note">选择银行分行后，国家、省、市自动带出。</p>}<Field label="开户行所在国家/地区" value={bank.country} readOnly />
    <Field label="开户所在省" value={bank.province} readOnly /><Field label="开户所在市" value={bank.city} readOnly />
    </Section><Section title="账户信息"><Field label="账户名称" required value={bank.name} onChange={v => change('name', v)} maxLength={100} />
    <Field label="银行账号" required value={bank.number} onChange={v => change('number', v)} maxLength={50} />
    <Field label="币种" required options={['人民币', '美元', '港币']} value={bank.currency} onChange={v => change('currency', v)} />
    </Section><Section title="证明及备注"><UploadField label="开户证明" required={proofRequired} value={bank.proof} onChange={v => change('proof', v)} help="上传银行开户证明；个人供应商可不上传银行卡照片。" />
    <Field label="备注" multiline value={bank.note} onChange={v => change('note', v)} maxLength={400} />
    </Section>{picker && <Overlay label={picker === 'bank' ? '开户银行' : '银行分行'} onClose={() => setPicker(null)} sheet><div className="m-picker-title"><button onClick={() => setPicker(null)}>取消</button><strong>{picker === 'bank' ? '开户银行' : '银行分行'}</strong></div><ReferenceList kind={picker} selected={picker === 'bank' ? bank.bank : bank.branch} bank={bank.bank} onCancel={() => setPicker(null)} onConfirm={v => { if (picker === 'bank') setBank({ ...bank, bank: v, branch: '', country: '', province: '', city: '' }); else { const branch = branches.find(x => x.name === v); setBank({ ...bank, branch: v, country: branch?.country || '', province: branch?.province || '', city: branch?.city || '' }); } setPicker(null); }} /></Overlay>}
  </div>;
}

export function ReferenceList({ kind, selected = '', bank = bankNames[0], onCancel, onConfirm, initialSearch = '', mode = 'immediate' }) {
  const [query, setQuery] = useState(initialSearch);
  const [pending, setPending] = useState(selected);
  const chosen = mode === 'confirm' ? pending : selected;
  const entries = kind === 'bank' ? bankNames.map(name => ({ name, rows: [['国家（地区）代码', 'CN'], ['国家（地区）', '中国']] })) : kind === 'branch' ? branches.filter(x => x.bank === bank).map(x => ({ name: x.name, rows: [['银行名称', x.bank], ['国家（地区）代码', 'CN'], ['国家（地区）', x.country], ['省份', x.province], ['城市', x.city]] })) : query ? people.filter(x => [x.name, x.userCode, x.phone].some(v => v?.includes(query))).map(x => ({ name: x.name, searchText: [x.name, x.userCode, x.phone].join(' '), rows: [['工号', x.userCode], ['座机', x.phone], ['邮箱', x.email], ['职位', x.job], ['部门', x.department]] })) : [];
  const matches = entries.filter(x => (x.searchText || x.name).includes(query));
  return <div className={'m-reference-list' + (mode === 'confirm' ? ' m-reference-confirm' : '')}><SearchBox value={query} onChange={setQuery} placeholder={kind === 'people' ? '搜索姓名或工号' : '搜索银行或分行名称'} /><div className="m-reference-content">{matches.length ? matches.map(x => <label key={x.name} className="m-reference-card"><input type="radio" name={`reference-${kind}`} value={x.name} checked={chosen === x.name} readOnly onClick={() => mode === 'confirm' ? setPending(x.name) : onConfirm(x.name)} /><span className="m-radio">{chosen === x.name && <Check />}</span><div><h3>{x.name}</h3>{x.rows.map(([label, value]) => <Row key={label} label={label} compact>{value}</Row>)}</div></label>) : <Empty search={!!query} text={kind === 'people' && !query ? '请输入姓名搜索人员' : query ? '没有匹配结果，请调整关键词' : kind === 'branch' ? '当前银行没有可用分行，请核对银行或申请补充银行信息' : '暂无可用数据'} />}</div><Actions flat items={[{ label: '取消', muted: true, onClick: onCancel }, ...(mode === 'confirm' ? [{ label: '确认', disabled: !pending, onClick: () => onConfirm(pending) }] : [])]} /></div>;
}

export function BankCard({ bank, onEdit, onDelete, onPreview, deleteDisabledReason = '', fileProof = false }) {
  const [blockedDelete, setBlockedDelete] = useState(false);
  return <><article data-motion-key={"bank-" + bank.id} className="m-bank-card" data-change={bank.change || undefined}><div className="m-record-heading"><h3>{bank.accountType || '银行账户'} · {bank.bank || '未选择银行'}{bank.number ? ' · 尾号' + bank.number.slice(-4) : ''}</h3><ChangeTag value={bank.change} /></div><div className="m-card-body">
    {bank.accountType && <Row label="账户类型" compact>{bank.accountType}</Row>}<Row label="开户银行" compact>{bank.bank}</Row><Row label="银行分行" compact>{bank.branch}</Row><Row label="开户行所在国家/地区" compact>{bank.country}</Row><Row label="开户所在省" compact>{bank.province}</Row><Row label="开户所在市" compact>{bank.city}</Row><Row label="账户名称" compact>{bank.name}</Row><Row label="银行账号" compact>{bank.number}</Row><Row label="币种" compact>{bank.currency}</Row><Row label="开户证明" compact>{fileProof ? bank.proof ? <button className="m-bank-proof-file" aria-label="查看开户证明" onClick={onPreview}><FileText aria-hidden="true" /><span>{attachmentName(bank.proof)}</span></button> : '—' : bank.proof && <button className="m-proof-thumb" onClick={onPreview}>{bank.proof === '开户证明.png' ? <span className="m-proof-plate"><img src="/mobile-assets/bank-proof-source.jpg" alt="开户证明" /></span> : attachmentName(bank.proof)}</button>}</Row><Row label="备注" compact>{bank.note}</Row>
    {(onEdit || onDelete || deleteDisabledReason) && <div className="m-record-actions">{onEdit && <button onClick={onEdit}>修改</button>}{(onDelete || deleteDisabledReason) && <button className="m-action-danger" onClick={() => deleteDisabledReason ? setBlockedDelete(true) : onDelete?.()}>删除</button>}</div>}
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

export const filledBasic = { type: supplierTypes[0], proof: '营业执照.jpg', supplierName: '北京初然文化传媒有限公司483920', creditCode: '73652184MACA1H2A43', establishedAt: '2023-03-07', licenseUntil: '2053-03-06', legalRepresentative: '王嵩涵', companyPhone: '010-52867111', companyType: '有限责任公司', industry: '文化、体育、娱乐业', capital: '100', currency: '人民币', country: '国内', address: '', invoiceAddress: '', website: '', taxpayer: '', businessScope: '', cooperation: '', businessAdvantage: '', remark: '' };

export function BasicFields({ data, setData, shot = false, onAddress, initialDate = false, identityReadOnly = false }) {
  const [nextType, setNextType] = useState('');
  const [picker, setPicker] = useState(initialDate ? { key: 'licenseUntil', title: '证件有效期至' } : null);
  const change = (key, value) => setData({ ...data, [key]: value });
  const renderField = ([key, label, required, kind]) => {
      const field = <Field key={key} label={label} required={required && !(identityReadOnly && key === 'supplierName')} readOnly={identityReadOnly && key === 'supplierName'} value={data[key] || ''} onChange={identityReadOnly && key === 'supplierName' ? undefined : v => change(key, v)} options={Array.isArray(kind) ? kind : undefined} searchable={key === 'industry'} type={kind === 'date' ? 'date' : kind === 'email' ? 'email' : 'text'} multiline={kind === 'textarea'} maxLength={kind === 'textarea' ? 500 : undefined} onPick={kind === 'date' ? () => setPicker({ key, title: label }) : kind === 'address' ? onAddress : undefined} />;
      return key === 'supplierName' && !shot ? [field, <Field key="registerEmail" label="供应商注册邮箱" required type="email" value={data.registerEmail || ''} help="用于供应商登录协同门户及修改密码时接收验证码" onChange={v => change('registerEmail', v)} />] : [field];
  };
  const proof = <>{[supplierTypes[0], supplierTypes[3]].includes(data.type) && <UploadField label={data.type === supplierTypes[0] ? '营业执照' : '证书'} required value={data.proof} onChange={v => change('proof', v)} help="上传证照附件。" />}</>;
  return <>
    <Field label="供应商类型" required={!identityReadOnly} readOnly={identityReadOnly} options={identityReadOnly ? undefined : supplierTypes} value={data.type} onChange={type => { if (type === data.type) return; if (Object.entries(data).some(([key, value]) => !['type', 'supplierName', 'registerEmail'].includes(key) && value)) setNextType(type); else setData({ type, supplierName: data.supplierName || '', registerEmail: data.registerEmail || '' }); }} />
    {proof}{fieldsFor(data.type).flatMap(renderField)}
    <QualificationInfo records={data.qualifications} onChange={qualifications => change('qualifications', qualifications)} />
    {nextType && <Confirm text="切换供应商类型会清除不适用的基本信息，是否继续？" onCancel={() => setNextType('')} onConfirm={() => { setData({ type: nextType, supplierName: data.supplierName || '', registerEmail: data.registerEmail || '' }); setNextType(''); }} />}
    {picker && <DateSheet title={picker.title} value={data[picker.key]} onChange={v => change(picker.key, v)} onClose={() => setPicker(null)} allowLong={picker.key === 'licenseUntil'} />}
  </>;
}

export function ContactFields({ contacts, setContacts }) {
  const [editing, setEditing] = usePanelState(null);
  const [removing, setRemoving] = useState(null);
  const [draft, setDraft] = useState(null);
  const guard = useDirtyForm(draft, editing !== null);
  const close = () => guard.leave(() => setEditing(null));
  useBackLayer(editing !== null, close);
  return <Section title="联系人信息" collapsible={false} className="m-contact-section">
    {contacts.length ? contacts.map((c, i) => <article className="m-entity-card" data-motion-key={"contact-" + c.id} key={c.id}><h3>{c.name || '联系人 ' + (i + 1)}</h3><Row label="电话">{c.phone || '—'}</Row><Row label="邮箱">{c.email || '—'}</Row><div className="m-record-actions"><button type="button" onClick={() => { setDraft({ ...c }); setEditing(i); }}>编辑</button><button type="button" className="m-action-danger" onClick={() => setRemoving(i)}>删除</button></div></article>) : <Empty text="暂无联系人信息" />}
    <button type="button" className="m-dashed-add" onClick={() => { setDraft({ id: createSessionId(), name: '', phone: '', email: '', department: '', job: '', wechat: '', note: '' }); setEditing(-1); }}><UserRoundPlus aria-hidden="true" />添加联系人</button>
    {editing !== null && <div className="m-fullscreen-panel m-record-editor" role="dialog" aria-modal="true" aria-label={editing === -1 ? '新增联系人' : '编辑联系人'}>
      <Header title={editing === -1 ? '新增联系人' : '编辑联系人'} onBack={close} />
      <Section title="联系人信息" collapsible={false}>{[['name', '姓名', true], ['phone', '电话', true], ['email', '邮箱', true], ['department', '部门'], ['job', '职位'], ['wechat', '微信'], ['note', '备注']].map(([key, label, required]) => <Field key={key} label={label} required={required} value={draft[key] || ''} type={key === 'email' ? 'email' : 'text'} multiline={key === 'note'} maxLength={['department', 'job'].includes(key) ? 50 : key === 'note' ? 400 : undefined} onChange={value => setDraft({ ...draft, [key]: value })} />)}</Section>
      <Actions items={[{ label: '取消', secondary: true, onClick: close }, { label: '保存', onClick: () => {
        const error = !(draft.name || '').trim() ? '请填写姓名' : !(draft.phone || '').trim() ? '请填写电话' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? '请输入正确的邮箱格式' : '';
        if (error) return window.dispatchEvent(new CustomEvent('mobile-validation', { detail: error }));
        guard.accept(); setContacts(editing < 0 ? [...contacts, draft] : contacts.map((c, i) => i === editing ? draft : c)); setEditing(null);
      } }]} />
    </div>}
    {removing !== null && <Confirm danger text="确认删除这位联系人？" onCancel={() => setRemoving(null)} onConfirm={() => { setContacts(contacts.filter((_, i) => i !== removing)); setRemoving(null); }} />}
  </Section>;
}

export function AddressForm({ initial = '', startRegion = false, onConfirm, onCancel }) {
  const split = initial.split(' ');
  const [region, setRegion] = useState(split[0] || '');
  const [detail, setDetail] = useState(split.slice(1).join(' ') || '');
  const guard = useDirtyForm({ region, detail });
  useEffect(() => { const close = () => guard.leave(onCancel); window.addEventListener('mobile-close-address', close); return () => window.removeEventListener('mobile-close-address', close); });
  const [open, setOpen] = useState(startRegion);
  const [stage, setStage] = useState(0);
  const [regionSearch, setRegionSearch] = useState('');
  const [selected, setSelected] = useState(region.split('/'));
  const regionData = { '云南省': { '保山市': ['龙陵县'] }, '北京市': { '北京市': ['朝阳区', '海淀区'] }, '天津市': { '天津市': ['和平区'] }, '河北省': { '石家庄市': ['长安区'] } };
  const provinces = Object.keys(regionData);
  const options = stage === 0 ? provinces : stage === 1 ? Object.keys(regionData[selected[0]] || {}) : regionData[selected[0]]?.[selected[1]] || [];
  return <><Field label="选择地址" required value={region} onPick={() => { setOpen(true); setStage(0); setRegionSearch(''); }} /><Field label="详细地址" required value={detail} maxLength={50} onChange={setDetail} /><Actions flat items={[{ label: '取消', muted: true, onClick: () => guard.leave(onCancel) }, { label: '确定', disabled: !region || !detail.trim(), onClick: () => { guard.accept(); onConfirm(`${region} ${detail}`); } }]} />
    {open && <Overlay sheet label="省市区选择" onClose={() => setOpen(false)}><div className="m-region-head"><button aria-label="关闭地址选择" onClick={() => setOpen(false)}>关闭</button></div><div className="m-region-tabs">{[0, 1, 2].map(i => <button key={i} disabled={i > 0 && !selected[i - 1]} onClick={() => { setStage(i); setRegionSearch(''); }}>{selected[i] || ['省', '市', '区/县'][i]}</button>)}</div><SearchBox value={regionSearch} onChange={setRegionSearch} placeholder="搜索当前省市区" /><div className="m-sheet-options">{options.filter(x => x.includes(regionSearch.trim())).length ? options.filter(x => x.includes(regionSearch.trim())).map(x => <button key={x} className={selected[stage] === x ? 'selected' : ''} onClick={() => { const next = [...selected.slice(0, stage), x]; setSelected(next); if (stage === 2) { setRegion(next.join('/')); setOpen(false); } else { setStage(stage + 1); setRegionSearch(''); } }}>{x}{selected[stage] === x && <Check />}</button>) : <Empty text="暂无相关数据" />}</div></Overlay>}
  </>;
}

export function InviteForm({ initial, onSave, onCancel, notify }) {
  const [data, setData] = useState({ type: '', name: '', contact: '', email: '', phone: '', ...initial });
  const guard = useDirtyForm(data);
  const change = (key, value) => setData({ ...data, [key]: value });
  return <><Section title="企业名称"><Field label="供应商类型" required options={supplierTypes} value={data.type} onChange={v => change('type', v)} /><p className="m-orange-copy">请选择正确的供应商类型，以免影响供应商准入、合同及付款业务</p><Field label="供应商名称" required value={data.name} onChange={v => change('name', v)} /><Field label="联系人姓名" required value={data.contact} onChange={v => change('contact', v)} /><Field label="邮箱" required type="email" value={data.email} onChange={v => change('email', v)} /><Field label="手机号" required value={data.phone} onChange={v => change('phone', v)} /><div className="m-orange-copy"><p>邀请须知：</p><p>1、邀请提交后，邀请注册地址将通过邮件发送至填写的联系人邮箱内</p><p>2、请通知供应商通过邮件内的邀请注册地址，登陆供应商协同门户注册账号</p><p>3、系统将引导供应商填写基本信息、证照、联系人、银行信息</p></div></Section><Actions items={[{ label: '取消', onClick: () => guard.leave(onCancel) }, { label: '提交', onClick: () => { for (const [key, label] of [['type', '供应商类型'], ['name', '供应商名称'], ['contact', '联系人姓名'], ['email', '邮箱'], ['phone', '手机号']]) if (!data[key].trim()) return notify('请填写' + label); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return notify('请输入正确的邮箱格式'); if (!/^1\d{10}$/.test(data.phone)) return notify('请输入11位手机号'); onSave(data); } }]} /></>;
}







