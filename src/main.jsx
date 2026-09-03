import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { message } from 'antd';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import './styles.css';

const screens = ['login', 'email', 'upgrade', 'forgot'];

function useHashScreen() {
  const read = () => {
    const value = window.location.hash.replace('#/', '').trim();
    return screens.includes(value) ? value : 'login';
  };

  const [screen, setScreen] = useState(read);

  useEffect(() => {
    const onHash = () => setScreen(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next) => {
    window.location.hash = `/${next}`;
  };

  return [screen, go];
}

function Field({ label, required = false, children }) {
  return (
    <div className="field-row">
      <div className="field-label">
        {required && <span className="required">*</span>}
        {label}
      </div>
      <div className="field-control">{children}</div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = '请输入密码' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="input-shell">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
      />
      <button
        className="icon-button"
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label="切换密码可见"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function BrandHero() {
  return (
    <section className="brand-hero" aria-hidden="true">
      <div className="sohu-logo"><strong>搜 狐</strong><small>SOHU.com</small></div>
      <div className="brand-title"><span>搜狐供应商</span><span><em>协</em>同门户</span></div>
      <div className="brand-copy">欢迎登陆供应商协同门户<br />请您注册账号，并妥善保管账号和密码。</div>
    </section>
  );
}

function PageShell({ title, icon, children, background = 'login' }) {
  return (
    <main className={`page ${background === 'password' ? 'password-bg' : 'login-bg'}`}>
      <BrandHero />
      <section className="card">
        <div className="card-title">
          <span className="title-mark" />
          {icon}
          <strong>{title}</strong>
        </div>
        {children}
      </section>
    </main>
  );
}

function LoginScreen({ go }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [account, setAccount] = useState('liuyjm');
  const [password, setPassword] = useState('12345678');
  const [captcha, setCaptcha] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();

    // 原型仅用于演示三类登录结果，正式系统由接口返回账号状态。
    const key = account.trim().toLowerCase();

    if (key === 'noemail') {
      messageApi.warning({
        content: (
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>当前账号未维护注册邮箱，暂时无法登录。</div>
            <div>为保障账号安全，请联系搜狐业务对接人补充注册邮箱后重新登录。</div>
          </div>
        ),
        duration: 5,
      });
      return;
    }

    if (key === 'oldpwd') {
      messageApi.warning('为保障账号安全，请先修改密码。');
      window.setTimeout(() => go('upgrade'), 300);
      return;
    }

    go('email');
  };

  return (
    <>
      {contextHolder}
      <PageShell title="用户登录" icon={<UserRound size={18} />}>
        <div className="section-heading">Please login or register</div>
        <form className="form" onSubmit={onSubmit}>
          <Field label="账号" required>
            <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="请输入登录账号" />
          </Field>
          <Field label="密码" required>
            <PasswordInput value={password} onChange={setPassword} />
          </Field>
          <Field label="验证码" required>
            <div className="captcha-line">
              <input value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="请输入验证码" />
              <div className="captcha-image">YHJV</div>
              <button className="link-button" type="button"><RefreshCw size={14} />换一张</button>
            </div>
          </Field>
          <div className="form-link-row">
            <button className="text-link" type="button" onClick={() => go('forgot')}>修改密码</button>
          </div>
          <div className="actions left-actions">
            <button className="primary warm" type="submit">登录</button>
          </div>
        </form>
      </PageShell>
    </>
  );
}

function EmailScreen({ go }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  return (
    <PageShell title="安全验证" icon={<ShieldCheck size={18} />}>
      <form
        className="form compact"
        onSubmit={(e) => {
          e.preventDefault();
          message.success('登录成功');
        }}
      >
        <Field label="注册邮箱" required>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入注册邮箱" />
        </Field>
        <Field label="验证码" required>
          <div className="verify-line">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入邮箱验证码" maxLength={6} />
            <button
              className="outline-button"
              type="button"
              disabled={countdown > 0}
              onClick={() => setCountdown(60)}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
          </div>
        </Field>
        <div className="actions">
          <button className="primary" type="submit">确定</button>
          <button className="secondary" type="button" onClick={() => go('login')}>返回</button>
        </div>
      </form>
    </PageShell>
  );
}

function UpgradeScreen({ go }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setInterval(() => setCountdown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  return (
    <PageShell title="修改密码" icon={<LockKeyhole size={18} />} background="password">
      <form
        className="form compact"
        onSubmit={(e) => {
          e.preventDefault();
          message.success('密码修改成功');
          window.setTimeout(() => go('login'), 500);
        }}
      >
        <Field label="账号" required>
          <input value="oldpwd" readOnly className="readonly" />
        </Field>
        <Field label="注册邮箱" required>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入注册时邮箱" />
        </Field>
        <Field label="验证码" required>
          <div className="verify-line">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入邮箱验证码" maxLength={6} />
            <button
              className="outline-button"
              type="button"
              disabled={countdown > 0}
              onClick={() => setCountdown(60)}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
            </button>
          </div>
        </Field>
        <Field label="新密码" required>
          <PasswordInput value={password} onChange={setPassword} placeholder="请输入新密码" />
        </Field>
        <Field label="密码确认" required>
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="请再次输入密码" />
        </Field>
        <div className="actions">
          <button className="primary" type="submit">提交</button>
          <button className="secondary" type="button" onClick={() => go('login')}>返回</button>
        </div>
      </form>
    </PageShell>
  );
}

function ForgotScreen({ go }) {
  const [account, setAccount] = useState('liuyjm');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <PageShell title="修改密码" icon={<LockKeyhole size={18} />} background="password">
      <form
        className="form compact"
        onSubmit={(e) => {
          e.preventDefault();
          message.success('密码修改成功');
        }}
      >
        <Field label="账号" required>
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="请输入登录账号" />
        </Field>
        <Field label="注册邮箱" required>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入注册邮箱" />
        </Field>
        <Field label="验证码" required>
          <div className="verify-line">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入邮箱验证码" />
            <button className="outline-button" type="button">发送验证码</button>
          </div>
        </Field>
        <Field label="新密码" required>
          <PasswordInput value={password} onChange={setPassword} placeholder="请输入新密码" />
        </Field>
        <Field label="密码确认" required>
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="请再次输入密码" />
        </Field>
        <div className="actions">
          <button className="primary" type="submit">提交</button>
          <button className="secondary" type="button" onClick={() => go('login')}>返回</button>
        </div>
      </form>
    </PageShell>
  );
}

function App() {
  const [screen, go] = useHashScreen();

  if (screen === 'email') return <EmailScreen go={go} />;
  if (screen === 'upgrade') return <UpgradeScreen go={go} />;
  if (screen === 'forgot') return <ForgotScreen go={go} />;
  return <LoginScreen go={go} />;
}

createRoot(document.getElementById('root')).render(<App />);
