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
    ['upgrade', '60天改密'],
    ['email', '邮箱验证'],
    ['history', '无邮箱处理'],
    ['forgot', '主动修改密码'],
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

function DemoEntryButtons({ go }) {
  return (
    <div className="demo-entry">
      <div className="demo-entry-title">评审快捷入口</div>
      <div className="demo-entry-buttons">
        <button type="button" className="ghost-chip" onClick={() => go('history')}>历史数据无邮箱</button>
        <button type="button" className="ghost-chip" onClick={() => go('upgrade')}>有邮箱，密码超60天</button>
        <button type="button" className="ghost-chip" onClick={() => go('email')}>有邮箱，密码已升级</button>
      </div>
    </div>
  );
}

function LoginScreen({ go }) {
  const [account, setAccount] = useState('liuyjm');
  const [password, setPassword] = useState('12345678');
  const [captcha, setCaptcha] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const key = account.trim().toLowerCase();
    if (key === 'noemail') {
      go('history');
      return;
    }
    if (key === 'oldpwd') {
      go('upgrade');
      return;
    }
    go('email');
  };

  return (
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
        <div className="login-security-note">
          <ShieldCheck size={18} />
          <span>密码校验成功后，按账号状态进入邮箱验证或修改密码流程</span>
        </div>
        <div className="actions left-actions">
          <button className="primary warm" type="submit">登录</button>
        </div>
      </form>
      <DemoEntryButtons go={go} />
    </PageShell>
  );
}

function EmailScreen({ go }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setInterval(() => setCountdown((v) => Math.max(v - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);
  return (
    <PageShell title="邮箱安全验证" icon={<ShieldCheck size={18} />}>
      <div className="notice blue-notice">
        <ShieldCheck size={22} />
        <div>
          <strong>请输入注册邮箱并完成验证码校验</strong>
          <p>账号密码验证通过后，还需要校验注册邮箱与邮箱验证码，验证成功才可登录。</p>
        </div>
      </div>
      <form className="form compact" onSubmit={(e) => { e.preventDefault(); alert('原型：密码和邮箱校验通过，登录成功'); }}>
        <Field label="账号">
          <input value="liuyjm" readOnly className="readonly" />
        </Field>
        <Field label="注册邮箱" required help="请输入该账号已维护的注册邮箱，系统校验一致后才可发送验证码。">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入注册邮箱" />
        </Field>
        <Field label="验证码" required help="验证码5分钟内有效，校验成功后进入协同门户。">
          <div className="verify-line">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入6位邮箱验证码" maxLength={6} />
            <button className="outline-button" type="button" disabled={countdown > 0} onClick={() => setCountdown(60)}>
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </button>
          </div>
        </Field>
        <div className="security-warning mild-warning"><Info size={18} /> 若输入邮箱与账号注册邮箱不一致，则不给发送验证码。</div>
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
    const timer = window.setInterval(() => setCountdown((v) => Math.max(v - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const checks = useMemo(() => [
    ['不少于12位', password.length >= 12],
    ['避免使用账号、姓名等易猜信息', password.length > 0 && !password.toLowerCase().includes('liuyjm')],
    ['两次密码输入一致', password.length > 0 && password === confirm],
  ], [password, confirm]);

  return (
    <PageShell title="修改密码" icon={<LockKeyhole size={18} />} background="password">
      <div className="notice amber-notice">
        <TriangleAlert size={22} />
        <div>
          <strong>您的密码已超过60天未更新，请先修改密码</strong>
          <p>维持现有修改密码交互。本次修改成功后，取消该账号60天密码限制，后续登录增加邮箱验证码校验。</p>
        </div>
      </div>
      <form className="form compact" onSubmit={(e) => { e.preventDefault(); alert('原型：密码修改成功，已去除60天密码限制；请后续通过邮箱验证码登录'); }}>
        <Field label="账号" required>
          <input value="oldpwd" readOnly className="readonly" />
        </Field>
        <Field label="注册邮箱" required>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入注册时邮箱" />
        </Field>
        <Field label="验证码" required help="发送到注册邮箱，用于完成本次密码修改。">
          <div className="verify-line">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="请输入邮箱验证码" maxLength={6} />
            <button className="outline-button" type="button" disabled={countdown > 0} onClick={() => setCountdown(60)}>
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
        <div className="password-rules">
          {checks.map(([text, ok]) => (
            <span key={text} className={ok ? 'ok' : ''}><CheckCircle2 size={15} />{text}</span>
          ))}
        </div>
        <div className="actions">
          <button className="primary" type="submit">提交</button>
          <button className="secondary" type="button" onClick={() => go('login')}>返回</button>
        </div>
      </form>
    </PageShell>
  );
}

function HistoryScreen({ go }) {
  return (
    <PageShell title="无注册邮箱处理" icon={<ShieldCheck size={18} />}>
      <div className="history-block">
        <div className="history-icon"><TriangleAlert size={34} /></div>
        <h2>当前账号未维护注册邮箱，暂时无法登录</h2>
        <p className="history-desc">为保障账号安全，历史数据无邮箱的供应商不允许直接登录，也不允许在登录页自行新增邮箱。</p>
        <div className="steps">
          <div><span>1</span><p><strong>供应商联系内部人员</strong><br />由业务对接人确认当前供应商需要补充注册邮箱。</p></div>
          <div><span>2</span><p><strong>内部人员联系产品</strong><br />产品收集供应商信息并确认需要补录的注册邮箱。</p></div>
          <div><span>3</span><p><strong>产品联系研发执行数据变更</strong><br />研发按正式流程执行 SQL 补充邮箱，并同步 EBS、主数据、PR。</p></div>
        </div>
        <div className="security-warning"><Info size={18} /> 邮箱补充完成后，用户重新登录；若密码超过60天未更新，仍需先修改密码。</div>
        <div className="actions center-actions">
          <button className="primary" onClick={() => go('login')}><ArrowLeft size={16} />返回登录</button>
        </div>
      </div>
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
      <div className="notice blue-notice small-notice">
        <ShieldCheck size={20} />
        <div><strong>仅支持通过已维护的注册邮箱修改密码</strong><p>如果当前账号没有注册邮箱，请联系内部人员走数据变更处理。</p></div>
      </div>
      <form className="form compact" onSubmit={(e) => { e.preventDefault(); alert('原型：密码修改成功'); }}>
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
  if (screen === 'history') return <HistoryScreen go={go} />;
  if (screen === 'forgot') return <ForgotScreen go={go} />;
  return <LoginScreen go={go} />;
}

createRoot(document.getElementById('root')).render(<App />);
