import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useDirtyForm } from '../../pages/mobile-interaction.jsx';
import { Overlay } from './dialogs.jsx';
import { Field } from './fields.jsx';
import { Actions } from './layout.jsx';
import { SearchBox } from './search.jsx';

const prompts = ['请选择省', '请选择市', '请选择区县'];
const searchLabels = ['搜索省份', '搜索城市', '搜索区县'];
const placeholder = '请选择省 / 市 / 区县';

export function AddressForm({
  regions, initial = '', startRegion = false, sheet = false, title = '编辑注册地址', onConfirm, onCancel,
}) {
  const regionId = useId();
  const regionList = useRef(null);
  const [initialRegion, ...initialDetail] = initial.split(' ');
  const [region, setRegion] = useState(initialRegion);
  const [detail, setDetail] = useState(initialDetail.join(' '));
  const [selected, setSelected] = useState(() => {
    const parts = initialRegion.split('/').filter(Boolean);
    const [province, district] = parts;
    // 旧版直辖市草稿可能只保存市、区两级。
    return parts.length === 2 && regions[province]?.[province] ? [province, province, district] : parts;
  });
  const [open, setOpen] = useState(startRegion || !initialRegion);
  const [stage, setStage] = useState(0);
  const [search, setSearch] = useState('');
  const guard = useDirtyForm({ region, detail });
  const close = () => guard.leave(onCancel);

  // 切换层级或搜索后从列表顶部展示。
  useEffect(() => { if (regionList.current) regionList.current.scrollTop = 0; }, [open, stage, search]);

  const province = regions[selected[0]];
  const levels = [Object.keys(regions), Object.keys(province || {}), province?.[selected[1]] || []];
  const matches = levels[stage].filter(value => value.includes(search.trim()));
  const switchStage = index => {
    setStage(index);
    setSearch('');
  };
  const choose = value => {
    const next = [...selected.slice(0, stage), value];
    setSelected(next);
    if (stage === 2) {
      setRegion(next.join('/'));
      setSearch('');
      setOpen(false);
    } else {
      switchStage(stage + 1);
    }
  };
  const save = () => {
    guard.accept();
    onConfirm(region + ' ' + detail);
  };
  const form = <div className="m-address-form">
    <div className="m-address-fields">
      <div className="m-field m-field-inline">
        <label htmlFor={regionId}><em>*</em><span className="m-field-name">省市区</span></label>
        <div className="m-field-control">
          <button id={regionId} type="button" aria-label="省市区" aria-expanded={open} className="m-select-field"
            onClick={() => { setOpen(!open); switchStage(0); }}>
            <span className={!region ? 'm-placeholder' : ''}>{(open ? selected.filter(Boolean).join(' / ') : region) || placeholder}</span>
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
      </div>
      {open && <div className="m-region-panel">
        <div className="m-region-tabs" aria-label="选择省市区">
          {prompts.map((prompt, index) => <button type="button" key={prompt}
            aria-current={stage === index ? 'step' : undefined} disabled={index > 0 && !selected[index - 1]}
            onClick={() => switchStage(index)}>{selected[index] || prompt}</button>)}
        </div>
        <SearchBox value={search} onChange={setSearch} placeholder={searchLabels[stage]} />
        <div ref={regionList} className="m-sheet-options m-region-options">
          {matches.length ? matches.map(value => <button type="button" key={value}
            className={selected[stage] === value ? 'selected' : ''} onClick={() => choose(value)}>
            <span>{value}</span>{selected[stage] === value && <Check aria-hidden="true" />}
          </button>) : <p className="m-region-empty" role="status">{search ? '暂无匹配地区' : '暂无可选地区'}</p>}
        </div>
      </div>}
      <Field label="详细地址" required multiline placeholder="请输入街道、门牌号等详细地址"
        value={detail} maxLength={50} onChange={setDetail} />
    </div>
    <Actions flat items={[
      { label: '取消', muted: true, onClick: close },
      { label: '确定', disabled: open || !region || !detail.trim(), onClick: save },
    ]} />
  </div>;

  return sheet ? <Overlay sheet label={title} onClose={close}>
    <div className="m-address-editor">
      <div className="m-picker-title"><strong>{title}</strong></div>
      {form}
    </div>
  </Overlay> : form;
}
