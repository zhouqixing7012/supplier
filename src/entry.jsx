const getMode = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#/mobile')) return 'mobile';
  if (hash.startsWith('#/admin') || hash.startsWith('#/register/')) return 'admin';
  return 'portal';
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
  admin: () => import('./pc-entry.jsx'),
  portal: () => import('./main.jsx'),
};

loaders[initialMode]();

