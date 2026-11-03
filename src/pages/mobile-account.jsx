import React, { useEffect, useRef, useState } from 'react';
import { Actions, Field, Row, Section } from './mobile-ui.jsx';
import { useDirtyForm } from './mobile-interaction.jsx';

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '');
const codeLifetime = 5 * 60 * 1000;

// 会话演示验证码自动回填，不发邮件，不修改真实账户凭据。
export function AccountSecurityForm({ kind, email, onCancel, onComplete }) {
  const changingEmail = kind === 'email';
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ newEmail: '', code: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const issued = useRef(null);
  const oldVerified = useRef(false);
  const guard = useDirtyForm(data);
  const target = changingEmail && step === 1 ? data.newEmail.trim() : email;
  useEffect(() => { if (!countdown) return; const timer = setTimeout(() => setCountdown(value => value - 1), 1000); return () => clearTimeout(timer); }, [countdown]);
  const change = (key, value) => {
    setErrors({});
    if (key === 'newEmail') { issued.current = null; setCountdown(0); setData(old => ({ ...old, newEmail: value, code: '' })); }
    else setData(old => ({ ...old, [key]: value }));
  };
  const emailError = () => !validEmail(target) ? '请输入正确的新邮箱' : changingEmail && step === 1 && target === email ? '新邮箱不能与原邮箱相同' : '';
  const sendCode = () => {
    const error = emailError();
    if (error) return setErrors({ newEmail: error });
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
      if (!data.password.trim()) next.password = '请输入新密码';
      if (!data.confirmation) next.confirmation = '请再次输入新密码';
      else if (data.confirmation !== data.password) next.confirmation = '两次输入的密码不一致';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    if (changingEmail && step === 0) {
      oldVerified.current = true; issued.current = null; setCountdown(0); setData(old => ({ ...old, code: '' })); setStep(1); return;
    }
    if (changingEmail && !oldVerified.current) return setErrors({ code: '请先验证原邮箱' });
    guard.accept();
    onComplete(changingEmail ? target : undefined);
  };
  return <>
    <Section title={changingEmail ? step === 0 ? '验证原邮箱' : '设置新邮箱' : '修改密码'} collapsible={false}>
      <Row label="当前绑定邮箱">{email}</Row>
      {changingEmail && step === 1 && <Field label="新邮箱" required type="email" autoComplete="email" value={data.newEmail} error={errors.newEmail} onChange={value => change('newEmail', value)} />}
      <Field label="邮箱验证码" required inputMode="text" autoComplete="one-time-code" value={data.code} error={errors.code} onChange={value => change('code', value)} />
      <div className="m-account-code-action"><button type="button" disabled={countdown > 0} onClick={sendCode}>{countdown ? countdown + '秒后重新获取' : '获取验证码'}</button></div>
      {!changingEmail && <><Field label="新密码" required type="password" autoComplete="new-password" value={data.password} error={errors.password} onChange={value => change('password', value)} /><Field label="确认新密码" required type="password" autoComplete="new-password" value={data.confirmation} error={errors.confirmation} onChange={value => change('confirmation', value)} /></>}
    </Section>
    <Actions items={[{ label: '取消', secondary: true, onClick: () => guard.leave(onCancel) }, { label: changingEmail && step === 0 ? '下一步' : '保存', onClick: submit }]} />
  </>;
}
