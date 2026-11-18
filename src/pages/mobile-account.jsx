import React, { useEffect, useRef, useState } from 'react';
import { Actions, Row, Section } from '../components/mobile/index.js';
import { focusFormError } from '../components/mobile/validation.js';
import { Field } from './mobile-ui.jsx';
import { useDirtyForm } from './mobile-interaction.jsx';
import { registrationPasswordError } from './mobile-registration-password.js';

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
const codeLifetime = 5 * 60 * 1000;

// 会话演示验证码自动回填，不发邮件，不修改真实账户凭据。
export function AccountSecurityForm({ kind, email, onCancel, onComplete, initialStep = 0 }) {
  const changingEmail = kind === 'email';
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState({ newEmail: '', code: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const issued = useRef(null);
  const oldVerified = useRef(false);
  const guard = useDirtyForm(data);
  const target = changingEmail && step === 1 ? data.newEmail.trim() : (email || '').trim();
  useEffect(() => { if (!countdown) return; const timer = setTimeout(() => setCountdown(value => value - 1), 1000); return () => clearTimeout(timer); }, [countdown]);
  const change = (key, value) => {
    setErrors({});
    if (key === 'newEmail') { issued.current = null; setCountdown(0); setData(old => ({ ...old, newEmail: value, code: '' })); }
    else setData(old => ({ ...old, [key]: value }));
  };
  const emailError = () => !validEmail(target) ? '请输入正确的新邮箱' : changingEmail && step === 1 && target === (email || '').trim() ? '新邮箱不能与原邮箱相同' : '';
  const sendCode = () => {
    const error = emailError();
    if (error) { setErrors({ newEmail: error }); return focusFormError(); }
    issued.current = { target, expires: Date.now() + codeLifetime };
    setData(old => ({ ...old, code: '1234' })); setErrors({}); setCountdown(60);
  };
  const submit = () => {
    const next = {};
    if (changingEmail && step === 1) { const error = emailError(); if (error) next.newEmail = error; }
    if (!data.code.trim()) next.code = '请输入邮箱验证码';
    else if (!issued.current || issued.current.target !== target) next.code = '请先获取邮箱验证码';
    else if (Date.now() > issued.current.expires) next.code = '验证码已过期，请重新获取';
    else if (data.code.trim() !== '1234') next.code = '邮箱验证码错误';
    if (!changingEmail) {
      const passwordError = registrationPasswordError(data.password);
      if (passwordError) next.password = passwordError;
      if (!data.confirmation) next.confirmation = '请再次输入新密码';
      else if (data.confirmation !== data.password) next.confirmation = '两次输入的密码不一致';
    }
    setErrors(next);
    if (Object.keys(next).length) return focusFormError();
    if (changingEmail && step === 0) {
      oldVerified.current = true; issued.current = null; setCountdown(0); setData(old => ({ ...old, code: '' })); setStep(1); return;
    }
    if (changingEmail && !oldVerified.current) { setErrors({ code: '请先验证原邮箱' }); return focusFormError(); }
    guard.accept();
    onComplete(changingEmail ? target : undefined);
  };
  return <>
    <Section title={changingEmail ? (step === 0 ? '验证原邮箱' : '设置新邮箱') : undefined} collapsible={false} className="m-supplier-form-fields">
      <Row label="当前注册邮箱">{email}</Row>
      {changingEmail && step === 1 && <Field label="新邮箱" required type="email" autoComplete="email" value={data.newEmail} error={errors.newEmail} onChange={value => change('newEmail', value)} />}
      <Field label="邮箱验证码" required inputMode="text" placeholder="输入验证码" autoComplete="one-time-code" value={data.code} error={errors.code} onChange={value => change('code', value)} trailing={<button className="m-account-code-button" type="button" disabled={countdown > 0} onClick={sendCode}>{countdown ? countdown + '秒后重发' : '获取验证码'}</button>} />
      {!changingEmail && <><Field label="新密码" required type="password" autoComplete="new-password" value={data.password} error={errors.password} onChange={value => change('password', value)} /><Field label="确认新密码" required type="password" autoComplete="new-password" value={data.confirmation} error={errors.confirmation} onChange={value => change('confirmation', value)} /></>}
    </Section>
    <Actions items={[{ label: '取消', secondary: true, onClick: () => guard.leave(onCancel) }, { label: changingEmail && step === 0 ? '下一步' : '保存', onClick: submit }]} />
  </>;
}

