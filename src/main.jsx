import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, App, Button, Card, ConfigProvider, Form, Input, Space, Typography } from 'antd-pc';
import zhCN from 'antd-pc/es/locale/zh_CN';
import 'antd-pc/dist/reset.css';
import erpTheme from './erp/theme.js';
import { PortalWorkspace } from './pc/portal-workspace.jsx';
import './erp/presentation.css';
import './pc-admin.css';
import './pages/supplier-register.css';
import './pc/workflows.css';

const authTitles = { login: '用户登录', email: '邮箱验证', upgrade: '修改密码', forgot: '找回密码' };
const workspaceRoutes = ['profile', 'profile-edit', 'profile-approval', 'quotes', 'tax', 'travel', 'password', 'register-email'];
const readPath = () => window.location.hash.replace(/^#\/?/, '').split('/');

function AuthPage({ screen, account, setAccount, go, onLogin }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [sent, setSent] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  useEffect(() => {
    if (!retryIn) return;
    const timer = window.setTimeout(() => setRetryIn(retryIn - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);
  const isLogin = screen === 'login';
  const verifyLogin = screen === 'email';
  const submit = (values) => {
    if (isLogin) {
      if (values.captcha !== '1234') return form.setFields([{ name: 'captcha', errors: ['请输入演示图形验证码 1234'] }]);
      const name = values.account.trim();
      if (!name) return form.setFields([{ name: 'account', errors: ['请输入账号'] }]);
      if (name.toLowerCase() === 'noemail') return message.warning('当前账号未维护注册邮箱，请联系搜狐业务对接人补充');
      setAccount(name);
      if (name.toLowerCase() === 'oldpwd') {
        message.warning('为保障账号安全，请先修改密码');
        go('upgrade');
      } else go('email');
      return;
    }
    if (sent !== values.email || values.code !== '1234') return form.setFields([{ name: 'code', errors: ['请先获取演示验证码，并输入 1234'] }]);
    if (verifyLogin) onLogin();
    else {
      message.success('演示密码校验通过');
      go('login');
    }
  };
  return <main className="pc-auth-page">
    <Card className="pc-auth-card" title={<span className="pc-auth-brand"><img src={import.meta.env.BASE_URL + 'sohu-logo.png'} alt="搜狐" />供应商协同门户</span>}>
      <Typography.Title level={4}>{authTitles[screen]}</Typography.Title>
      <Alert type="info" showIcon title={isLogin ? '原型演示，图形验证码为 1234' : '原型演示，获取验证码后使用 1234 校验'} />
      <Form form={form} layout="vertical" initialValues={{ account }} onFinish={submit}>
        {screen !== 'email' && <Form.Item name="account" label="账号" rules={[{ required: true }]}><Input autoComplete="username" readOnly={screen === 'upgrade'} /></Form.Item>}
        {isLogin ? <>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password autoComplete="current-password" /></Form.Item>
          <Form.Item name="captcha" label="图形验证码" rules={[{ required: true }]}><Input autoComplete="off" /></Form.Item>
        </> : <>
          <Form.Item name="email" label="注册邮箱" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label="邮箱验证码" required>
            <Space.Compact block>
              <Form.Item name="code" noStyle rules={[{ required: true }]}><Input aria-label="邮箱验证码" /></Form.Item>
              <Button disabled={retryIn > 0} onClick={async () => {
                try {
                  const { email } = await form.validateFields(['email']);
                  setSent(email);
                  setRetryIn(60);
                  message.info('演示验证码为 1234');
                } catch { /* 字段错误由表单展示。 */ }
              }}>{retryIn ? retryIn + ' 秒后重发' : '获取验证码'}</Button>
            </Space.Compact>
          </Form.Item>
          {!verifyLogin && <>
            <Form.Item name="password" label="新密码" rules={[{ required: true }]}><Input.Password autoComplete="new-password" /></Form.Item>
            <Form.Item name="confirm" label="确认密码" dependencies={['password']} rules={[{ required: true }, ({ getFieldValue }) => ({
              validator: (_, value) => !value || value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')),
            })]}><Input.Password autoComplete="new-password" /></Form.Item>
          </>}
        </>}
        <Space wrap>
          {isLogin ? <Button type="link" onClick={() => go('forgot')}>修改密码</Button> : <Button onClick={() => go('login')}>返回</Button>}
          <Button type="primary" htmlType="submit">{isLogin ? '登录' : verifyLogin ? '验证并登录' : '提交'}</Button>
        </Space>
      </Form>
      {isLogin && <div className="pc-auth-links"><Space><a href="#/admin/suppliers">供应商管理平台</a><a href="#/mobile">移动端原型</a></Space></div>}
    </Card>
  </main>;
}

export function PortalApp() {
  const [path, setPath] = useState(readPath);
  const [account, setAccount] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const go = (next) => { window.location.hash = '/' + next; };
  useEffect(() => {
    const update = () => setPath(readPath());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const screen = path[0] === 'portal' && workspaceRoutes.includes(path[1]) ? path[1] : 'profile';
  const auth = Object.hasOwn(authTitles, path[0]) && (path[0] !== 'email' || account) ? path[0] : 'login';
  const workspace = path[0] === 'portal' && signedIn;
  return <ConfigProvider locale={zhCN} theme={erpTheme}><App>
    {workspace ? <PortalWorkspace screen={screen} recordNumber={path[2] && decodeURIComponent(path[2])} go={go} account={account}
      onLogout={() => { setSignedIn(false); setAccount(''); go('login'); }} />
      : <AuthPage key={auth} screen={auth} account={account} setAccount={setAccount} go={go}
        onLogin={() => { setSignedIn(true); go('portal/profile'); }} />}
  </App></ConfigProvider>;
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<PortalApp />);
