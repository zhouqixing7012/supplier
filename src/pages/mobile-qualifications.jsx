import React, { useState } from 'react';
import { Actions, CardActions, RecordCard, RecordCollection, AttachmentLink, Confirm, Empty, FileUploadField, FullscreenPanel, Row, Section } from '../components/mobile/index.js';
import { Plus } from 'lucide-react';
import { Field } from './mobile-ui.jsx';
import { createSessionId, useBackLayer, useDirtyForm } from './mobile-interaction.jsx';
import { usePanelState } from './mobile-motion.jsx';

export const qualificationFields = [
  ['qualificationName', '资质名称'], ['qualificationLevel', '资质等级'],
  ['qualificationNo', '资质编号'], ['issuingUnit', '颁发单位'],
  ['qualificationEffectiveBeginDate', '有效开始日期', 'date'], ['qualificationEffectiveEndDate', '有效结束日期', 'date'],
];
export function QualificationInfo({ records = [], onChange, onPreview, initialEditing = false }) {
  const [editing, setEditing] = usePanelState(initialEditing ? -1 : null);
  const [draft, setDraft] = useState(() => initialEditing ? { id: createSessionId() } : null);
  const [removing, setRemoving] = useState(null);
  const guard = useDirtyForm(draft, editing !== null);
  const close = () => guard.leave(() => setEditing(null));
  useBackLayer(editing !== null, close);
  const begin = index => { setDraft(index < 0 ? { id: createSessionId() } : { ...records[index] }); setEditing(index); };
  const save = () => {
    guard.accept();
    onChange(editing < 0 ? [...records, draft] : records.map((record, i) => i === editing ? draft : record));
    setEditing(null);
  };
  return <><RecordCollection title={onChange ? '资质信息（选填）' : '资质信息'} count={records.length} emptyText="暂无资质信息" addLabel="添加资质" onAdd={onChange ? () => begin(-1) : undefined} className="m-qualification-section">
    {records.map((record, i) => <RecordCard key={record.id || i} motionKey={'qualification-' + (record.id || i)} title={record.qualificationName || '资质信息 ' + (i + 1)}>
      {qualificationFields.filter(([key]) => key !== 'qualificationName').map(([key, label]) => <Row key={key} label={label}>{record[key] || '—'}</Row>)}
      <Row label="附件">{record.qualificationCertificatePicture ? <AttachmentLink value={record.qualificationCertificatePicture} onPreview={onPreview} /> : '—'}</Row>
      {onChange && <CardActions><button type="button" onClick={() => begin(i)}>编辑</button><button type="button" className="m-action-danger" onClick={() => setRemoving(i)}>删除</button></CardActions>}
    </RecordCard>)}
  </RecordCollection>
    {editing !== null && <FullscreenPanel className="m-record-editor m-supplier-form-fields" title={editing < 0 ? '新增资质' : '编辑资质'} onBack={close}>
      <Section title="资质信息" collapsible={false}>{qualificationFields.map(([key, label, kind]) => <Field key={key} label={label} value={draft[key] || ''} type={kind === 'date' ? 'date' : 'text'} allowClearDate onChange={value => setDraft({ ...draft, [key]: value })} />)}<FileUploadField label="附件上传" value={draft.qualificationCertificatePicture} onChange={value => setDraft({ ...draft, qualificationCertificatePicture: value })} /></Section>
      <Actions items={[{ label: '取消', secondary: true, onClick: close }, { label: '保存', onClick: save }]} />
    </FullscreenPanel>}
    {removing !== null && <Confirm danger text="确认删除这条资质信息？" onCancel={() => setRemoving(null)} onConfirm={() => { onChange(records.filter((_, i) => i !== removing)); setRemoving(null); }} />}
  </>;
}

