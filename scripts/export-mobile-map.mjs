import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, join } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../', import.meta.url));
const mime = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};
const base64 = value => Buffer.from(value).toString('base64');

const result = await build({
  configFile: false,
  root,
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [
    react(),
    {
      name: 'mobile-map-current-pages',
      enforce: 'pre',
      resolveId(source) {
        if (source === './mobile-screenshot-compare.jsx') return '\0historical-screenshot-gallery';
      },
      load(id) {
        if (id === '\0historical-screenshot-gallery') return 'export function ScreenshotCompare() { return null; }';
      },
    },
  ],
  build: {
    write: false,
    lib: { entry: join(root, 'src/mobile-entry.jsx'), name: 'SupplierMobilePrototype', formats: ['iife'] },
  },
});
const [bundle] = Array.isArray(result) ? result : [result];
const script = bundle.output.find(item => item.type === 'chunk').code;
const css = bundle.output.find(item => item.type === 'asset' && item.fileName.endsWith('.css')).source.toString();

const assets = {};
const assetRoot = join(root, 'public');
const workbench = await readdir(join(assetRoot, 'mobile-assets/workbench'));
const mobileFiles = [
  'sohu-logo.png', 'mobile-assets/noto-sans-sc-400.woff2', 'mobile-assets/portal-city.png',
  'mobile-assets/portal-identity.svg', 'mobile-assets/supplier-document-demo.png',
  ...workbench.map(name => 'mobile-assets/workbench/' + name),
];
for (const name of mobileFiles) {
  const type = mime[extname(name)];
  if (type) assets[name] = [type, base64(await readFile(join(assetRoot, name)))];
}

// 资源只打包一次，多张原型页共用 URL，各自加载独立应用实例。
const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>供应商移动端交互原型</title>
<div id="root"></div>
<noscript>请在浏览器中开启 JavaScript 后打开交互原型。</noscript>
<script>
  const bytes = value => Uint8Array.from(atob(value), symbol => symbol.charCodeAt(0));
  const resource = (type, content) => URL.createObjectURL(new Blob([content], { type }));
  const urls = Object.fromEntries(Object.entries(${JSON.stringify(assets)})
    .map(([name, [type, data]]) => [name, resource(type, bytes(data))]));
  const stylesheet = new TextDecoder().decode(bytes("${base64(css)}")).replace(
    /url\\(["']?\\/(mobile-assets\\/[^)"']+)["']?\\)/g,
    (match, name) => urls[name] ? 'url("' + urls[name] + '")' : match,
  );
  const cssUrl = resource('text/css', stylesheet);
  const jsUrl = resource('text/javascript', bytes("${base64(script)}"));
  window.__SUPPLIER_MOBILE_ASSETS__ = urls;
  const serializedAssets = JSON.stringify(urls);
  const linkedStyle = '<link rel="stylesheet" href="' + cssUrl + '">';
  const scriptEnd = '</' + 'script>';
  window.__SUPPLIER_FRAME_DOCUMENT__ = route =>
    '<!doctype html><html lang="zh-CN"><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' + linkedStyle +
    '<div id="root"></div><script>window.__SUPPLIER_FRAME_ROUTE__=' + JSON.stringify(route) +
    ';window.__SUPPLIER_MOBILE_ASSETS__=' + serializedAssets + ';' + scriptEnd +
    '<script src="' + jsUrl + '">' + scriptEnd + '</html>';
  document.head.insertAdjacentHTML('beforeend', linkedStyle);
  const app = document.createElement('script');
  app.src = jsUrl;
  document.body.append(app);
</script>
</html>
`;
const out = join(root, 'dist');
await mkdir(out, { recursive: true });
await writeFile(join(out, 'supplier-mobile-interactive.html'), html);
