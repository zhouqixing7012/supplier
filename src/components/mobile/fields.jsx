import React, { useEffect, useId, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, HelpCircle, Eye, EyeOff, X } from 'lucide-react';
import { Overlay } from './dialogs.jsx';
import { DateSheet, OptionSheet } from './pickers.jsx';

export function Field({
  label, value = '', onChange, required = false, options, onPick, type = 'text', placeholder,
  maxLength, help, readOnly = false, multiline = false, error: fieldError, inputMode, autoComplete,
  selectionMode = 'immediate', searchable = false, layout, allowClearDate = false, trailing,
  hideLabel = false,
}) {
  const id = useId();
  const [validation, setValidation] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);

  useEffect(() => {
    const show = event => { if (event.detail.includes(label)) setValidation(event.detail); };
    window.addEventListener('mobile-validation', show);
    return () => window.removeEventListener('mobile-validation', show);
  }, [label]);
  useEffect(() => setValidation(''), [value]);

  const error = fieldError || validation;
  const errorId = error ? id + '-error' : undefined;
  const accessibility = { id, 'aria-label': label, 'aria-invalid': !!error, 'aria-describedby': errorId };
  const input = {
    ...accessibility, value, maxLength, required, readOnly, inputMode, enterKeyHint: 'next',
    autoComplete: autoComplete || (type === 'password' ? 'current-password' : 'off'),
  };
  const selection = { ...accessibility, type: 'button', className: 'm-select-field' };
  const selectedText = <span className={!value ? 'm-placeholder' : ''}>
    {value || placeholder || (type === 'date' && !onPick && !options ? '请选择日期' : '请选择' + label)}
  </span>;

  let control;
  if (onPick) {
    control = <button {...selection} onClick={onPick}>
      {selectedText}
      {type === 'date' ? <><CalendarDays className="m-date-icon" /><ChevronRight className="m-date-shot-icon" /></> : <ChevronRight />}
    </button>;
  } else if (options) {
    control = <button {...selection} role="combobox" aria-expanded={choosing} aria-haspopup="dialog"
      onClick={() => setChoosing(true)}>{selectedText}<ChevronDown /></button>;
  } else if (type === 'date') {
    control = <button {...selection} onClick={() => setDateOpen(true)}>
      {selectedText}<CalendarDays className="m-date-icon" /><ChevronDown className="m-date-shot-icon" />
    </button>;
  } else if (multiline) {
    control = <textarea {...input} onChange={event => onChange(event.target.value)}
      placeholder={placeholder || '请输入' + label} />;
  } else {
    control = <input {...input} onChange={event => onChange?.(event.target.value)}
      type={type === 'password' && visiblePassword ? 'text' : type}
      placeholder={readOnly ? '—' : placeholder || '请输入' + label} />;
  }

  const classes = [
    'm-field', hideLabel && 'm-field-placeholder-only', layout === 'inline' && 'm-field-force-inline',
    multiline ? 'm-field-stacked' : 'm-field-inline', error && 'has-error', multiline && 'm-field-block',
  ].filter(Boolean).join(' ');
  const clearable = onChange && value && !readOnly && !options && !onPick && type !== 'date' && type !== 'password';
  const showHelp = () => setHelpOpen(true);
  const closeHelp = () => setHelpOpen(false);

  return <>
    <div data-field-label={label} className={classes}>
      <label htmlFor={id}>
        {required && <em>*</em>}
        <span className="m-field-name">{label}</span>
        {help && !hideLabel && <button type="button" className="m-help"
          aria-label={label + '填写说明'} onClick={showHelp}><HelpCircle /></button>}
      </label>
      <div className={'m-field-control' + (trailing ? ' m-control-trailing' : '')}>
        {control}
        {trailing}
        {hideLabel && help && <button type="button" className="m-help m-filter-help"
          aria-label={label + '填写说明'} onClick={showHelp}><HelpCircle /></button>}
        {clearable && <button type="button" className="m-field-clear" aria-label={'清空' + label}
          onClick={() => { onChange(''); document.getElementById(id)?.focus(); }}><X /></button>}
        {type === 'password' && <button type="button" className="m-password-toggle"
          aria-label={visiblePassword ? '隐藏密码' : '显示密码'} onClick={() => setVisiblePassword(!visiblePassword)}>
          {visiblePassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>}
        {maxLength && !options && !onPick && <small className="m-counter">{value.length}/{maxLength}</small>}
      </div>
      {error && <p id={errorId} className="m-field-error" role="alert">{error}</p>}
    </div>
    {helpOpen && <Overlay label={label + '填写说明'} onClose={closeHelp}>
      <h2>{label}</h2><p>{help}</p>
      <div className="m-dialog-actions"><button type="button" onClick={closeHelp}>知道了</button></div>
    </Overlay>}
    {choosing && <OptionSheet title={label} options={options} value={value} onChange={onChange}
      onClose={() => setChoosing(false)} mode={selectionMode} searchable={searchable} />}
    {dateOpen && <DateSheet title={label} value={value} onChange={onChange}
      onClose={() => setDateOpen(false)} allowClear={allowClearDate} />}
  </>;
}
