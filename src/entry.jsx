const getMode = () => {
  const hash = window.location.hash;
  if (hash === '#/mobile/components') return 'mobileComponents';
  if (!hash || hash === '#/' || hash.startsWith('#/mobile')) return 'mobile';
  if (hash.startsWith('#/admin') || hash.startsWith('#/register/')) return 'admin';
  if (hash === '#/portal' || hash.startsWith('#/portal/')) return 'portal';
  return 'auth';
};
const initialMode = getMode();

window.addEventListener('hashchange', () => {
  if (getMode() !== initialMode) {
    window.location.reload();
  }
});

// 各入口单独声明加载函数，保证 Vite 为每个模块预加载对应的 CSS。
const loaders = {
  mobile: () => import('./mobile-entry.jsx'),
  mobileComponents: () => import('./mobile-components-entry.jsx'),
  admin: () => import('./pc-entry.jsx'),
  auth: () => import('./main.jsx'),
  portal: () => import('./portal-entry.jsx'),
};

loaders[initialMode]();

