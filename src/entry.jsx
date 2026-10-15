const getMode = () => window.location.hash.startsWith('#/mobile') ? 'mobile' : window.location.hash.startsWith('#/register/') ? 'register' : 'portal';
const initialMode = getMode();

window.addEventListener('hashchange', () => {
  if (getMode() !== initialMode) {
    window.location.reload();
  }
});

// 各入口单独声明加载函数，保证 Vite 为每个模块预加载对应的 CSS。
const loaders = {
  mobile: () => import('./mobile-entry.jsx'),
  register: () => import('./register-entry.jsx'),
  portal: () => import('./main.jsx'),
};

loaders[initialMode]();

