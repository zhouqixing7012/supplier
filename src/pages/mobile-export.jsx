import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Actions, Empty, Field, Header, Row, Section } from './mobile-ui.jsx';
import { useBackLayer } from './mobile-interaction.jsx';

// 只导出本次会话的演示数据；服务端下载地址接入前不生成可跨设备使用的地址。
export function SupplierExport({ suppliers, initial = {}, onClose, notify }) {
  const [dates, setDates] = useState({ start: initial.start || '', end: initial.end || '' });
  const [scope, setScope] = useState('当前结果');
  const [selected, setSelected] = useState([]);
  const [download, setDownload] = useState(null);
  const urls = useRef([]);
  const link = useRef(null);
  useEffect(() => () => urls.current.forEach(url => URL.revokeObjectURL(url)), []);
  useBackLayer(true, onClose);
  const eligible = suppliers.filter(s => (!dates.start || s.date.slice(0, 10) >= dates.start) && (!dates.end || s.date.slice(0, 10) <= dates.end));
  const rows = scope === '当前结果' ? eligible : eligible.filter(s => selected.includes(s.id));
  const changeDate = (key, value) => { setDates({ ...dates, [key]: value }); setSelected([]); setDownload(null); };
  const generate = () => {
    if (!dates.start) return notify('请选择邀请开始日期');
    if (!dates.end) return notify('请选择邀请结束日期');
    if (dates.start > dates.end) return notify('邀请开始日期不能晚于邀请结束日期');
    if (!rows.length) return notify(scope === '所选记录' ? '请选择需要导出的供应商' : '所选日期内没有可导出记录');
    const cell = value => { const text = String(value ?? ''); return '"' + (/^[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"'; };
    const content = [['供应商名称', '供应商类型', '审批状态', '邀请人', '邀请时间'], ...rows.map(s => [s.name, s.type, s.status, s.inviter, s.date])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + content.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    urls.current.push(url); setDownload({ url, count: rows.length });
  };
  return <div className="m-fullscreen-panel m-export-panel" role="dialog" aria-modal="true" aria-label="导出供应商"><Header title="导出供应商" onBack={onClose} />
    <Section title="导出条件" collapsible={false}><Field label="邀请开始日期" required type="date" value={dates.start} onChange={v => changeDate('start', v)} /><Field label="邀请结束日期" required type="date" value={dates.end} onChange={v => changeDate('end', v)} /><Field label="导出范围" value={scope} options={['当前结果', '所选记录']} onChange={v => { setScope(v); setDownload(null); }} /><Row label="匹配记录">{eligible.length} 条</Row><p className="m-input-note">保留列表当前搜索和筛选条件，邀请日期起止均为必填。</p></Section>
    {scope === '所选记录' && <Section title="选择供应商" collapsible={false}>{eligible.length ? <><label className="m-export-choice"><input type="checkbox" aria-label="全选导出记录" checked={eligible.length > 0 && eligible.every(s => selected.includes(s.id))} onChange={e => { setSelected(e.target.checked ? eligible.map(s => s.id) : []); setDownload(null); }} /><span>全选 · 已选 {rows.length} 条</span></label>{eligible.map(s => <label className="m-export-choice" key={s.id}><input type="checkbox" aria-label={'导出' + s.name} checked={selected.includes(s.id)} onChange={e => { setSelected(e.target.checked ? [...selected, s.id] : selected.filter(id => id !== s.id)); setDownload(null); }} /><span>{s.name}<small>{s.date}</small></span></label>)}</> : <Empty text="所选日期内没有可导出记录" />}</Section>}
    {download && <Section title="演示文件已生成" collapsible={false}><p className="m-input-note">共 {download.count} 条。本页临时下载链接仅供当前浏览器会话使用，关闭导出页后失效。</p><input ref={link} className="m-download-link" aria-label="本页临时下载链接" readOnly value={download.url} /><div className="m-record-actions"><a href={download.url} download="供应商-演示数据.csv">下载演示文件</a><button onClick={async () => { try { await navigator.clipboard.writeText(download.url); notify('临时链接已复制，仅限本页会话使用'); } catch { link.current.focus(); link.current.select(); notify('自动复制不可用，请长按复制已选中的链接'); } }}><Check aria-hidden="true" />复制链接</button></div></Section>}
    <Actions items={[{ label: '取消', secondary: true, onClick: onClose }, { label: '生成演示文件', onClick: generate }]} />
  </div>;
}
