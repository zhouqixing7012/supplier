import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { mapRoutes, previewSize } from '../src/pages/mobile-page-map-data.js';

const origin = new URL(process.argv[2] || 'http://localhost:5173');
const { width, height, columns, rows } = previewSize;
const perSheet = columns * rows;
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN } : {}),
});
const capture = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
const atlasPage = await browser.newPage();
const output = new URL('../public/mobile-map/', import.meta.url);
const routes = mapRoutes();

try {
  await mkdir(output, { recursive: true });
  const pages = await Promise.all(Array.from({ length: 4 }, () => capture.newPage()));
  const captureFrame = async (page, route, index) => {
    const errors = [];
    const pageError = error => errors.push(error.message);
    page.on('pageerror', pageError);
    try {
      // 每张图都重新加载入口，避免上一个场景的演示状态干扰本张画面。
      await page.goto(new URL('/?map-frame=' + index + '#/mobile/' + route, origin).href);
      const scene = route.split('?')[0];
      // 邮件入口在未登录时按原型逻辑跳转到登录页。
      const visibleScene = scene === 'workspace-procurement' ? 'portal' : scene;
      const surface = page.locator('#root .mobile-page[data-scene="' + visibleScene + '"]');
      await surface.waitFor();
      await page.addStyleTag({ content: '.m-preview-nav, [data-review-ui] { display: none !important; }' });
      const panel = new URLSearchParams(route.split('?')[1]).get('panel');
      if (panel && panel !== 'password') {
        await surface.locator('.m-overlay, .m-fullscreen-panel').first().waitFor();
      }
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        window.scrollTo(0, 0);
        // 保留原型画面与字段名，导出中遮盖联系人、联系方式及证件和银行账号的值。
        const privateField = /邀请人|联系人姓名|审批人|代理人|法人代表|法定代表人|姓名|银行账号|银行账户号码|账号尾号|银行卡号|开户账号|证件号码|统一社会信用代码|邮箱|电话|手机|详细地址|注册地址/;
        const masked = value => '•'.repeat(Math.min(Math.max(value.length, 4), 12));
        for (const element of document.querySelectorAll('.mobile-page [data-field-label]')) {
          if (!privateField.test(element.dataset.fieldLabel)) continue;
          const input = element.querySelector('input:not([type=file]),textarea');
          if (input?.value) input.value = masked(input.value);
        }
        for (const row of document.querySelectorAll('.mobile-page .m-row, .mobile-page dl > div')) {
          const label = row.querySelector('.m-label, dt');
          const value = row.querySelector('.m-value, dd');
          if (label && value && privateField.test(label.textContent) && value.textContent.trim() && value.textContent.trim() !== '—') {
            value.textContent = masked(value.textContent.trim());
          }
        }
        const textNodes = document.createTreeWalker(document.querySelector('.mobile-page'), NodeFilter.SHOW_TEXT);
        while (textNodes.nextNode()) {
          const text = textNodes.currentNode;
          if (text.parentElement.closest('svg,script,style')) continue;
          text.nodeValue = text.nodeValue
            .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, value => masked(value))
            .replace(/1[3-9]\d{9}/g, value => masked(value))
            .replace(/\b\d{12,19}[0-9X]?\b/g, value => masked(value));
        }
      });
      if (errors.length) throw new Error(errors.join(' / '));
      const screenshot = await page.screenshot({ animations: 'disabled', caret: 'hide' });
      process.stdout.write('已截图 ' + route + '\n');
      return screenshot.toString('base64');
    } finally {
      page.off('pageerror', pageError);
    }
  };

  const captures = [];
  const hashes = new Map();
  const index = {};
  for (let i = 0; i < routes.length; i += pages.length) {
    const batch = routes.slice(i, i + pages.length);
    const tiles = await Promise.all(batch.map((route, p) => captureFrame(pages[p], route, i + p)));
    for (const [position, tile] of tiles.entries()) {
      const hash = createHash('sha256').update(tile).digest('hex');
      if (!hashes.has(hash)) {
        hashes.set(hash, captures.length);
        captures.push(tile);
      }
      index[batch[position]] = hashes.get(hash);
    }
  }

  for (let i = 0; i < captures.length; i += perSheet) {
    const tiles = captures.slice(i, i + perSheet);
    const atlas = await atlasPage.evaluate(async ({ tiles, width, height, columns, rows }) => {
      const canvas = document.createElement('canvas');
      canvas.width = columns * width;
      canvas.height = rows * height;
      const context = canvas.getContext('2d');
      for (const [index, tile] of tiles.entries()) {
        const blob = await (await fetch('data:image/png;base64,' + tile)).blob();
        const image = await createImageBitmap(blob);
        context.drawImage(image, (index % columns) * width, Math.floor(index / columns) * height);
        image.close();
      }
      return canvas.toDataURL('image/webp', 0.84).split(',')[1];
    }, { tiles, width, height, columns, rows });
    await writeFile(new URL('preview-' + (i / perSheet) + '.webp', output), Buffer.from(atlas, 'base64'));
  }
  await writeFile(new URL('../src/pages/mobile-page-map-index.json', import.meta.url), JSON.stringify(index, null, 2) + '\n');
} finally {
  await browser.close();
}
