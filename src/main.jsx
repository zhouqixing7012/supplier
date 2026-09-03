import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
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

function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="搜狐供应商协同门户">
      <div className="sohu-badge">
        <strong>搜 狐</strong>
        <span>SOHU.com</span>
      </div>

      <div className="brand-content">
        <div className="brand-kicker">SOHU SUPPLIER PORTAL</div>
        <h1>
          搜狐供应商
          <br />
          <span>协同门户</span>
        </h1>
        <p>欢迎登录供应商协同门户</p>
      </div>
    </section>
  );
}

function AuthShell({ title, subtitle, icon, children }) {
  return (
    <main className="auth-shell">
      <BrandPanel />
      <section className="auth-panel">
        <div className="auth-card">
          <header className="auth-card-header">
            <div className="auth-icon">{icon}</div>
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <label className="form-field">
      <span className="field-title">
        {required && <em>*</em>}
        {label}
      </span>
      {children}
    </label>
  );
}

function PasswordField({ value, onChange, placeholder = '请输入密码' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="current-password"
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={visible ? '隐藏密码' : '显示密码'}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function LoginScreen({ go }) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');

  const onSubmit = (event) => {
    event.preventDefault();
    const key = account.trim().toLowerCase();

    if (key === 'noemail') {
      toast.warning('当前账号未维护注册邮箱，暂时无法登录。', {
        description: '为保障账号安全，请联系搜狐业务对接人补充注册邮箱后重新登录。',
        duration: 5000,
      });
      return;
    }

    if (key === 'oldpwd') {
      toast.warning('为保障账号安全，请先修改密码。');
      go('upgrade');
      return;
    }

    go('email');
  };

  return (
    <AuthShell
      title="用户登录"
      subtitle="Please login or register"
      icon={<UserRound size={22} />}
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <FormField label="账号" required>
          <Input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="请输入登录账号"
            autoComplete="username"
          />
        </FormField>

        <FormField label="密码" required>
          <PasswordField value={password} onChange={setPassword} />
        </FormField>

        <FormField label="验证码" required>
          <div className="captcha-row">
            <Input
              value={captcha}
              onChange={(event) => setCaptcha(event.target.value)}
              placeholder="请输入验证码"
            />
            <div className="captcha-code">YHJV</div>
            <Button type="button" variant="ghost" size="sm" className="captcha-refresh">
              <RefreshCw size={14} />
              换一张
            </Button>
          </div>
        </FormField>

        <div className="form-tools">
          <Button type="button" variant="link" className="password-link" onClick={() => go('forgot')}>
            修改密码
          </Button>
        </div>

        <Button type="submit" size="lg" className="submit-button">
          登录
        </Button>
      </form>
    </AuthShell>
  );
}

function EmailScreen({ go }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const sendCode = () => {
    setCountdown(60);
    toast.success('验证码已发送');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    toast.success('登录成功');
  };

  return (
    <AuthShell
      title="安全验证"
      subtitle="请输入注册邮箱及邮箱验证码"
      icon={<ShieldCheck size={22} />}
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <FormField label="注册邮箱" required>
          <div className="input-with-icon">
            <Mail size={17} />
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="请输入注册邮箱"
              type="email"
            />
          </div>
        </FormField>

        <FormField label="邮箱验证码" required>
          <div className="verify-row">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="请输入验证码"
              maxLength={6}
            />
            <Button
              type="button"
              variant="outline"
              disabled={countdown > 0}
              onClick={sendCode}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </Button>
          </div>
        </FormField>

        <div className="action-row">
          <Button type="button" variant="outline" size="lg" onClick={() => go('login')}>
            <ArrowLeft size={16} />
            返回
          </Button>
          <Button type="submit" size="lg" className="submit-button compact-submit">
            确定
          </Button>
        </div>
      </form>
    </AuthShell>
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
    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const sendCode = () => {
    setCountdown(60);
    toast.success('验证码已发送');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    toast.success('密码修改成功');
    window.setTimeout(() => go('login'), 600);
  };

  return (
    <AuthShell
      title="修改密码"
      subtitle="请完成密码修改后重新登录"
      icon={<LockKeyhole size={22} />}
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <FormField label="账号" required>
          <Input value="oldpwd" readOnly className="read-only-input" />
        </FormField>

        <FormField label="注册邮箱" required>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="请输入注册邮箱"
            type="email"
          />
        </FormField>

        <FormField label="邮箱验证码" required>
          <div className="verify-row">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="请输入验证码"
              maxLength={6}
            />
            <Button
              type="button"
              variant="outline"
              disabled={countdown > 0}
              onClick={sendCode}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
            </Button>
          </div>
        </FormField>

        <FormField label="新密码" required>
          <PasswordField value={password} onChange={setPassword} placeholder="请输入新密码" />
        </FormField>

        <FormField label="确认密码" required>
          <PasswordField value={confirm} onChange={setConfirm} placeholder="请再次输入新密码" />
        </FormField>

        <div className="action-row">
          <Button type="button" variant="outline" size="lg" onClick={() => go('login')}>
            返回
          </Button>
          <Button type="submit" size="lg" className="submit-button compact-submit">
            提交
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

function ForgotScreen({ go }) {
  const [account, setAccount] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!countdown) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const onSubmit = (event) => {
    event.preventDefault();
    toast.success('密码修改成功');
  };

  return (
    <AuthShell
      title="修改密码"
      subtitle="通过注册邮箱验证身份"
      icon={<LockKeyhole size={22} />}
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <FormField label="账号" required>
          <Input
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder="请输入登录账号"
          />
        </FormField>

        <FormField label="注册邮箱" required>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="请输入注册邮箱"
            type="email"
          />
        </FormField>

        <FormField label="邮箱验证码" required>
          <div className="verify-row">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="请输入验证码"
            />
            <Button
              type="button"
              variant="outline"
              disabled={countdown > 0}
              onClick={() => {
                setCountdown(60);
                toast.success('验证码已发送');
              }}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
            </Button>
          </div>
        </FormField>

        <FormField label="新密码" required>
          <PasswordField value={password} onChange={setPassword} placeholder="请输入新密码" />
        </FormField>

        <FormField label="确认密码" required>
          <PasswordField value={confirm} onChange={setConfirm} placeholder="请再次输入新密码" />
        </FormField>

        <div className="action-row">
          <Button type="button" variant="outline" size="lg" onClick={() => go('login')}>
            返回
          </Button>
          <Button type="submit" size="lg" className="submit-button compact-submit">
            提交
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

function App() {
  const [screen, go] = useHashScreen();

  let page;
  if (screen === 'email') page = <EmailScreen go={go} />;
  else if (screen === 'upgrade') page = <UpgradeScreen go={go} />;
  else if (screen === 'forgot') page = <ForgotScreen go={go} />;
  else page = <LoginScreen go={go} />;

  return (
    <>
      <Toaster />
      {page}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
