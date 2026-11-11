import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App, ConfigProvider } from 'antd-pc';
import zhCN from 'antd-pc/es/locale/zh_CN';
import 'antd-pc/dist/reset.css';
import erpTheme from './erp/theme.js';
import { PortalWorkspace } from './pc/portal-workspace.jsx';
import './erp/presentation.css';
import './pc-admin.css';
import './pages/supplier-register.css';
import './pc/workflows.css';
import { readPortalAccount, clearPortalAccount } from './pc/portal-session.js';

const workspaceRoutes = ['profile', 'profile-edit', 'profile-approval', 'quotes', 'quotes-pending', 'quotes-processed', 'tax', 'tax-pending', 'tax-processed', 'travel', 'password', 'register-email'];
const readPath = () => window.location.hash.replace(/^#\/?/, '').split('/');

export function PortalApp() {
  const [path, setPath] = useState(readPath);
  const [account] = useState(readPortalAccount);
  const go = (next) => { window.location.hash = '/' + next; };
  useEffect(() => {
    const update = () => setPath(readPath());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (!account) window.location.replace('#/login');
  }, [account]);
  if (!account) return null;

  const screen = workspaceRoutes.includes(path[1]) ? path[1] : 'profile';
  return <ConfigProvider locale={zhCN} theme={erpTheme}><App>
    <PortalWorkspace screen={screen} recordNumber={path[2] && decodeURIComponent(path[2])} go={go} account={account}
      onLogout={() => { clearPortalAccount(); go('login'); }} />
  </App></ConfigProvider>;
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<PortalApp />);
