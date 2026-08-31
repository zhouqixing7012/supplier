import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import './styles.css';

const screens = ['login', 'email', 'upgrade', 'history', 'forgot'];

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

function Field({ label, required = false, children, help }) {
  return (
    <div className="field-row">
      <div className="field-label">
        {required && <span className="required">*</span>}
        {label}
      </div>
      <div className="field-control">
        {children}
        {help && <div className="field-help">{help}</div>}
      </div>
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
      <button className="icon-button" type="button" onClick={() => setVisible(!visible)} aria-label="切换密码可见">
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
      <PrototypeSwitcher />
    </main>
  );
}

function PrototypeSwitcher() {
  const options = [
    ['login', '登录页'],
    ['email', '邮箱验证'],
    ['upgrade', '安全改密'],
    ['history', '历史供应商'],
    ['forgot', '忘记密码'],
  ];
  return (
    <div className="switcher">
      <span>原型场景</span>
      {options.map(([key, label]) => (
        <a key={key} href={`#/${key}`}>{label}</a>
      ))}
    </div>
  );
}

function LoginScreen({ go }) {
  const [account, setAccount] = useState('liuyjm');
  const [password, setPassword] = useState('12345678');
  const [captcha, setCaptcha] = useState('');
  return (
    <PageShell title="用户登录" icon={<UserRound size={18} />}>
      <div className="section-heading">Please login or register</div>
      <form className="form" onSubmit={(e) => { e.preventDefault(); go('email'); }}>
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
        <div className="login-security-note">
          <ShieldCheck size={18} />
          <span>登录后需完成注册邮箱验证码验证</span>
        </div>
        <div className="actions left-actions">
          <button className="primary warm" type="submit">登录</button>
        </div>
      </form>
    </PageShell>
  );
}

function EmailScreen({ go }) {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setInterval(() => setCountdown((v) => Math.max(v - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);
  return (
    <PageShell title="安全验证" icon={<ShieldCheck size={18} />}>
      <div className="notice blue-notice">
        <ShieldCheck size={22} />
        <div>
          <strong>请验证注册邮箱</strong>
          <p>为保障供应商账号安全，需要验证已认证的注册邮箱后才能登录。</p>
        </div>
      </div>
      <form className="form compact" onSubmit={(e) => { e.preventDefault(); go('upgrade'); }}>
        <Field label="账号">
          <input value="liuyjm" readOnly className="readonly" />
        </Field>
        <Field label="注册邮箱">
          <div className="static-value"><Mail size={17} /> liu***@example.com</div>
        </Field>
        <Field label="验证码" required help="验证码 5 分钟内有效，请勿泄露给他人。">
          <div className="verify-line">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入6位邮箱验证码" maxLength={6} />
            <button className="outline-button" type="button" disabled={countdown > 0} onClick={() => setCountdown(60)}>
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
          </div>
        </Field>
        <div className="actions">
          <button className="primary" type="submit">验证并继续</button>
          <button className="secondary" type="button" onClick={() => go('login')}>返回</button>
        </div>
      </form>
    </PageShell>
  );
}

function UpgradeScreen({ go }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const checks = useMemo(() => [
    ['不少于12位', password.length >= 12],
    ['避免使用姓名、账号等易猜信息', password.length > 0 && !password.toLowerCase().includes('liuyjm')],
    ['两次密码输入一致', password.length > 0 && password === confirm],
  ], [password, confirm]);
  return (
    <PageShell title="账号安全升级" icon={<LockKeyhole size={18} />} background="password">
      <div className="notice amber-notice">
        <TriangleAlert size={22} />
        <div>
          <strong>本次需完成一次密码安全升级</strong>
          <p>您已通过注册邮箱验证。修改成功后不再按60天周期要求修改密码。</p>
        </div>
      </div>
      <form className="form compact" onSubmit={(e) => { e.preventDefault(); alert('原型：密码修改成功并登录'); }}>
        <Field label="账号">
          <input value="liuyjm" readOnly className="readonly" />
        </Field>
        <Field label="新密码" required>
          <PasswordInput value={password} onChange={setPassword} placeholder="请输入新密码" />
        </Field>
        <Field label="确认密码" required>
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="请再次输入新密码" />
        </Field>
        <div className="password-rules">
          {checks.map(([text, ok]) => (
            <span key={text} className={ok ? 'ok' : ''}><CheckCircle2 size={15} />{text}</span>
          ))}
        </div>
        <div className="actions">
          <button className="primary" type="submit">修改并登录</button>
          <button className="secondary" type="button" onClick={() => go('login')}>返回</button>
        </div>
      </form>
    </PageShell>
  );
}

function HistoryScreen({ go }) {
  return (
    <PageShell title="账号安全认证" icon={<ShieldCheck size={18} />}>
      <div className="history-block">
        <div className="history-icon"><TriangleAlert size={34} /></div>
        <h2>当前账号暂无法登录协同门户</h2>
        <p className="history-desc">该供应商属于历史导入数据，尚未建立可信注册邮箱，无法通过密码自行绑定新邮箱或修改密码。</p>
        <div className="steps">
          <div><span>1</span><p><strong>联系搜狐业务对接人</strong><br />确认当前供应商的邀请人。</p></div>
          <div><span>2</span><p><strong>由邀请人重新发起注册</strong><br />注册链接发送至邀请人确认的供应商邮箱。</p></div>
          <div><span>3</span><p><strong>完成账号安全认证</strong><br />设置账号密码后，注册邮箱成为可信认证邮箱。</p></div>
        </div>
        <div className="security-warning"><Info size={18} /> 为保障账号归属安全，本页面不提供“自行绑定新邮箱”入口。</div>
        <div className="actions center-actions">
          <button className="primary" onClick={() => go('login')}><ArrowLeft size={16} />返回登录</button>
        </div>
      </div>
    </PageShell>
  );
}

function ForgotScreen({ go }) {
  const [account, setAccount] = useState('liuyjm');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  return (
    <PageShell title="修改密码" icon={<LockKeyhole size={18} />} background="password">
      <div className="notice blue-notice small-notice">
        <ShieldCheck size={20} />
        <div><strong>仅支持通过已认证注册邮箱修改密码</strong><p>如原注册邮箱无法使用，请联系搜狐业务对接人处理。</p></div>
      </div>
      <form className="form compact" onSubmit={(e) => { e.preventDefault(); alert('原型：密码修改成功'); }}>
        <Field label="账号" required>
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="请输入登录账号" />
        </Field>
        <Field label="注册邮箱">
          <div className="static-value"><Mail size={17} /> liu***@example.com</div>
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
  if (screen === 'history') return <HistoryScreen go={go} />;
  if (screen === 'forgot') return <ForgotScreen go={go} />;
  return <LoginScreen go={go} />;
}

createRoot(document.getElementById('root')).render(<App />);
