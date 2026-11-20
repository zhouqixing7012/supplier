export const embeddedPrototype = false;

const excludedRoutes = new Set(['page-map', 'scenes', 'components']);

export function readMobileRoute() {
  const hash = location.hash;
  if (!hash.startsWith('#/mobile/')) return 'query';
  const route = decodeURIComponent(hash.slice('#/mobile/'.length));
  return !route || route.startsWith('shot/') || excludedRoutes.has(route.split('?')[0]) ? 'query' : route;
}

export function readMobileSearch() {
  return readMobileRoute().split('?')[1] || '';
}

export function readPrototypeParams(route) {
  const params = new URLSearchParams(route.split('?')[1]);
  return params.get('map') === '1' ? Object.fromEntries(params) : {};
}

export function mobileStorage() {
  return localStorage;
}

export function mobileAsset(path) {
  return (import.meta.env?.BASE_URL ?? '/') + path;
}
