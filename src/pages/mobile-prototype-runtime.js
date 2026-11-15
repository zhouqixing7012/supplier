const inBrowser = typeof window !== 'undefined';
export const offlinePrototype = inBrowser && typeof window.__SUPPLIER_FRAME_DOCUMENT__ === 'function';
export const embeddedPrototype = inBrowser && (
  typeof window.__SUPPLIER_FRAME_ROUTE__ === 'string' || new URLSearchParams(location.search).has('prototype-node')
);

const routeFromLocation = () => decodeURIComponent(location.hash.replace(/^#\/mobile\/?/, '')) || 'query';
let frameRoute = embeddedPrototype ? (window.__SUPPLIER_FRAME_ROUTE__ ?? routeFromLocation()) : '';

export function readMobileRoute() {
  return embeddedPrototype ? frameRoute : offlinePrototype ? 'page-map' : routeFromLocation();
}

export function replaceFrameRoute(route) {
  frameRoute = route;
}

export function readMobileSearch() {
  return readMobileRoute().split('?')[1] || '';
}

const savedValues = new Map();
const frameStorage = {
  getItem: key => savedValues.get(key) ?? null,
  setItem: (key, value) => { savedValues.set(key, String(value)); },
  removeItem: key => { savedValues.delete(key); },
};

export function mobileStorage() {
  return embeddedPrototype ? frameStorage : localStorage;
}

export function mobileAsset(path) {
  const bundled = inBrowser && window.__SUPPLIER_MOBILE_ASSETS__?.[path];
  return bundled || (import.meta.env?.BASE_URL ?? '/') + path;
}
