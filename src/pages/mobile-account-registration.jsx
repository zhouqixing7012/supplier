import React, { useState } from 'react';
import { Field, Row } from './mobile-ui.jsx';
import { useDirtyForm } from './mobile-interaction.jsx';

// 账号注册只演示前端校验，不保存密码或创建真实账号。
export function SupplierAccountRegistration({ invitation, accounts, onComplete, onCancel }) {
  const [form, setForm] = useState({ account: '', password: '', confirmPassword: '', verification: '' });
  const [captcha, setCaptcha] = useState('cbvs');
  const [errors, setErrors] = useState({});
  const guard = useDirtyForm(form);
  const change = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: '', ...(key === 'password' ? { confirmPassword: '' } : {}) }));
  };
  const submit = event => {
    event.preventDefault();
    const next = {};
    const account = form.account;
    if (!account.trim()) next.account = '请输入账号';
    else if (accounts.includes(account)) next.account = '该账号已存在，请更换账号';
    if (!form.password.trim()) next.password = '请输入密码';
    if (!form.confirmPassword) next.confirmPassword = '请再次输入密码';
    else if (form.password !== form.confirmPassword) next.confirmPassword = '两次输入的密码不一致';
    if (!form.verification.trim()) next.verification = '请输入验证码';
    else if (form.verification.toLowerCase() !== captcha) next.verification = '验证码错误，请重新输入';
    setErrors(next);
    if (Object.keys(next).length) return;
    guard.accept();
    onComplete({ account });
  };
  return <div className="m-portal-login m-supplier-account-registration">
    <div className="m-portal-brand"><span className="m-portal-brand-mark">搜狐</span><span>供应商协同门户</span></div>
    <section className="m-portal-login-card" aria-labelledby="supplier-account-heading">
      <h2 id="supplier-account-heading">账号注册</h2>
      <div className="m-signup-identity"><Row label="供应商类型">{invitation.type}</Row><Row label="供应商名称">{invitation.name}</Row></div>
      <form className="m-portal-form" onSubmit={submit} noValidate>
        <Field label="账号" required value={form.account} onChange={v => change('account', v)} error={errors.account} autoComplete="username" />
        <Field label="密码" required type="password" value={form.password} onChange={v => change('password', v)} error={errors.password} autoComplete="new-password" />
        <Field label="确认密码" required type="password" value={form.confirmPassword} onChange={v => change('confirmPassword', v)} error={errors.confirmPassword} autoComplete="new-password" placeholder="请再次输入密码" />
        <div className="m-captcha-field"><Field label="验证码" required value={form.verification} onChange={v => change('verification', v)} error={errors.verification} autoComplete="off" /><span className="m-captcha" aria-label="图形验证码">{captcha}</span><button type="button" onClick={() => { setCaptcha(captcha === 'cbvs' ? '39qq' : 'cbvs'); change('verification', ''); }}>换一张</button></div>
        <button type="submit" className="m-login-button">提交</button>
        <button type="button" className="m-signup-cancel" onClick={() => guard.leave(onCancel)}>返回</button>
      </form>
    </section>
  </div>;
}
