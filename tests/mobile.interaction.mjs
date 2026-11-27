import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
let runtime;
try { runtime = await import('playwright'); } catch (error) { if (!process.env.PLAYWRIGHT_MODULE) throw error; runtime = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href); }
const { chromium } = runtime;
import { screenshotScenes } from '../src/pages/mobile-data.js';

// 在生产构建上验证任务路径；演示数据只存在于浏览器会话。
const root = path.resolve('dist');
const output = path.resolve(process.env.MOBILE_TEST_OUTPUT || 'test-output/mobile-interaction');
await fs.mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (requested === '/' ? '/index.html' : requested));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
let browser;
const results = [];
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN, args: ['--no-sandbox', '--no-zygote', '--single-process', '--disable-gpu', '--no-proxy-server', '--use-gl=angle', '--use-angle=swiftshader'] } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 845 }, hasTouch: true, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  let errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
  let navigation = 0;
  async function goto(route) { await page.goto(base + '/?case=' + (++navigation) + '#/' + route); await page.locator('#root .mobile-page, .auth-shell, .register-page').first().waitFor(); await page.evaluate(() => document.fonts.ready); }
  async function check(name, fn) {
    if (process.env.MOBILE_CASE_FILTER && !new RegExp(process.env.MOBILE_CASE_FILTER).test(name)) return;
    errors = [];
    try { await fn(); assert.equal(errors.length, 0, errors.join('\n')); results.push({ name, passed: true }); }
    catch (e) { results.push({ name, passed: false, error: e.message }); await page.screenshot({ path: path.join(output, 'failure-' + results.length + '.png') }).catch(() => {}); }
    console.log((results.at(-1).passed ? 'PASS ' : 'FAIL ') + name);
  }
  const button = name => page.locator('#root').getByRole('button', { name, exact: true });
  const field = name => page.locator('#root').getByRole(name.startsWith('搜索') || name === '请输入人员姓名' ? 'searchbox' : 'textbox', { name, exact: true });
  const headerBack = () => page.locator('#root .mobile-page > .m-header').getByRole('button', { name: '返回', exact: true }).click();
  const card = name => page.locator('#root .m-supplier-card').filter({ hasText: name });
  async function action(name, label) { await card(name).getByRole('button', { name: '更多操作', exact: true }).click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: label, exact: true }).click(); }
  async function rate(label, value) { const control = button(label + ' ' + Math.ceil(value) + '星'); const box = await control.boundingBox(), star = await control.locator('.m-star-slot').boundingBox(); await control.click({ position: { x: star.x - box.x + star.width * (Number.isInteger(value) ? .75 : .25), y: star.y - box.y + star.height / 2 } }); }
  async function dateValue(label, value) { await page.locator('#root').getByRole('listbox', { name: label, exact: true }).getByRole('option', { name: value + label, exact: true }).click(); }
  async function choose(label, value) { await page.locator('#root').getByRole('combobox', { name: label, exact: true }).click(); await page.locator('#root').getByRole('dialog').locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click(); }
  async function shot(name) { await page.evaluate(() => { scrollTo(0, 0); document.querySelectorAll('.m-fullscreen-panel').forEach(n => { n.scrollTop = 0; }); }); await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true, timeout: 15000 }); }
  async function swipe(target, dx, dy = 0, x = 270) {
    await target.evaluate((el, p) => {
      const rect = el.getBoundingClientRect();
      const y = Math.max(150, Math.min(500, rect.top + 100));
      const t = new Touch({ identifier: 1, target: el, clientX: p.x, clientY: y });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [t], changedTouches: [t] }));
      const end = new Touch({ identifier: 1, target: el, clientX: p.x + p.dx, clientY: y + p.dy });
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }));
    }, { dx, dy, x });
  }
  async function touchGesture(client, { x, y, dx = 0, dy = 0, hold = 0 }) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    if (dx || dy) {
      for (const fraction of [.25, .5, .75, 1]) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove',
          touchPoints: [{ x: x + dx * fraction, y: y + dy * fraction }] });
      }
    }
    if (hold) await new Promise(resolve => setTimeout(resolve, hold));
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  const upload = { name: '测试证明.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') };
  async function fillBasic(name = '移动交互测试企业') {
    await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload);
    for (const [label, value] of [['供应商名称', name], ['注册邮箱', 'mobile@example.com'], ['统一社会信用代码', 'MOBILE-TEST-001'], ['法人代表', '测试法人'], ['公司电话', '010-12345678'], ['注册资金', '100'], ['经营范围', '交互测试'], ['与搜狐合作事项', '合作测试'], ['经营优势及业务优势', '服务测试']]) await field(label).fill(value);
    for (const label of ['成立日期', '证件有效期至']) { await button(label).click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); }
    for (const [label, value] of [['企业类型', '有限责任公司'], ['所属行业', '文化、体育、娱乐业'], ['注册币种', '人民币'], ['国家', '国内']]) await choose(label, value);
    await button('注册地址').click();
    for (const value of ['北京市', '北京市', '朝阳区']) await page.locator('#root .m-sheet-options').getByRole('button', { name: value, exact: true }).click();
    await field('详细地址').fill('移动测试地址'); await button('确定').click();
  }
  async function fillBank(accountType = '基本账户') {
    await choose('账户类型', accountType);
    await button('开户银行').click(); await page.locator('#root .m-reference-card').filter({ hasText: '中国农业发展银行' }).first().click(); 
    await button('银行分行').click(); await page.locator('#root .m-reference-card').filter({ hasText: '北京市分行' }).click(); 
    await field('账户名称').fill('移动交互测试企业'); await field('银行账号').fill('001234567890'); await choose('币种', '人民币'); await page.locator('#root').getByLabel('开户证明', { exact: true }).setInputFiles(upload);
  }
  await check('站点默认进入移动管理平台，窄屏可进入协同门户', async () => {
    await page.setViewportSize({ width: 390, height: 845 });
    await page.goto(base + '/');
    await page.locator('#root [data-scene="query"]').waitFor();
    const navigation = page.getByLabel('原型导航');
    const portalLink = navigation.getByRole('link', { name: '协同门户移动端', exact: true });
    const review = page.getByRole('switch', { name: '需求评审', exact: true });
    await portalLink.waitFor();
    assert.equal(await review.count(), 0);
    assert.equal(await navigation.getByText('演示数据', { exact: true }).count(), 0);
    await button('我的邀请').click();
    await portalLink.click();
    await page.locator('#root [data-scene="portal"]').waitFor();
    assert.equal(await review.count(), 0);
    assert.equal(await portalLink.count(), 0);
    const management = navigation.getByRole('link', { name: '移动端管理平台', exact: true });
    await management.click();
    await page.locator('#root [data-scene="query"]').waitFor();
    await goto('mobile/workspace-home');
    await management.click();
    await page.locator('#root [data-scene="query"]').waitFor();
  });
  await check('桌面原型保留电脑端入口与原图对照', async () => {
    await page.setViewportSize({ width: 1100, height: 900 });
    try {
      await page.goto(base + '/#/');
      await page.locator('#root [data-scene="query"]').waitFor();
      const navigation = page.getByLabel('原型导航');
      assert.ok(await navigation.getByRole('link', { name: '协同门户移动端', exact: true }).isVisible());
      const comparison = page.getByRole('switch', { name: /原图对照/ });
      await comparison.click();
      const [prototype, capsule] = await Promise.all([
        page.locator('#root .mobile-page').boundingBox(),
        page.locator('#root .m-list-registration-actions').boundingBox(),
      ]);
      assert.equal(Math.round(capsule.width), 304);
      assert.ok(Math.abs(capsule.x + capsule.width / 2 - prototype.x - prototype.width / 2) < 1);
      await comparison.click();
      await navigation.getByRole('link', { name: '电脑端', exact: true }).click();
      await page.waitForURL('**/#/admin/suppliers');
      await page.getByRole('link', { name: '搜狐供应商管理平台', exact: true }).waitFor();
    } finally {
      await page.setViewportSize({ width: 390, height: 845 });
    }
  });
  await check('移动端组件库独立加载公共样式并可预览表单', async () => {
    await goto('mobile/components');
    assert.equal(await page.getByRole('heading', { name: '移动端组件库' }).count(), 1);
    const catalog = page.locator('[data-scene="component-library"]');
    assert.equal(await catalog.locator('.m-catalog-nav').evaluate(el => getComputedStyle(el).display), 'flex');
    assert.equal(await catalog.locator('.m-header').evaluate(el => getComputedStyle(el).position), 'sticky');
    await button('表单').click();
    await button('校验名称').click();
    await page.getByRole('alert').filter({ hasText: '请填写供应商名称' }).waitFor();
    await page.getByRole('combobox', { name: '供应商类型' }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByRole('button', { name: '个人', exact: true }).click();
    assert.equal(await page.getByRole('combobox', { name: '供应商类型' }).textContent(), '个人');
  });
  await check('组件库地址逐级搜索并回填，取消编辑保留原值', async () => {
    await goto('mobile/components');
    await button('地址与目录').click();
    await button('注册地址').click();
    const sheet = page.getByRole('dialog', { name: '编辑注册地址', exact: true });
    await sheet.getByRole('searchbox', { name: '搜索省份' }).fill('北京');
    const regions = sheet.locator('.m-region-options');
    for (const name of ['北京市', '北京市', '朝阳区']) {
      await regions.getByRole('button', { name, exact: true }).click();
    }
    await sheet.getByRole('textbox', { name: '详细地址' }).fill('示例路 1 号');
    await sheet.getByRole('button', { name: '确定', exact: true }).click();
    assert.equal(await button('注册地址').innerText(), '北京市/北京市/朝阳区 示例路 1 号');
    await button('注册地址').click();
    await sheet.getByRole('textbox', { name: '详细地址' }).fill('放弃的输入');
    await sheet.getByRole('button', { name: '取消', exact: true }).click();
    await button('放弃修改').click();
    assert.equal(await button('注册地址').innerText(), '北京市/北京市/朝阳区 示例路 1 号');
  });
  await check('组件库评分可填写半星、放弃修改及查看只读星级', async () => {
    await goto('mobile/components');
    const categories = page.getByRole('navigation', { name: '组件分类' });
    await categories.getByRole('button', { name: '评分', exact: true }).click();
    const list = page.locator('#root .m-rating-list');
    await list.getByRole('button', { name: '评分', exact: true }).click();
    const editor = page.getByRole('dialog', { name: '填写供应商评分', exact: true });
    const first = editor.getByRole('slider').first();
    await first.press('ArrowRight');
    assert.equal(await first.getAttribute('aria-valuenow'), '0.5');
    await editor.getByRole('button', { name: '返回', exact: true }).click();
    await button('放弃修改').click();
    await list.getByRole('button', { name: '评分详情', exact: true }).click();
    const detail = page.getByRole('dialog', { name: '供应商评分详情', exact: true });
    assert.equal(await detail.locator('.m-half-star').count(), 2);
    assert.equal(await detail.getByRole('slider').count(), 0);
  });
  await check('组件库采购明细可带入税率并保存价税计算结果', async () => {
    await goto('mobile/components');
    await page.getByRole('navigation', { name: '组件分类' }).getByRole('button', { name: '采购明细', exact: true }).click();
    await field('税率（%）').fill('13');
    await button('编辑').click();
    const quote = page.getByRole('dialog', { name: '编辑报价明细', exact: true });
    assert.equal(await quote.getByRole('textbox', { name: '税率（%）', exact: true }).inputValue(), '13');
    await quote.getByLabel('报价附件', { exact: true }).setInputFiles(upload);
    await quote.getByRole('button', { name: '查看附件：测试证明.png', exact: true }).click();
    const preview = page.getByRole('dialog', { name: '查看附件', exact: true });
    await preview.getByRole('button', { name: '打开附件', exact: true }).click();
    await preview.getByRole('img', { name: '测试证明.png', exact: true }).waitFor();
    await preview.getByRole('button', { name: '关闭', exact: true }).click();
    await quote.getByRole('textbox', { name: '含税单价', exact: true }).fill('113');
    await quote.getByRole('button', { name: '确定', exact: true }).click();
    await quote.waitFor({ state: 'hidden' });
    await button('价税拆分').click();
    await button('编辑').click();
    const tax = page.getByRole('dialog', { name: '编辑价税明细', exact: true });
    await tax.getByRole('textbox', { name: '税率（%）', exact: true }).fill('13');
    assert.equal(await tax.getByRole('textbox', { name: '税额', exact: true }).inputValue(), '26.00');
    await tax.getByRole('button', { name: '确定', exact: true }).click();
    await tax.waitFor({ state: 'hidden' });
    assert.ok(await page.getByText('26.00', { exact: true }).isVisible());
  });
  await check('组件库批量操作共享底栏，混选拦截并可删除示例记录', async () => {
    await goto('mobile/components');
    await page.getByRole('navigation', { name: '组件分类' }).getByRole('button', { name: '批量操作', exact: true }).click();
    const footer = page.locator('#root .m-batch-actions');
    assert.ok(await footer.getByRole('button', { name: '删除', exact: true }).isDisabled());
    await footer.getByRole('checkbox', { name: '全选当前结果' }).check();
    assert.ok(await footer.getByText('已选 3 项').isVisible());
    await footer.getByRole('button', { name: '删除', exact: true }).click();
    const validation = page.getByRole('dialog', { name: '批量操作校验' });
    assert.ok(await validation.getByText('所选记录包含不可删除的状态。').isVisible());
    await validation.getByRole('button', { name: '知道了' }).click();
    await page.getByRole('checkbox', { name: '选择示例已审批供应商' }).uncheck();
    await footer.getByRole('button', { name: '删除', exact: true }).click();
    await page.getByRole('dialog', { name: '提示', exact: true }).getByRole('button', { name: '确认', exact: true }).click();
    await page.getByText('已删除所选示例供应商', { exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: '示例草稿供应商', exact: true }).count(), 0);
    await page.getByRole('checkbox', { name: '选择示例已审批供应商' }).check();
    await footer.getByRole('button', { name: '批量变更邀请人', exact: true }).click();
    const inviter = page.getByRole('dialog', { name: '选择新邀请人', exact: true });
    await inviter.getByRole('button', { name: '示例新邀请人', exact: true }).click();
    await inviter.getByRole('button', { name: '确认', exact: true }).click();
    await page.getByText('示例邀请人已更新为示例新邀请人', { exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: '示例已审批供应商', exact: true }).count(), 0);
  });
  for (const s of screenshotScenes) await check('原入口 ' + s.index + ' ' + s.title, async () => {
    await goto('mobile/shot/' + s.time);
    assert.equal(await page.locator('#root [data-scene="' + s.scene + '"]').count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '页面横向溢出');
    await shot('scene-' + s.time);
  });
  await check('管理平台三个菜单直接展示并可切换', async () => {
    await goto('mobile');
    const labels = ['供应商查询', '我的邀请', '我的评分'];
    const menu = page.locator('#root').getByRole('navigation', { name: '功能模块' });
    assert.deepEqual(await menu.getByRole('button').allTextContents(), labels);
    assert.equal(await button('全部标签').count(), 0);
    for (const [label, scene] of [['我的邀请', 'mine'], ['我的评分', 'my-ratings'], ['供应商查询', 'query']]) {
      await menu.getByRole('button', { name: label, exact: true }).click();
      await page.locator('#root [data-scene="' + scene + '"]').waitFor();
      assert.equal(await button('全部标签').count(), 0);
      const navigation = await menu.evaluate(el => {
        const bar = getComputedStyle(el.parentElement);
        const header = getComputedStyle(el.parentElement.previousElementSibling);
        const indicator = getComputedStyle(el.querySelector('.m-tab-indicator'));
        return { borders: [header.borderBottomWidth, bar.borderTopWidth, bar.borderBottomWidth], indicator: indicator.height };
      });
      assert.deepEqual(navigation.borders, ['0px', '0px', '0px']);
      assert.equal(navigation.indicator, '2px');
    }
  });
  await check('移动端原型导图可下载当前PRD', async () => {
    await page.goto(base + '/#/mobile/page-map');
    const link = page.getByRole('link', { name: '下载 PRD', exact: true });
    const file = new URL(await link.getAttribute('href'), base);
    const response = await page.request.get(file.href);
    assert.ok(response.ok());
    const body = await response.text();
    const currentPrd = await fs.readFile(new URL('../docs/supplier-mobile-prd.md', import.meta.url), 'utf8');
    assert.equal(body, currentPrd);
    const download = page.waitForEvent('download');
    await link.click();
    assert.equal((await download).suggestedFilename(), '供应商移动端PRD.md');
  });
  await check('移动端原型导图在各节点独立操作并可导出', async () => {
    await page.goto(base + '/?case=map-embed#/mobile/page-map');
    const query = page.frameLocator('iframe[title="供应商查询"]');
    const rootQuery = page.frameLocator('iframe[title="供应商管理平台"]');
    const connector = page.locator('.page-map-connector').first();
    assert.match(await connector.getAttribute('d'), /^M .* H .* V .* H /);
    assert.equal(await connector.evaluate(el => getComputedStyle(el).stroke), 'rgb(180, 35, 24)');
    await page.getByRole('button', { name: '放大供应商查询', exact: true }).click();
    const search = query.getByRole('searchbox').first();
    await search.fill('代注册草稿');
    assert.equal(await rootQuery.getByRole('searchbox').first().inputValue(), '');

    await page.getByRole('button', { name: '收起供应商管理平台', exact: true }).evaluate(el => el.click());
    await page.getByRole('button', { name: '展开供应商管理平台', exact: true }).evaluate(el => el.click());
    assert.equal(await search.inputValue(), '代注册草稿');

    await page.getByRole('button', { name: '放大供应商查询', exact: true }).evaluate(el => el.click());
    await query.getByRole('button', { name: '我的邀请', exact: true }).click();
    await query.locator('#root > [data-scene="mine"]').waitFor();
    assert.equal(await rootQuery.locator('[data-scene="query"]').count(), 1);
    assert.match(page.url(), /#\/mobile\/page-map$/);
    await page.getByRole('button', { name: '展开供应商查询', exact: true }).evaluate(el => el.click());
    await page.getByRole('button', { name: '放大供应商筛选', exact: true }).first().evaluate(el => el.click());
    await page.frameLocator('iframe[title="供应商筛选"]').first().locator('#root > [data-scene="filter"]').waitFor();

    const exported = page.getByRole('link', { name: '导出交互原型' });
    const download = page.waitForEvent('download');
    await exported.click();
    assert.equal((await download).suggestedFilename(), '供应商移动端交互原型.html');
  });
  await check('移动端原型导图可单独打开普通员工查询', async () => {
    await page.goto(base + '/?case=map-employee#/mobile/page-map');
    const employee = page.frameLocator('iframe[title="普通员工 · 供应商查询"]');
    await page.getByRole('button', { name: '放大普通员工 · 供应商查询', exact: true }).click();
    await employee.getByRole('searchbox').first().waitFor();
    assert.equal(await employee.getByRole('button', { name: '批量操作', exact: true }).count(), 0);
  });
  await check('移动端原型导图导出的HTML断网可操作', async () => {
    const offline = await context.newPage();
    try {
      await context.setOffline(true);
      await offline.goto(new URL('../dist/supplier-mobile-interactive.html', import.meta.url).href);
      const query = offline.frameLocator('iframe[title="管理员 · 批量删除演示"]');
      await offline.getByRole('button', { name: '放大管理员 · 批量删除演示', exact: true }).click();
      await query.locator('.m-batch-actions').waitFor();
      assert.equal(await query.getByRole('checkbox', { name: '全选当前结果', exact: true }).count(), 0);
      assert.equal(await query.getByRole('button', { name: '导出供应商', exact: true }).count(), 0);
      await query.getByRole('button', { name: '我的邀请', exact: true }).click();
      await query.locator('#root > [data-scene="mine"]').waitFor();
      assert.equal(await query.getByRole('button', { name: '导出供应商', exact: true }).count(), 0);
      await query.locator('.m-search img').first().evaluate(img => img.decode());
      assert.match(offline.url(), /^file:/);
    } finally {
      await offline.close();
      await context.setOffline(false);
    }
  });
  await check('主模块内容左滑切到我的邀请，右滑返回', async () => {
    await goto('mobile'); await swipe(page.locator('#root .m-supplier-card h3').first(), -130); await page.locator('#root [data-scene="mine"]').waitFor(); await swipe(page.locator('#root .m-supplier-card h3').first(), 130, 0, 100); await page.locator('#root [data-scene="query"]').waitFor();
  });
  await check('触摸列表空白处左右滑动切换三个主菜单', async () => {
    const client = await context.newCDPSession(page);
    try {
      await goto('mobile');
      const control = await page.locator('#root .m-supplier-card').first().locator('.m-card-actions button').last().boundingBox();
      await touchGesture(client, { x: control.x + control.width / 2, y: control.y + control.height / 2, dx: -100 });
      assert.ok(page.url().endsWith('#/mobile'));
      for (const [next, dx] of [['mine', -140], ['my-ratings', -140], ['mine', 140], ['query', 140]]) {
        const area = page.locator('#root .m-management-swipe');
        const point = await area.evaluate(el => {
          const card = el.querySelector('.m-supplier-card, .m-rating-list > article');
          const rect = (card || el).getBoundingClientRect();
          const y = card ? rect.bottom + 5 : rect.top + 100;
          const x = rect.left + rect.width / 2;
          const target = document.elementFromPoint(x, y);
          return { x, y, blank: el.contains(target) && !target?.closest('button,input,a,article') };
        });
        assert.ok(point.blank);
        await touchGesture(client, { ...point, dx });
        await page.locator(`#root [data-scene="${next}"]`).waitFor();
      }
    } finally {
      await client.detach();
    }
  });
  await check('纵向手势和边缘手势不误切模块', async () => {
    await goto('mobile'); await swipe(page.locator('#root .m-supplier-card h3').first(), -90, 140); assert.ok(page.url().endsWith('#/mobile')); await swipe(page.locator('#root .m-supplier-card h3').first(), 130, 0, 5); assert.ok(page.url().endsWith('#/mobile'));
  });
  await check('详情内容左右滑动，标签同步，输入控件不接管', async () => {
    await goto('mobile'); await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click();
    await swipe(page.locator('#root .m-detail .m-swipe-area').first(), -130); assert.equal(await page.locator('#root .m-detail [aria-current="page"]').innerText(), '基本信息');
    await swipe(page.locator('#root .m-detail .m-swipe-area').first(), 130, 0, 100); assert.equal(await page.locator('#root .m-detail [aria-current="page"]').innerText(), '注册信息'); await shot('detail');
  });
  await check('查询详情返回保留关键词及滚动位置', async () => {
    await goto('mobile'); await page.locator('#root').getByRole('searchbox', { name: '搜索供应商名称' }).fill('北京'); await page.evaluate(() => scrollTo(0, 300)); const y = await page.evaluate(() => scrollY); await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click(); await headerBack(); await page.locator('#root [data-scene="query"]').waitFor(); assert.equal(await page.locator('#root').getByRole('searchbox', { name: '搜索供应商名称' }).inputValue(), '北京'); assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 90);
  });
  await check('从第十五家供应商详情通过页内和系统返回恢复原位置', async () => {
    for (const [scene, returnToList] of [['query', headerBack], ['mine', () => page.goBack()]]) {
      await goto('mobile/' + scene);
      const item = page.locator('#root .m-supplier-list .m-supplier-card').nth(14);
      const name = await item.locator('h3').innerText();
      await item.evaluate(el => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 220));
      const detailButton = item.getByRole('button', { name: '查看详情', exact: true });
      const y = await page.evaluate(() => window.scrollY);
      assert.ok(y > 1000);
      await detailButton.click();
      await page.locator('#root [data-scene="detail"]').waitFor();
      await returnToList();
      await page.locator(`#root [data-scene="${scene}"]`).waitFor();
      assert.equal(await item.locator('h3').innerText(), name);
      assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - y) < 2);
    }
  });
  await check('长按供应商名称写入剪贴板，轻触和滑动不复制', async () => {
    const client = await context.newCDPSession(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    try {
      for (const scene of ['query', 'mine']) {
        await goto('mobile/' + scene);
        const name = page.locator('#root .m-copy-supplier-name').first();
        const value = await name.innerText();
        const box = await name.boundingBox();
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const previous = '原有剪贴板内容';
        await page.evaluate(text => navigator.clipboard.writeText(text), previous);
        await touchGesture(client, point);
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), previous);
        await touchGesture(client, { ...point, dy: -55, hold: 560 });
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), previous);
        await page.evaluate(() => scrollTo(0, 0));
        await name.waitFor();
        await touchGesture(client, { ...point, hold: 560 });
        await page.locator('#root .m-toast').getByText('已复制', { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), value);
      }
    } finally {
      await context.clearPermissions();
      await client.detach();
    }
  });
  await check('我的邀请字段直接展示且详情返回保持来源', async () => {
    await goto('mobile/mine'); assert.ok(await card('代注册草稿').getByText('联系人邮箱', { exact: true }).isVisible()); await card('代注册草稿').getByRole('button', { name: '查看详情', exact: true }).click(); await headerBack(); await page.locator('#root [data-scene="mine"]').waitFor();
  });
  await check('个人供应商从两个列表进入均展示注册信息，列表和详情隐藏邀请单号', async () => {
    for (const route of ['mobile', 'mobile/mine']) {
      await goto(route);
      const supplier = card('夏知远');
      assert.ok(await supplier.isVisible());
      assert.equal(await supplier.getByText(/邀请单号|MOCK-INV-P142/).count(), 0);
      await supplier.getByRole('button', { name: '查看详情', exact: true }).click();
      const detail = page.locator('#root .m-supplier-detail');
      assert.equal(await detail.locator('[aria-current="page"]').innerText(), '注册信息');
      assert.equal(await detail.getByRole('button', { name: '联系人信息', exact: true }).count(), 0);
      assert.deepEqual(await detail.locator('.m-section .m-label').allTextContents(),
        ['供应商账号', '邀请人', '邀请时间', '曾用名', '注册邮箱']);
      assert.ok(await detail.getByText('person-passport@example.invalid', { exact: true }).isVisible());
      assert.equal(await detail.getByText(/邀请单号|MOCK-INV-P142/).count(), 0);
      await button('基本信息').click();
      assert.ok(await detail.getByText('护照', { exact: true }).isVisible());
    }
  });
  await check('两个列表用完整机构类型名称筛选并回填', async () => {
    for (const route of ['mobile', 'mobile/mine']) {
      await goto(route);
      const type = page.locator('#root').getByRole('combobox', { name: '供应商类型', exact: true });
      await button('筛选供应商').click();
      await choose('供应商类型', '政府机构或社团');
      assert.equal(await type.innerText(), '政府机构或社团');
      await button('应用筛选').click();
      const cards = page.locator('#root .m-supplier-card');
      assert.equal(await cards.count(), 2);
      await card('澄川公共文化服务中心').waitFor();
      await card('松原青年艺术交流协会').waitFor();
      await button('筛选供应商').click();
      assert.equal(await type.innerText(), '政府机构或社团');
    }
  });
  await check('供应商筛选提示、高亮、回填并清除条件', async () => {
    for (const route of ['mobile', 'mobile/mine']) {
      await goto(route);
      const cards = page.locator('#root .m-supplier-card');
      const total = await cards.count();
      const filterIcon = button('筛选供应商').locator('img');
      const notice = page.locator('#root .m-filter-notice');
      await button('筛选供应商').click();
      await choose('供应商状态', '草稿');
      await button('应用筛选').click();
      assert.equal(await cards.count(), 3);
      assert.equal(await page.locator('#root').getByRole('region', { name: '查询结果' }).locator('.m-result-count').innerText(), '共 3 家供应商');
      assert.equal(await notice.getByRole('status').innerText(), '已应用1项条件');
      assert.match(await filterIcon.getAttribute('src'), /filter-active\.svg$/);
      assert.deepEqual(await filterIcon.evaluate(img => [img.naturalWidth, img.naturalHeight]), [24, 24]);
      assert.equal(await notice.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(229, 241, 255)');
      await button('筛选供应商').click();
      assert.match(await page.locator('#root').getByRole('combobox', { name: '供应商状态', exact: true }).innerText(), /草稿/);
      await button('重置').click();
      await button('应用筛选').click();
      assert.equal(await cards.count(), total);
      assert.equal(await notice.count(), 0);
      await field('搜索供应商名称').fill('草稿');
      await button('筛选供应商').click();
      await choose('供应商状态', '草稿');
      await button('应用筛选').click();
      await button('清除条件').click();
      assert.equal(await field('搜索供应商名称').inputValue(), '草稿');
      assert.equal(await notice.count(), 0);
      assert.match(await filterIcon.getAttribute('src'), /\/filter\.svg$/);
    }
  });
  await check('滚动供应商列表时结果栏吸顶且批量操作可用', async () => {
    const root = page.locator('#root');
    try {
      for (const [scene, width] of [['query', 320], ['mine', 390], ['query', 1100]]) {
        await page.setViewportSize({ width, height: 845 });
        await goto('mobile/' + scene);
        if (width === 1100) await page.getByRole('switch', { name: /原图对照/ }).click();
        const toolbar = root.getByRole('region', { name: '查询结果' });
        const tabs = root.locator('.mobile-page > .m-tab-bar');
        const count = await toolbar.locator('.m-result-count').innerText();
        const initial = await toolbar.boundingBox();
        for (const scroll of [420, 810]) {
          await page.evaluate(y => scrollTo(0, y), scroll);
          const [barBox, tabBox] = await Promise.all([toolbar.boundingBox(), tabs.boundingBox()]);
          assert.ok(barBox.y < initial.y);
          assert.ok(Math.abs(barBox.y - tabBox.y - tabBox.height) < 1);
          assert.equal(await toolbar.locator('.m-result-count').innerText(), count);
        }
        await toolbar.getByRole('button', { name: '批量操作', exact: true }).click();
        await root.locator('.m-batch-actions').waitFor();
        await toolbar.getByRole('button', { name: '取消批量操作', exact: true }).click();
        await root.locator('.m-batch-actions').waitFor({ state: 'hidden' });
      }
    } finally {
      await page.setViewportSize({ width: 390, height: 845 });
    }
  });
  await check('查询列表滚动追加、顶部刷新和短拉取消', async () => {
    await page.setViewportSize({ width: 390, height: 845 });
    await goto('mobile/query');
    const root = page.locator('#root');
    const cards = root.locator('.m-supplier-card');
    const firstPage = await cards.locator('h3').allInnerTexts();
    const total = Number(await root.locator('.m-result-count-value').innerText());
    assert.ok(firstPage.length > 0 && firstPage.length < total);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await root.getByText('已加载全部', { exact: true }).waitFor();
    const all = await cards.locator('h3').allInnerTexts();
    assert.equal(all.length, total);
    assert.equal(new Set(all).size, total);
    assert.deepEqual(all.slice(0, firstPage.length), firstPage);
    assert.equal(await button('加载更多').count(), 0);
    const appended = cards.nth(firstPage.length);
    await appended.evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 220));
    const scroll = await page.evaluate(() => scrollY);
    await appended.getByRole('button', { name: '查看详情', exact: true }).click();
    await root.locator('[data-scene="detail"]').waitFor();
    await headerBack();
    await root.locator('[data-scene="query"]').waitFor();
    assert.equal(await cards.count(), total);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - scroll) < 2);
    await page.evaluate(() => scrollTo(0, 0));
    const cdp = await context.newCDPSession(page);
    const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type,
      touchPoints: y === undefined ? [] : [{ x: 190, y }] });
    const spinner = root.locator('.m-list-refresh-spinner');
    await touch('touchStart', 320);
    await touch('touchMove', 350);
    await root.getByText('下拉刷新', { exact: true }).waitFor();
    assert.equal(await spinner.count(), 0);
    await touch('touchEnd');
    assert.equal(await cards.count(), total);
    await touch('touchStart', 320);
    await touch('touchMove', 355);
    await touch('touchMove', 418);
    await root.getByText('松开刷新', { exact: true }).waitFor();
    await touch('touchEnd');
    await spinner.waitFor();
    assert.equal(await spinner.evaluate(el => getComputedStyle(el).animationName), 'm-spinner-turn');
    assert.equal(await root.locator('.m-list-refresh').innerText(), '正在刷新…');
    await root.locator('.m-list-refresh').waitFor({ state: 'hidden' });
    assert.deepEqual(await cards.locator('h3').allInnerTexts(), firstPage);
    await cdp.detach();
  });
  await check('下拉刷新从搜索框下方触发，搜索和筛选位置稳定', async () => {
    const root = page.locator('#root');
    const client = await context.newCDPSession(page);
    const routes = ['mobile/query', 'mobile/mine', 'mobile/ratings', 'mobile/my-ratings',
      'mobile/rating-ops', 'mobile/workspace-tasks?map=1&tab=0', 'mobile/workspace-tasks?map=1&tab=2'];
    try {
      for (const route of routes) {
        await goto(route);
        const queryBar = root.locator(route === 'mobile/rating-ops'
          ? '.m-filter-summary:has([aria-label="筛选评分运维"])' : '.m-search-row');
        const idle = await queryBar.boundingBox();
        const refresh = root.locator('.m-list-refresh');
        await touchGesture(client, { x: page.viewportSize().width / 2, y: idle.y + 4, dy: 100 });
        assert.equal(await refresh.count(), 0, route);

        const content = await root.locator('.m-query-list h3, .m-query-list .m-empty').first().boundingBox();
        const x = content.x + Math.min(content.width / 2, 60);
        const y = content.y + content.height / 2;
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 34 }] });
        await root.getByText('下拉刷新', { exact: true }).waitFor();
        assert.deepEqual(await queryBar.boundingBox(), idle, route);
        assert.ok((await refresh.boundingBox()).y >= idle.y + idle.height, route);
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 90 }] });
        await root.getByText('松开刷新', { exact: true }).waitFor();
        assert.deepEqual(await queryBar.boundingBox(), idle, route);
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await refresh.waitFor({ state: 'hidden' });
        assert.deepEqual(await queryBar.boundingBox(), idle, route);
      }
    } finally {
      await client.detach();
    }
  });
  await check('审批仅展示纵向节点，审批意见直接可见', async () => {
    await goto('mobile/approval'); assert.equal(await page.locator('#root .m-approval > .m-section:first-of-type .m-approval-timeline li').count(), 4); assert.equal(await page.locator('#root .m-approval table').count(), 0); assert.equal(await page.locator('#root .m-approval > .m-section:first-of-type .m-approval-timeline summary').count(), 0); assert.equal(await page.locator('#root .m-approval > .m-section:first-of-type .m-approval-timeline .m-row').filter({ hasText: '审批意见' }).count(), 4); await shot('approval');
  });
  await check('注册审批显示完整登记资料，首节点填写付款公司', async () => {
    const approval = 'mobile/registration-approval-demo?map=1';
    await goto(approval);
    assert.match(await page.locator('#root').innerText(), /IDMOCK000120/);
    assert.match(await page.locator('#root').innerText(), /身份证正面照片.*身份证反面照片/s);
    assert.equal(await page.locator('#root .m-bank-card').count(), 1);
    await goto(approval + '&record=mock-enterprise-technology');
    const content = page.locator('#root [data-scene="registration-approval-demo"]');
    assert.match(await content.innerText(), /信息技术服务资质.*沈知柯.*郁兰.*基本账户.*一般账户/s);
    assert.equal(await content.getByText('归属部门', { exact: true }).count(), 0);
    assert.equal(await content.getByText('所属权限', { exact: true }).count(), 0);
    await button('同意').click();
    assert.ok(await content.getByRole('alert').filter({ hasText: '请选择付款公司' }).isVisible());
    await button('付款公司').click();
    const picker = page.locator('#root').getByRole('dialog');
    await picker.getByRole('button', { name: '演示付款公司', exact: true }).click();
    await picker.getByRole('button', { name: '确认', exact: true }).click();
    await button('同意').click();
    assert.equal(await button('付款公司').count(), 0);
    assert.match(await content.innerText(), /当前节点\s*领导审批/);
    await field('审批意见').fill('申请资料需补充');
    await button('驳回').click();
    assert.match(await content.innerText(), /审批驳回.*申请资料需补充/s);
  });
  await check('帮助可通过点击查看，日期初始化今天，长期可选', async () => {
    await goto('mobile/bank-form'); await button('开户银行填写说明').click(); await page.locator('#root').getByRole('dialog', { name: '开户银行填写说明' }).waitFor(); await button('知道了').click();
    await goto('mobile/register'); await button('证件有效期至').click(); assert.equal((await page.locator('#root').getByRole('listbox', { name: '年', exact: true }).getByRole('option', { selected: true }).innerText()).replace('年', ''), String(new Date().getFullYear())); await button('长期').click(); assert.ok((await button('证件有效期至').innerText()).includes('长期'));
  });
  await check('空分行和人员搜索提示与能力一致', async () => {
    await goto('mobile/inviter'); await button('新邀请人').click(); await page.locator('#root').getByText('请输入姓名搜索人员', { exact: true }).waitFor(); await page.locator('#root').getByRole('searchbox', { name: '搜索姓名或工号' }).fill('不存在的姓名'); await page.locator('#root').getByText('没有匹配结果，请调整关键词', { exact: true }).waitFor(); await shot('people-empty');
  });
  await check('表单未保存返回可继续编辑或放弃', async () => {
    await goto('mobile/invite'); await field('供应商名称').fill('尚未保存'); await headerBack(); await button('继续编辑').click(); assert.equal(await field('供应商名称').inputValue(), '尚未保存'); await headerBack(); await button('放弃修改').click(); await page.locator('#root [data-scene="query"]').waitFor();
  });
  await check('邀请注册校验后可提交并重新邀请', async () => {
    await goto('mobile');
    await button('邀请注册').click();
    await choose('供应商类型', '企业供应商');
    const supplierName = '移动邀请表单测试';
    for (const [label, value] of [['供应商名称', supplierName], ['联系人姓名', '表单联系人'], ['邮箱', 'invite@example.invalid'], ['手机号', '123']]) {
      await field(label).fill(value);
    }
    await button('提交').click();
    await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === '手机号');
    assert.equal(await field('手机号').getAttribute('aria-invalid'), 'true');
    await field('手机号').fill('13800000022');
    await button('提交').click();
    await page.locator('#root [data-scene="mine"]').waitFor();
    assert.match(await card(supplierName).innerText(), /邀请中.*invite@example.invalid/s);
    await action('代注册草稿', '重新邀请');
    assert.equal(await field('供应商名称').inputValue(), '代注册草稿');
    for (const [label, value] of [['联系人姓名', '重新邀请联系人'], ['邮箱', 'reinvite@example.invalid'], ['手机号', '13800000023']]) {
      await field(label).fill(value);
    }
    await button('提交').click();
    await page.locator('#root [data-scene="mine"]').waitFor();
    assert.match(await card('代注册草稿').innerText(), /邀请中.*13800000023/s);
    assert.equal(await card('代注册草稿').count(), 1);
  });
  await check('系统返回先关闭选择层而非跳离填写页', async () => {
    await goto('mobile'); await button('邀请注册').click(); await page.locator('#root').getByRole('combobox', { name: '供应商类型', exact: true }).click(); await page.goBack(); await page.waitForURL(/#\/mobile\/invite$/); assert.equal(await page.locator('#root').getByRole('dialog').count(), 0); await page.goBack(); await page.locator('#root [data-scene="query"]').waitFor();
  });
  await check('系统返回未保存时继续编辑保留内容，再返回可放弃', async () => {
    await goto('mobile'); await button('邀请注册').click(); await field('供应商名称').fill('系统返回检查'); await page.goBack(); await button('继续编辑').click(); assert.equal(await field('供应商名称').inputValue(), '系统返回检查'); await headerBack(); await button('放弃修改').click(); await page.locator('#root [data-scene="query"]').waitFor();
  });
  await check('供应商查询和我的邀请使用悬浮胶囊注册入口', async () => {
    await goto('mobile/my-ratings');
    const ratingTabColor = await page.locator('#root .m-count-tabs > button.active')
      .evaluate(el => getComputedStyle(el).backgroundColor);
    const bar = page.locator('#root .m-list-registration-actions');
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 845 });
      for (const scene of ['query', 'mine']) {
        await goto('mobile/' + scene);
        await bar.waitFor();
        assert.deepEqual(await bar.getByRole('button').allInnerTexts(), ['代注册', '邀请注册']);
        assert.equal(await button('新增供应商').count(), 0);
        assert.equal(await bar.evaluate(el => getComputedStyle(el).borderRadius), '29px');
        const buttonStyles = await bar.getByRole('button').evaluateAll(buttons => buttons.map(el => {
          const { backgroundColor, color, borderRadius, columnGap } = getComputedStyle(el);
          return [backgroundColor, color, borderRadius, columnGap];
        }));
        assert.deepEqual(buttonStyles, [
          ['rgb(237, 244, 255)', 'rgb(20, 92, 255)', '22px', '4px'],
          [ratingTabColor, 'rgb(255, 255, 255)', '22px', '4px'],
        ]);
        const initialPosition = await bar.boundingBox();
        if (await button('加载更多').count()) {
          await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
          await page.locator('#root').getByText('已加载全部', { exact: true }).waitFor();
        }
        await page.evaluate(async () => {
          scrollTo(0, document.documentElement.scrollHeight);
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });
        await page.waitForFunction(y => {
          const footer = document.querySelector('#root .m-list-registration-actions');
          return !footer.classList.contains('m-registration-bar-away') && Math.abs(footer.getBoundingClientRect().top - y) < .5;
        }, initialPosition.y);
        const [footer, first, last, finalCard, prototype] = await Promise.all([
          bar.boundingBox(), bar.getByRole('button').first().boundingBox(), bar.getByRole('button').last().boundingBox(),
          page.locator('#root .m-supplier-list .m-supplier-card').last().boundingBox(),
          page.locator('#root .mobile-page').boundingBox(),
        ]);
        assert.ok(Math.abs(footer.y - initialPosition.y) < .5);
        assert.equal(Math.round(footer.y + footer.height), 829);
        assert.equal(Math.round(footer.height), 58);
        assert.equal(Math.round(footer.width), Math.min(304, prototype.width - 36));
        assert.ok(Math.abs(footer.x + footer.width / 2 - prototype.x - prototype.width / 2) < 1);
        assert.equal(Math.round(first.height), 44);
        assert.equal(Math.round(last.height), 44);
        assert.ok(Math.abs(first.width - last.width) < 1);
        assert.equal(Math.round(first.x - footer.x), 7);
        assert.equal(Math.round(last.x - first.x - first.width), 8);
        assert.equal(Math.round(footer.x + footer.width - last.x - last.width), 7);
        assert.equal(await bar.locator('button > svg[aria-hidden="true"]').count(), 2);
        assert.ok(footer.y - finalCard.y - finalCard.height >= 16);
        await button('批量操作').click();
        await bar.waitFor({ state: 'hidden' });
        await button('取消批量操作').click();
        await bar.waitFor();
      }
    }
    await page.setViewportSize({ width: 390, height: 845 });
    await goto('mobile/mine');
    await bar.getByRole('button', { name: '邀请注册' }).click();
    await page.locator('#root [data-scene="invite"]').waitFor();
    await headerBack();
    await bar.getByRole('button', { name: '代注册' }).click();
    await page.locator('#root [data-scene="register"]').waitFor();
    await headerBack();
    await page.locator('#root [data-scene="mine"]').waitFor();
  });
  await check('注册胶囊向下避让、停止或向上后恢复，批量操作栏保持固定', async () => {
    const bar = page.locator('#root .m-list-registration-actions');
    const visibleBar = page.locator('#root .m-list-registration-actions:not(.m-registration-bar-away)');
    try {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const scene of ['query', 'mine']) {
        await goto('mobile/' + scene);
        const restingY = (await bar.boundingBox()).y;
        await page.evaluate(async () => {
          scrollTo(0, 5);
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });
        assert.equal(await visibleBar.count(), 1);
        await page.evaluate(() => scrollTo(0, 450));
        await bar.locator('button[inert]').first().waitFor();
        assert.equal(await bar.evaluate(el => getComputedStyle(el).opacity), '0');
        assert.equal((await bar.boundingBox()).y, restingY);
        await visibleBar.waitFor();
        assert.equal((await bar.boundingBox()).y, restingY);
        await page.evaluate(() => scrollTo(0, 900));
        await bar.locator('button[inert]').first().waitFor();
        await page.evaluate(() => scrollTo(0, 700));
        await visibleBar.waitFor();
        assert.equal((await bar.boundingBox()).y, restingY);
        await button('批量操作').click();
        const batchBar = page.locator('#root .m-batch-actions');
        await batchBar.waitFor();
        const batchY = (await batchBar.boundingBox()).y;
        await page.evaluate(() => scrollTo(0, 1100));
        assert.equal((await batchBar.boundingBox()).y, batchY);
        assert.equal(await bar.count(), 0);
      }
    } finally {
      await page.emulateMedia({ reducedMotion: null });
    }
  });
  await check('注册胶囊居中短距离收起、淡出并可中途回弹', async () => {
    await goto('mobile/query');
    const bar = page.locator('#root .m-list-registration-actions');
    const resting = await bar.boundingBox();
    await page.evaluate(() => scrollTo(0, 450));
    await bar.locator('button[inert]').first().waitFor();
    const sample = await bar.evaluate(el => {
      const transitions = el.getAnimations();
      for (const transition of transitions) {
        transition.pause();
        transition.currentTime = 65;
      }
      const { x, y, width } = el.getBoundingClientRect();
      const { opacity } = getComputedStyle(el);
      for (const transition of transitions) transition.play();
      return { x, y, width, opacity: Number(opacity) };
    });
    assert.ok(sample.y > resting.y && sample.y < resting.y + 30);
    assert.ok(sample.width < resting.width && sample.width > resting.width * .95);
    assert.ok(Math.abs(sample.x + sample.width / 2 - resting.x - resting.width / 2) < .5);
    assert.ok(sample.opacity > 0 && sample.opacity < 1);
    await page.evaluate(() => scrollTo(0, 410));
    await bar.getByRole('button', { name: '邀请注册', exact: true }).waitFor();
    await page.waitForFunction(({ x, y, width }) => {
      const footer = document.querySelector('#root .m-list-registration-actions');
      const box = footer.getBoundingClientRect();
      return getComputedStyle(footer).opacity === '1'
        && Math.abs(box.x - x) < .5 && Math.abs(box.y - y) < .5 && Math.abs(box.width - width) < .5;
    }, resting);
  });
  await check('注册缺项定位首个字段且持续显示错误', async () => {
    await goto('mobile/register');
    await button('下一步（1/4）').click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '选择营业执照');
    assert.equal(await button('选择营业执照').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#root [data-field-label="营业执照"] .m-field-error').innerText(), '请上传营业执照');
  });
  await check('评分半分输入、类型切换取消保护及提交修改', async () => {
    await goto('mobile/my-ratings'); await button('未评分').click(); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '评分', exact: true }).click();
    for (const slider of await page.locator('#root').getByRole('slider').all()) await rate(await slider.getAttribute('aria-label'), 3.5); await page.locator('#root').getByRole('slider', { name: '人员/服务质量', exact: true }).press('ArrowRight'); assert.equal(await page.locator('#root').getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), '4'); await page.locator('#root').getByRole('slider', { name: '人员/服务质量', exact: true }).press('ArrowLeft');
    await choose('合作类型', '电子产品'); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.locator('#root').getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), '3.5');
    await shot('rating-edit'); await button('提交').click(); await page.locator('#root [data-scene="my-ratings"]').waitFor(); await button('全部').click(); await page.locator('#root .m-bank-card').filter({ hasText: '滴滴出行' }).first().getByRole('button', { name: '评分详情', exact: true }).click(); assert.equal(await page.locator('#root').getByRole('spinbutton').count(), 0); assert.ok((await page.locator('#root .mobile-page').innerText()).includes('3.5 / 5'));
  });
  await check('评分详情显示已保存的半星和整星，分项缺值显示横线', async () => {
    await goto('mobile/my-ratings');
    const cards = page.locator('#root .m-rating-list .m-bank-card');
    const detail = page.locator('#root .m-rating-dimension');
    await cards.filter({ hasText: '评分明细演示' }).getByRole('button', { name: '评分详情', exact: true }).click();
    assert.equal(await detail.count(), 5);
    assert.equal(await detail.locator('.m-star-slot').count(), 25);
    assert.equal(await detail.locator('.m-half-star').count(), 2);
    assert.deepEqual(await detail.locator('.m-rating-value').allTextContents(), ['4.5 / 5', '4 / 5', '3.5 / 5', '5 / 5', '4 / 5']);
    assert.equal(await detail.getByRole('button').count(), 0);
    assert.equal(await detail.getByRole('slider').count(), 0);
    await headerBack();
    await cards.filter({ hasText: '测试PR授权行' }).getByRole('button', { name: '评分详情', exact: true }).click();
    assert.equal(await detail.getByText('—', { exact: true }).count(), 5);
    assert.equal(await detail.locator('.m-star-slot').count(), 0);
  });
  await check('我的评分筛选保留状态和关键词，旧联系人部门条件不生效', async () => {
    await goto('mobile/my-ratings?person=不存在&department=不存在');
    assert.ok(await page.locator('#root .m-rating-list .m-bank-card').count() > 0);
    await button('未评分').click();
    const search = page.locator('#root').getByRole('searchbox', { name: '搜索供应商或合作事项' });
    await search.fill('滴滴');
    await button('筛选评分').click();
    assert.equal(await field('业务线联系人').count(), 0);
    assert.equal(await field('所属部门').count(), 0);
    const dates = page.getByRole('group', { name: '评分时间', exact: true });
    assert.deepEqual(await dates.getByRole('button').allInnerTexts(), ['选择开始日期', '选择结束日期']);
    assert.deepEqual(await dates.locator('label').evaluateAll(labels => labels.map(label => getComputedStyle(label).clipPath)), ['inset(50%)', 'inset(50%)']);
    await choose('合作类型', '技术服务');
    await button('应用筛选').click();
    await page.locator('#root [data-scene="my-ratings"]').waitFor();
    assert.equal(await search.inputValue(), '滴滴');
    assert.equal(await page.locator('#root .m-status-tabs .active > span').innerText(), '未评分');
    assert.ok(!/person=|department=/.test(page.url()));
    await button('筛选评分').click();
    assert.ok((await page.locator('#root').getByRole('combobox', { name: '合作类型', exact: true }).innerText()).includes('技术服务'));
    await button('重置').click();
    await button('应用筛选').click();
    assert.equal(await button('清除条件').count(), 0);
    await button('筛选评分').click();
    await choose('合作类型', '技术服务');
    await button('应用筛选').click();
    await page.locator('#root').getByText('已应用1项条件', { exact: true }).waitFor();
    assert.match(await button('筛选评分').locator('img').getAttribute('src'), /filter-active\.svg$/);
    await button('清除条件').click();
    assert.equal(await search.inputValue(), '滴滴');
    assert.equal(await page.locator('#root .m-status-tabs .active > span').innerText(), '未评分');
    await goto('mobile/rating-filter?return=ratings');
    assert.equal(await field('业务线联系人').count(), 1);
    assert.equal(await field('所属部门').count(), 1);
  });
  await check('权限编辑保存只是暂存，外层返回保护且正式详情不变', async () => {
    await goto('mobile/permissions'); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await choose('权限分类', '火车'); await button('保存此权限').click(); await page.locator('#root').getByLabel('变更状态：修改', { exact: true }).waitFor(); await headerBack(); await button('放弃修改').click(); await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click(); await button('分配权限').click(); assert.ok((await page.locator('#root .m-detail').innerText()).includes('飞机'));
  });
  await check('银行编辑取消保护、保存暂存、省市保留、提交不改原详情', async () => {
    await goto('mobile/bank'); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await field('备注').fill('待提交备注'); await page.locator('#root .m-fullscreen-panel > .m-header').getByRole('button', { name: '返回', exact: true }).click(); await button('继续编辑').click(); assert.equal(await field('备注').inputValue(), '待提交备注'); await button('保存此账户').click(); await page.locator('#root').getByLabel('变更状态：修改', { exact: true }).waitFor(); const changedBank = page.locator('#root .m-bank-change-card'); const changedBankField = changedBank.locator('.m-change-field-row').filter({ hasText: '备注' }); assert.equal(await changedBankField.count(), 1); assert.equal(await changedBankField.locator('.m-change-value-new').count(), 1); assert.equal(await changedBankField.locator('.m-change-value-old').count(), 1); const unchangedBankField = changedBank.locator('.m-change-field-row').filter({ hasText: '开户银行' }); assert.equal(await unchangedBankField.count(), 1); assert.equal(await unchangedBankField.locator('.m-change-value-normal').count(), 1); const actionRow = changedBank.locator('.m-card-actions'); const actionRowBox = await actionRow.boundingBox(), bankCardBox = await changedBank.boundingBox(); assert.equal(Math.round(actionRowBox.height), 51); assert.ok(bankCardBox.y + bankCardBox.height - actionRowBox.y - actionRowBox.height <= 1.1); assert.equal(await changedBank.evaluate(n => getComputedStyle(n).paddingBottom), '0px'); assert.equal(await actionRow.locator('button').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().height >= 44)), true); assert.equal(await changedBank.locator('.m-change-badge').evaluate(n => getComputedStyle(n).color), 'rgb(242, 125, 12)'); await button('提交变更').click(); await page.locator('#root [data-scene="query"]').waitFor(); await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click(); await button('银行信息').click(); assert.ok(!(await page.locator('#root .m-detail').innerText()).includes('待提交备注'));
  });
  await check('企业注册完整路径、单联系人编辑删除取消、银行编辑、预览直改', async () => {
    await goto('mobile/register'); await fillBasic(); await page.locator('#root').getByRole('button', { name: /下一步/ }).click(); await button('添加联系人').click(); await field('姓名').fill('移动联系人'); await field('电话').fill('13800138000'); await field('邮箱').fill('contact@example.com'); await button('保存联系人').click(); await button('删除联系人1').click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('编辑联系人1').click(); assert.equal(await field('姓名').inputValue(), '移动联系人'); await button('保存联系人').click(); await page.locator('#root').getByRole('button', { name: /下一步/ }).click();
    await button('添加银行').click(); await fillBank(); await shot('bank-editor'); await button('添加以上信息').click(); assert.ok((await page.locator('#root .m-register-banks').innerText()).includes('尾号7890')); await page.locator('#root').getByRole('button', { name: /下一步/ }).click(); await button('修改基本信息').click(); await field('法人代表').fill('修改后的法人'); await button('保存并返回预览').click(); await page.locator('#root .m-register-preview').waitFor(); assert.ok((await page.locator('#root .m-register-preview').innerText()).includes('修改后的法人')); await button('修改银行信息').click(); await page.locator('#root .m-register-banks .m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('开户所在省').inputValue(), '北京市'); await button('添加以上信息').click(); await button('保存并返回预览').click(); await shot('register-preview'); await button('提交').click(); await page.locator('#root [data-scene="mine"]').waitFor(); assert.ok((await card('移动交互测试企业').innerText()).includes('审批中'));
  });
  await check('草稿保存后重开，已审批修改全部信息取消不改变', async () => {
    await goto('mobile/register'); await fillBasic('保存草稿测试'); assert.equal(await button('保存草稿').count(), 0); await page.locator('#root').getByRole('button', { name: /下一步/ }).click(); await headerBack(); await headerBack(); await button('我的邀请').click(); await action('保存草稿测试', '修改'); assert.equal(await field('供应商名称').inputValue(), '保存草稿测试'); await headerBack(); await action('北京初然', '修改全部信息'); await field('供应商名称').fill('取消不保存'); await headerBack(); await button('放弃修改').click(); await page.locator('#root [data-scene="mine"]').waitFor(); assert.equal(await card('取消不保存').count(), 0);
  });
  await check('银行申请校验、结果回看、演示边界', async () => {
    await goto('mobile/bank-application'); await button('确认申请').click(); await button('提交').click(); assert.equal(await page.locator('[aria-invalid="true"]').count() > 0, true); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '银行名称'); for (const [label,value] of [['银行名称','申请测试银行'],['银行编码','MOCK-BANK-001'],['开户行(分行)名称','测试分行'],['开户行省','北京市'],['开户行市','北京市'],['申请说明','目录缺少此分行']]) await field(label).fill(value); await choose('国家/地区', '中国'); await button('提交').click(); await page.locator('#root').getByText('申请信息已暂存', { exact: true }).waitFor(); await shot('application-result'); await page.locator('#root .m-actions').getByRole('button', { name: '返回', exact: true }).click(); await button('查看本次申请').click(); await page.locator('#root').getByText('目录缺少此分行', { exact: true }).waitFor(); assert.equal(await page.locator('#root').getByText('未提交至真实审批服务，银行目录未更新。', { exact: true }).count(), 0);
  });
  await check('自选附件跨填写页预览及移除确认', async () => {
    await goto('mobile/bank'); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await page.locator('#root').getByLabel('开户证明', { exact: true }).setInputFiles(upload); await button('移除开户证明').click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('保存此账户').click(); await page.locator('#root').getByRole('button', { name: '测试证明.png', exact: true }).click(); await button('打开附件').click(); assert.ok(await page.locator('#root .m-attachment-full').isVisible());
  });
  await check('运维查询支持排除姓名，真实批量执行仍禁用', async () => {
    await goto('mobile/rating-ops'); assert.ok(await button('批量发起评分').isDisabled()); await button('筛选评分运维').click(); await page.locator('#root').getByRole('textbox', { name: '排除评分人' }).fill('甲#乙'); assert.equal(await page.locator('#root').getByRole('textbox', { name: '排除评分人' }).inputValue(), '甲\n乙'); await shot('rating-operations');
  });
  await check('首页入口及登录键盘语义、显示密码和验证码演示', async () => {
    await goto('mobile');
    await page.getByLabel('原型导航').getByRole('link', { name: '协同门户移动端', exact: true }).click();
    await field('账号').fill('演示随便填');
    const password = page.locator('#root').getByLabel('密码', { exact: true });
    await password.fill('123456');
    await button('显示密码').click();
    assert.equal(await password.getAttribute('type'), 'text');
    await field('验证码').fill('cbvs');
    await button('下一步').click();
    assert.equal(await field('邮箱验证码').getAttribute('inputmode'), 'numeric');
    await field('注册邮箱').fill('supplier@example.com');
    await button('发送验证码').click();
    await field('邮箱验证码').fill('123456');
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 0);
    await shot('portal-email');
    await button('登录').click();
    const workspace = page.locator('#root [data-scene="workspace-home"]');
    await workspace.getByText('协同门户演示供应商', { exact: true }).waitFor();
    await workspace.getByRole('button', { name: '供应商信息管理', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('#root .m-result-banner, #root .m-toast, #root .m-decision-confirm'));
  });
  await check('四类供应商表单及个人注册跳过联系人', async () => {
    for (const type of ['企业供应商', '个人供应商', '政府机构', '国外供应商']) {
      await goto('mobile/register'); await choose('供应商类型', type); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (type === '个人供应商') { assert.ok((await page.locator('#root .m-registration-steps').innerText()).includes('银行信息')); assert.ok(!(await page.locator('#root .m-registration-steps').innerText()).includes('联系人信息')); }
    }
  });
  await check('少量选项不强制搜索，长枚举保留搜索', async () => {
    await goto('mobile/register'); await page.locator('#root').getByRole('combobox', { name: '企业类型', exact: true }).click(); assert.equal(await page.locator('#root').getByRole('dialog').getByRole('searchbox').count(), 0); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await goto('mobile/permission-form'); await page.locator('#root').getByRole('combobox', { name: '所属权限', exact: true }).click(); assert.equal(await page.locator('#root').getByRole('dialog').getByRole('searchbox').count(), 1);
  });
  await check('折叠分组中的错误自动展开并定位', async () => {
    await goto('mobile/bank-form'); await button('开户银行信息').click(); await button('保存此账户').click(); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '开户银行'); assert.ok(await button('开户银行').isVisible());
  });
  await check('维护填写页和嵌套选择层隔离背景及键盘焦点', async () => {
    await goto('mobile/bank'); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); assert.ok(await page.locator('#root .m-bank-card').first().evaluate(n => !!n.closest('[inert]'))); await button('开户银行').click(); assert.ok(await page.locator('#root .m-fullscreen-panel').evaluate(n => n.inert || !!n.closest('[inert]') || [...n.children].some(c => c.inert))); await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))); await page.keyboard.press('Escape'); assert.equal(await page.locator('#root').getByRole('dialog').count(), 0);
  });
  await check('列表筛选和评分操作满足触控尺寸', async () => {
    await goto('mobile'); const filter = await button('筛选供应商').boundingBox(); assert.ok(filter.width >= 44 && filter.height >= 44); await goto('mobile/rating-edit'); for (const item of await page.locator('#root .m-star-control > span:first-child button').all()) { const rect = await item.boundingBox(); assert.ok(rect.width >= 44 && rect.height >= 44); }
  });
  await check('同名附件分别预览，普通账户删除不影响基本账户', async () => {
    await goto('mobile/bank');
    for (const number of ['000111', '000222']) { await button('添加银行账户').click(); await fillBank('一般账户'); await field('银行账号').fill(number); await button('保存此账户').click(); }
    const records = page.locator('#root .m-bank-card');
    await records.nth(0).getByRole('button', { name: '测试证明.png', exact: true }).click(); await button('打开附件').click(); const second = await page.locator('#root .m-attachment-full').getAttribute('src'); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
    await records.nth(1).getByRole('button', { name: '测试证明.png', exact: true }).click(); await button('打开附件').click(); const first = await page.locator('#root .m-attachment-full').getAttribute('src'); assert.notEqual(first, second); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
    await records.filter({ hasText: '基本账户' }).getByRole('button', { name: '删除', exact: true }).click(); await page.locator('#root').getByRole('dialog', { name: '银行删除校验', exact: true }).waitFor(); await button('知道了').click(); await records.nth(0).getByRole('button', { name: '删除', exact: true }).click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await records.count(), 2);
  });
  await check('横向步骤在320、390和430宽度完整显示', async () => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 845 }); await goto('mobile/register');
      const steps = page.locator('#root .m-registration-steps');
      assert.equal(await steps.locator('.m-steps-toggle').count(), 0);
      const items = await steps.locator('li').all();
      assert.equal(items.length, 4);
      const boxes = await Promise.all(items.map(item => item.boundingBox()));
      assert.ok(boxes.every(box => Math.abs(box.y - boxes[0].y) < 1));
      assert.ok(boxes.every((box, index) => index === 0 || box.x > boxes[index - 1].x));
      assert.ok((await steps.locator('[aria-current="step"]').innerText()).includes('基本信息'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await shot('horizontal-steps-' + width);
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('横向步骤前进和返回保留填写并更新完成状态', async () => {
    await goto('mobile/register-edit-all?map=1');
    const steps = page.locator('#root .m-registration-steps');
    await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload); await field('供应商名称').fill('步骤转场测试企业');
    await button('下一步（1/4）').click();
    await steps.locator('li.current .m-step-name').filter({ hasText: '联系人信息' }).waitFor();
    assert.match(await steps.locator('[aria-current="step"]').innerText(), /联系人信息/);
    assert.equal(await steps.locator('li.completed').count(), 1);
    await button('上一步').click();
    assert.equal(await field('供应商名称').inputValue(), '步骤转场测试企业');
    assert.equal(await steps.locator('li.completed').count(), 0);
    await goto('mobile/shot/200506');
    assert.equal(await page.locator('#root .m-registration-step-list').evaluate(el => getComputedStyle(el).display), 'none');
  });
  await check('管理平台整份修改从后续步骤退出并确认放弃', async () => {
    await goto('mobile/mine');
    const modify = card('北京初然').getByRole('button', { name: '修改全部信息', exact: true });
    await modify.click();
    const legal = field('法人代表');
    const original = await legal.inputValue();
    await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload);
    await legal.fill('本次修改的法人');
    await button('下一步（1/4）').click();
    await headerBack();
    await button('继续编辑').click();
    await button('添加联系人').waitFor();
    await button('上一步').click();
    assert.equal(await legal.inputValue(), '本次修改的法人');
    await button('下一步（1/4）').click();
    await headerBack();
    await button('放弃修改').click();
    await modify.click();
    assert.equal(await legal.inputValue(), original);
    await headerBack();
    await modify.waitFor();
  });
  await check('协同门户整份修改底部回退保留资料，页首返回退出编辑', async () => {
    await goto('mobile/workspace-home');
    await button('供应商信息管理').click();
    await button('修改').click();
    assert.equal(await button('上一步').count(), 0);
    const legal = field('法人代表');
    const original = await legal.inputValue();
    await legal.fill('本次修改的门户法人');
    await button('下一步（1/4）').click();
    await button('上一步').click();
    assert.equal(await legal.inputValue(), '本次修改的门户法人');
    await button('下一步（1/4）').click();
    await button('下一步（2/4）').click();
    await button('下一步（3/4）').click();
    const preview = page.locator('#root .m-registration-preview');
    assert.equal(await preview.locator('.m-tabs [aria-current="page"]').innerText(), '基本信息');
    await preview.getByRole('button', { name: '银行信息', exact: true }).click();
    await button('上一步').click();
    await button('添加银行账户').waitFor();
    await button('下一步（3/4）').click();
    assert.equal(await preview.locator('.m-tabs [aria-current="page"]').innerText(), '基本信息');
    await headerBack();
    await button('继续编辑').click();
    assert.match(await page.locator('#root .m-registration-preview').innerText(), /本次修改的门户法人/);
    await headerBack();
    await button('放弃修改').click();
    await button('修改').click();
    assert.equal(await legal.inputValue(), original);
    await button('下一步（1/4）').click();
    await headerBack();
    await button('修改').waitFor();
    assert.equal(await button('放弃修改').count(), 0);
  });
  await check('供应商卡片单项操作直接显示且可进入审批', async () => {
    await goto('mobile/query');
    const draft = card('代注册草稿');
    assert.equal(await draft.getByRole('button', { name: '更多操作', exact: true }).count(), 0);
    await draft.getByRole('button', { name: '查看审批进度', exact: true }).click();
    await page.locator('#root [data-scene="detail-approval"]').waitFor();
    assert.equal(await page.getByRole('dialog', { name: '更多操作', exact: true }).count(), 0);
  });
  await check('我的评分操作左右对齐、评分摘要及星号样式', async () => {
    await goto('mobile/my-ratings');
    const first = page.locator('#root .m-rating-list article').first();
    const single = await first.locator('.m-card-actions').boundingBox();
    const score = await first.getByRole('button', { name: '评分', exact: true }).boundingBox();
    assert.ok(Math.abs(single.x + single.width - score.x - score.width) <= 1);
    await button('已评分').click();
    const rated = page.locator('#root .m-rating-list article').first();
    const actions = await rated.locator('.m-card-actions').boundingBox();
    const left = await rated.getByRole('button', { name: '评分详情', exact: true }).boundingBox();
    const right = await rated.getByRole('button', { name: '修改评分', exact: true }).boundingBox();
    assert.ok(Math.abs(left.x - actions.x) <= 1);
    assert.ok(Math.abs(right.x + right.width - actions.x - actions.width) <= 1);
    await goto('mobile/rating-edit');
    const meta = page.locator('#root .m-rating-supplier-meta');
    assert.deepEqual(await meta.locator('.m-row > .m-label').allTextContents(), ['邀请人', '邀请时间']);
    assert.deepEqual(await meta.locator('.m-value').evaluateAll(values => values.map(el => [getComputedStyle(el).textAlign, getComputedStyle(el.parentElement).borderBottomWidth])), [['right', '0px'], ['right', '0px']]);
    const requiredStyle = node => [getComputedStyle(node).fontSize, getComputedStyle(node).fontWeight, getComputedStyle(node).color];
    assert.deepEqual(await page.locator('.m-rating-dimension-title > em').first().evaluate(requiredStyle),
      await page.locator('[data-field-label="合作类型"] > label > em').evaluate(requiredStyle));
    const firstStar = page.locator('#root .m-star-slot > svg').first();
    const neutral = await firstStar.evaluate(el => getComputedStyle(el).fill);
    await rate('人员/服务质量', 1);
    await page.waitForFunction(initial => {
      const star = document.querySelector('#root .m-star-slot > svg.filled');
      return star && getComputedStyle(star).fill !== initial;
    }, neutral);
    await page.setViewportSize({ width: 320, height: 845 });
    try {
      const dimension = page.locator('#root .m-rating-dimension').first();
      const number = await dimension.locator('.m-rating-value').boundingBox();
      const stars = await dimension.getByRole('slider').boundingBox();
      assert.ok(number.y + number.height <= stars.y);
      assert.ok(stars.width >= 5 * 44);
    } finally {
      await page.setViewportSize({ width: 390, height: 845 });
    }
  });
  await check('协同门户页签与信息卡弱化分隔，差旅提示指向电脑端', async () => {
    await goto('mobile/workspace-home');
    assert.equal(await button('差旅账单录入').count(), 0);
    assert.ok(await page.getByText('差旅服务请在电脑端协同门户办理。', { exact: true }).isVisible());
    for (const route of ['workspace-info', 'workspace-tasks']) {
      await goto('mobile/' + route);
      const tabs = page.locator('#root .m-workspace > .m-tab-bar');
      assert.deepEqual(await tabs.evaluate(el => [getComputedStyle(el).borderTopWidth, getComputedStyle(el).borderBottomWidth]), ['0px', '0px']);
      assert.equal(await page.locator('#root .mobile-page > .m-header').evaluate(el => getComputedStyle(el).borderBottomWidth), '0px');
      assert.equal(await tabs.locator('[aria-current="page"]').count(), 1);
    }
    await goto('mobile/workspace-quote-detail?record=MOCK-INQ-001');
    const quote = page.locator('#root .m-quote-info');
    const row = quote.locator('.m-row').first();
    const editable = quote.locator('[data-field-label="税率（%）"]');
    const typography = node => [getComputedStyle(node).fontSize, getComputedStyle(node).fontWeight, getComputedStyle(node).color];
    assert.deepEqual(await row.locator('.m-label').evaluate(typography), await editable.locator('label').evaluate(typography));
    assert.equal(await row.evaluate(el => getComputedStyle(el).borderBottomWidth), '0px');
    const input = editable.locator('input');
    assert.deepEqual(await row.locator('.m-value').evaluate(typography), await input.evaluate(typography));
    const label = await row.locator('.m-label').boundingBox();
    const inputLabel = await editable.locator('label').boundingBox();
    const readValue = await row.locator('.m-value').boundingBox();
    const inputBox = await input.boundingBox();
    assert.ok(Math.abs(label.x - inputLabel.x) <= 1);
    assert.ok(Math.abs(readValue.x + readValue.width - inputBox.x - inputBox.width) <= 1);
    assert.equal(await row.locator('.m-value').evaluate(el => getComputedStyle(el).textAlign), 'right');
    assert.equal(await input.evaluate(el => getComputedStyle(el).textAlign), 'right');
    assert.equal(await input.evaluate(el => getComputedStyle(el).borderLeftWidth), '1px');
  });
  await check('供应商蓝条与关键摘要默认可见，常用操作不藏菜单', async () => {
    await goto('mobile'); const records = page.locator('#root .m-supplier-card'); assert.equal(await records.locator('h3 .m-blue-mark').count(), await records.count());
    const sample = card('北京初然'); assert.ok(await sample.locator('.m-supplier-kind').filter({ hasText: '企业供应商' }).isVisible()); assert.ok(await sample.getByText('未评分', { exact: true }).isVisible()); assert.ok(await sample.getByRole('button', { name: '修改银行', exact: true }).isVisible());
    assert.ok((await sample.locator('.m-supplier-kind').innerText()).includes('代注册')); const mark = await sample.locator('.m-blue-mark').boundingBox(); assert.ok(mark.width > 0 && mark.height > 0); await page.screenshot({ path: path.join(output, 'query-viewport.png') }); await shot('supplier-summary');
    const more = page.locator('#root').getByRole('dialog', { name: '更多操作', exact: true });
    await sample.getByRole('button', { name: '更多操作', exact: true }).click();
    assert.equal(await more.getByRole('button', { name: '修改银行', exact: true }).count(), 0);
    assert.ok(await more.getByRole('button', { name: '分配权限', exact: true }).isVisible());
    await more.getByRole('button', { name: '取消', exact: true }).click();
    const draft = card('代注册草稿');
    assert.ok(await draft.getByRole('button', { name: '查看审批进度', exact: true }).isVisible());
    await goto('mobile/query-more');
    assert.equal(await more.getByRole('button', { name: '修改银行', exact: true }).count(), 0);
    await goto('mobile/mine');
    assert.ok(await draft.getByRole('button', { name: '修改草稿', exact: true }).isVisible());
    assert.ok(await sample.getByRole('button', { name: '修改全部信息', exact: true }).isVisible());
    await sample.getByRole('button', { name: '更多操作', exact: true }).click();
    assert.equal(await more.getByRole('button', { name: '修改全部信息', exact: true }).count(), 0);
    await more.getByRole('button', { name: '修改银行', exact: true }).click();
    await page.locator('#root [data-scene="bank"]').waitFor();
    assert.match(await page.locator('#root .m-row').first().innerText(), /北京初然/);
  });
  await check('权限入口不经过二级更多，常用修改可直接进入', async () => {
    await goto('mobile'); await card('代注册草稿').getByRole('button', { name: '修改草稿', exact: true }).click(); await headerBack(); await page.locator('#root [data-scene="query"]').waitFor(); await action('北京初然', '分配权限'); await page.locator('#root [data-scene="permissions"]').waitFor(); await headerBack(); await card('北京初然').getByRole('button', { name: '修改银行', exact: true }).click(); await page.locator('#root [data-scene="bank"]').waitFor();
  });
  await check('邀请及其他移动办理表单标签在上、控件等宽对齐', async () => {
    const routes = [
      ['invite', 5], ['invite-again', 5], ['bank-form', 11], ['permission-form', 3],
      ['inviter', 1], ['inviter-batch?map=1', 1],
      ['register?map=1&panel=qualification', 6], ['register?map=1&step=1&panel=contact', 7],
      ['address', 2], ['rating-edit', 4], ['bank-application-form', 8],
      ['workspace-account-email?map=1&step=1', 2], ['workspace-account-password?map=1', 3],
      ['registration-approval-demo?map=1', 2],
    ];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 740 });
      for (const [route, expected] of routes) {
        await goto('mobile/' + route);
        const visibleForm = page.locator('#root .m-supplier-form-fields .m-field:visible');
        await visibleForm.first().waitFor();
        const fields = await visibleForm.evaluateAll(nodes => nodes.filter(node => !node.closest('[inert]')).map(node => {
          const label = node.querySelector(':scope > label');
          const control = node.querySelector(':scope > .m-field-control');
          const row = node.getBoundingClientRect();
          const l = label.getBoundingClientRect();
          const c = control.getBoundingClientRect();
          return { label: label.innerText, above: c.top >= l.bottom + 6, aligned: Math.abs(c.left - l.left) < 1, full: Math.abs(row.width - c.width) < 1 };
        }));
        assert.equal(fields.length, expected, route);
        for (const { label, above, aligned, full } of fields) {
          assert.ok(above && aligned && full, route + ' · ' + label);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route);
      }
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('评分页先展示评分项，基础信息可展开且结果不浮动遮挡', async () => {
    await goto('mobile/rating-edit'); assert.equal(await page.locator('#root .m-detail-summary').count(), 1); assert.equal(await page.locator('#root .m-rating-summary').count(), 0); assert.ok((await page.locator('#root .m-rating-dimension').first().boundingBox()).y < 845); await shot('rating-focused'); assert.ok(await page.locator('#root .m-detail-summary .m-summary-meta').isVisible()); await shot('rating-basic-card');
    await goto('mobile/register'); await fillBasic('结果展示检查'); await page.locator('#root').getByRole('button', { name: /下一步/ }).click(); assert.equal(await button('保存草稿').count(), 0); assert.equal(await page.locator('#root .m-result-banner').count(), 0);
  });
  await check('移动查询列表下线导出入口，旧路径显示对应列表', async () => {
    for (const [route, scene] of [
      ['query', 'query'], ['query?start=2026-10-14&end=2026-10-14', 'query'], ['mine', 'mine'],
      ['my-ratings', 'my-ratings'], ['ratings', 'ratings'], ['rating-ops', 'rating-ops'],
      ['export', 'mine'], ['query-export', 'query'],
    ]) {
      await goto('mobile/' + route);
      await page.locator('#root [data-scene="' + scene + '"]').waitFor();
      assert.equal(await page.locator('#root').getByRole('button', { name: /导出/ }).count(), 0);
      assert.equal(await page.locator('#root .m-export-panel').count(), 0);
    }
  });
  await check('地址半屏编辑、搜索与取消不跳页', async () => {
    await goto('mobile/register'); await button('注册地址').click(); assert.equal(await page.locator('#root').getByRole('dialog', { name: '编辑注册地址', exact: true }).count(), 1); assert.equal(await page.locator('#root .m-fullscreen-panel').count(), 0); await field('搜索省份').fill('北京'); assert.equal(await page.locator('#root .m-sheet-options button').count(), 1); await page.locator('#root .m-sheet-options').getByRole('button', { name: '北京市', exact: true }).click(); await page.locator('#root .m-sheet-options').getByRole('button', { name: '北京市', exact: true }).click(); await page.locator('#root .m-sheet-options').getByRole('button', { name: '朝阳区', exact: true }).click(); await field('详细地址').fill('不应写入'); await button('取消').click(); await button('放弃修改').click(); assert.equal(await button('注册地址').innerText(), '请选择注册地址');
  });
  await check('门户导航、内容滑动、价税直达去重和返回', async () => {
    await goto('mobile/workspace-home'); await button('价税拆分待处理').click(); await button('价税拆分').click(); await page.locator('#root [data-scene="workspace-tax-split"]').waitFor(); assert.equal(await page.locator('#root').getByText('物料编码', { exact: true }).count(), 1); assert.equal(await page.locator('#root').getByText('含税金额', { exact: true }).count(), 1); await headerBack(); assert.equal(await page.locator('#root .m-tabs [aria-current]').innerText(), '待处理'); await swipe(page.locator('#root .m-portal-task-card').first(), -130); await page.locator('#root').getByText('DEMO-ORDER-002', { exact: true }).waitFor(); await headerBack(); await button('退出账号').click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('退出账号').click(); await page.locator('#root').getByRole('dialog', { name: '退出登录？', exact: true }).getByRole('button', { name: '退出登录', exact: true }).click(); await page.locator('#root [data-scene="portal"]').waitFor();
  });
  await check('门户提交资料后显示只读差异，重新进入默认查看基本信息', async () => {
    await goto('mobile/workspace-home');
    await button('供应商信息管理').click();
    await button('修改').click();
    await field('法人代表').fill('变更后的法人');
    for (const label of ['下一步（1/4）', '下一步（2/4）', '下一步（3/4）']) await button(label).click();
    await button('提交').click();
    const info = page.locator('#root [data-scene="workspace-info"]');
    await info.locator('.m-preview-basic [data-changed="true"]').getByText('变更后的法人', { exact: true }).waitFor();
    assert.equal(await button('查看审批').count(), 0);
    assert.equal(await button('修改').count(), 0);
    await button('银行信息').click();
    await headerBack();
    assert.equal(await button('查看资料变更审批').count(), 0);
    await button('供应商信息管理').click();
    assert.equal(await info.locator('.m-tabs [aria-current="page"]').innerText(), '基本信息');
    await goto('mobile/workspace-approval');
    await info.locator('.m-preview-basic').waitFor();
    assert.equal(await page.locator('#root .m-approval').count(), 0);
  });
  await check('门户银行修改回填和联系人专用图标', async () => {
    await goto('mobile/workspace-info'); await button('银行信息').click(); await button('修改').click(); await page.locator('#root .m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('开户所在省').inputValue(), '北京市'); assert.equal(await field('银行账号').inputValue(), '6214589503254174'); await page.locator('#root').getByRole('dialog', { name: '门户银行编辑' }).locator('.m-actions').getByRole('button', { name: '取消', exact: true }).click(); await headerBack(); await button('联系人信息').click(); await button('修改').click(); assert.equal(await button('添加联系人').locator('svg').count(), 1);
  });
  await check('批量邀请人按钮在320宽完整可见', async () => {
    await page.setViewportSize({ width: 320, height: 845 }); await goto('mobile/mine-batch'); const target = button('批量变更邀请人'); assert.ok(await target.isVisible()); assert.equal(await target.evaluate(n => n.scrollWidth <= n.clientWidth && getComputedStyle(n).whiteSpace === 'nowrap'), true); await shot('batch-320'); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('管理全部信息保存后与审批页对比且正式版本保留', async () => {
    await goto('mobile/mine'); await card('北京初然').getByRole('button', { name: '修改全部信息', exact: true }).click(); await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload);
    await field('供应商名称').fill('管理信息变更测试');
    await field('法人代表').fill('测试法人');
    await button('下一步（1/4）').click(); await page.locator('#root .m-record-card').getByRole('button', { name: '编辑', exact: true }).click(); await field('电话').fill('13800000003'); await page.locator('#root .m-record-editor').getByRole('button', { name: '保存', exact: true }).click(); await button('添加联系人').click(); await field('姓名').fill('新增联系人'); await field('电话').fill('13800138002'); await field('邮箱').fill('new-contact@example.com'); await page.locator('#root .m-record-editor').getByRole('button', { name: '保存', exact: true }).click(); await button('下一步（2/4）').click(); await button('下一步（3/4）').click(); const preview = page.locator('#root .m-registration-preview');
    await preview.locator('.m-preview-basic [data-changed="true"]').filter({ hasText: '法人代表' }).waitFor();
    assert.equal(await preview.getByText('修改前后对比', { exact: true }).count(), 0);
    assert.equal(await preview.locator('.m-preview-basic .m-change-badge').innerText(), '变更');
    assert.ok(await preview.getByText('有限责任公司', { exact: true }).isVisible());
    await preview.getByRole('button', { name: '联系人信息', exact: true }).click();
    assert.equal(await preview.locator('.m-preview-basic').count(), 0);
    const updated = preview.locator('.m-record-card').filter({ hasText: '林晓' });
    assert.equal(await updated.locator('.m-change-badge').innerText(), '变更');
    assert.equal(await updated.locator('[data-changed="true"] .m-change-value-new').innerText(), '13800000003');
    const added = preview.locator('.m-record-card').filter({ hasText: '新增联系人' });
    assert.equal(await added.locator('.m-change-badge').innerText(), '新增');
    await button('上一步').click();
    await button('下一步（3/4）').click();
    assert.equal(await preview.locator('.m-tabs [aria-current="page"]').innerText(), '基本信息');
    await button('提交').click();
    await page.locator('#root [data-scene="information-change"] .m-registration-preview').waitFor();
    await button('查看审批').click();
    await page.locator('#root').getByText('修改前后对比', { exact: true }).waitFor();
    await headerBack();
    await headerBack();
    await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click();
    assert.equal(await page.locator('#root').getByText('管理信息变更测试', { exact: true }).count(), 0);
  });
  await check('门户内容紧接标题且底部导航不遮挡末项', async () => {
    await goto('mobile/workspace-home'); assert.ok((await page.locator('#root .m-workspace').boundingBox()).y < 150); await page.screenshot({ path: path.join(output, 'portal-home-viewport.png') });
    await goto('mobile/workspace-info'); await button('修改').click(); await field('备注').scrollIntoViewIfNeeded(); const last = await field('备注').boundingBox(), footer = await page.locator('#root .m-workspace .m-actions').boundingBox(); assert.ok(last.y + last.height <= footer.y + 1); await page.screenshot({ path: path.join(output, 'portal-edit-viewport.png') });
  });
  await check('筛选单选点击即收起，状态支持搜索，应用前不生效', async () => {
    await goto('mobile');
    const cards = page.locator('#root .m-supplier-card');
    const count = await cards.count();
    const status = page.locator('#root').getByRole('combobox', { name: '供应商状态', exact: true });
    const picker = page.getByRole('dialog', { name: '供应商状态', exact: true });
    await button('筛选供应商').click();
    await status.click();
    await picker.getByRole('searchbox').fill('驳回');
    assert.equal(await picker.locator('.m-sheet-options button').count(), 1);
    assert.equal(await picker.getByRole('button', { name: '确认', exact: true }).count(), 0);
    await picker.getByRole('button', { name: '注册驳回', exact: true }).click();
    await picker.waitFor({ state: 'hidden' });
    assert.match(await status.innerText(), /注册驳回/);
    await page.locator('#root .m-fullscreen-panel > .m-header').getByRole('button', { name: '返回', exact: true }).click();
    assert.equal(await cards.count(), count);
    await button('筛选供应商').click();
    await choose('供应商状态', '草稿');
    await button('应用筛选').click();
    assert.equal(await cards.count(), 3);
    await button('筛选供应商').click();
    await status.click();
    await picker.getByRole('button', { name: '清空选择', exact: true }).click();
    await button('应用筛选').click();
    assert.equal(await cards.count(), count);
  });
  await check('必填下拉去除清空，选填下拉保留清空', async () => {
    await goto('mobile/register');
    for (const [label, clearable] of [['供应商类型', false], ['国家', false], ['纳税人资格', true]]) {
      await page.getByRole('combobox', { name: label, exact: true }).click();
      const picker = page.getByRole('dialog', { name: label, exact: true });
      assert.equal(await picker.getByRole('button', { name: '清空选择', exact: true }).count(), Number(clearable));
      await picker.getByRole('button', { name: '取消', exact: true }).click();
      await picker.waitFor({ state: 'hidden' });
    }
  });
  await check('行业枚举完整且筛选使用行业数据', async () => {
    await goto('mobile'); await button('筛选供应商').click(); await page.locator('#root').getByRole('combobox', { name: '供应商推荐', exact: true }).click(); const picker = page.locator('#root').getByRole('dialog'); assert.equal(await picker.locator('.m-sheet-options button').count(), 21); assert.equal(await picker.getByRole('searchbox').count(), 1); await picker.getByRole('searchbox').fill('农林'); await picker.getByRole('button', { name: '农林牧渔业', exact: true }).click(); await button('应用筛选').click(); assert.equal(await page.locator('#root .m-supplier-card').count(), 1); assert.ok((await page.locator('#root .m-supplier-card').innerText()).includes('快速创建'));
  });
  await check('邀请日期区间同行，可分别填写和清空', async () => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 845 }); await goto('mobile/filter');
      const start = button('邀请时间（起）'), end = button('邀请时间（止）');
      const a = await start.boundingBox(), b = await end.boundingBox();
      assert.ok(Math.abs(a.y - b.y) < 1 && a.x + a.width < b.x);
      const separator = page.locator('#root .m-date-range-separator');
      const mark = await separator.boundingBox();
      assert.ok(Math.abs(mark.y + mark.height / 2 - (a.y + a.height / 2)) < 1);
      assert.ok(Math.abs(mark.x + mark.width / 2 - (a.x + a.width + b.x) / 2) < 1);
      assert.ok(await separator.evaluate(img => img.complete && img.naturalWidth === 16));
      await start.click();
      await dateValue('年', '2026'); await dateValue('月', '10'); await dateValue('日', '14');
      await page.getByRole('dialog', { name: '邀请时间（起）', exact: true }).getByRole('button', { name: '确认', exact: true }).click();
      assert.match(await start.innerText(), /2026-10-14/);
      await start.click(); await button('清空日期').click();
      assert.match(await start.innerText(), /开始日期/);
      assert.match(await end.innerText(), /结束日期/);
      await end.click(); await button('取消').click();
      assert.match(await end.innerText(), /结束日期/);
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('供应商查询批量模式逐条勾选，我的邀请保留全选', async () => {
    const selectAll = page.locator('#root').getByRole('checkbox', { name: '全选当前结果', exact: true });
    const checked = page.locator('#root .m-supplier-card input:checked');
    const footer = page.locator('#root .m-batch-actions');
    const searchBatch = button('批量操作');
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 845 });
      await goto('mobile/query?map=1&role=admin');
      await searchBatch.click();
      assert.equal(await selectAll.count(), 0);
      assert.ok(await button('删除').isDisabled());
      const choices = page.locator('#root .m-supplier-card input[type=checkbox]:enabled');
      await choices.first().check();
      await choices.nth(1).check();
      assert.equal(await checked.count(), 2);
      assert.match(await footer.innerText(), /已选 2 项/);
      assert.ok(await button('删除').isEnabled());
      await choices.first().uncheck();
      assert.equal(await checked.count(), 1);
      await button('取消批量操作').click();
      assert.equal(await footer.count(), 0);
    }
    await goto('mobile/query-batch?map=1&role=admin');
    assert.equal(await selectAll.count(), 0);
    for (const width of [320, 375, 430]) {
      await page.setViewportSize({ width, height: 845 });
      await goto('mobile/mine');
      await searchBatch.click();
      const choices = page.locator('#root .m-supplier-card input[type=checkbox]:enabled');
      const measures = () => page.locator('#root .m-batch-toggle, #root .m-batch-actions :is(label, button)')
        .evaluateAll(nodes => nodes.map(node => {
          const box = node.getBoundingClientRect();
          return [box.x, box.width, box.height];
        }));
      const initial = await measures();
      await choices.first().check();
      assert.deepEqual(await measures(), initial, '选一项时的批量工具条');
      await selectAll.check();
      const total = await choices.count();
      assert.ok(total > 0);
      assert.equal(await checked.count(), total);
      assert.ok(await button('批量变更邀请人').isEnabled());
      assert.deepEqual(await measures(), initial, '全选可变更记录时的批量工具条');
      await selectAll.uncheck();
      assert.equal(await checked.count(), 0);
      assert.deepEqual(await measures(), initial, '清空时的批量工具条');
    }
    await page.setViewportSize({ width: 390, height: 845 });
    await goto('mobile/shot/201829');
    assert.ok(await selectAll.isVisible());
  });
  await check('列表直接展示原字段，无更多信息折叠', async () => {
    await goto('mobile'); assert.equal(await page.locator('#root .m-card-extra').count(), 0); assert.ok(await card('北京初然').locator('.m-supplier-kind').filter({ hasText: '代注册' }).isVisible()); await goto('mobile/mine'); assert.ok(await card('北京初然').getByText('联系人邮箱', { exact: true }).isVisible());
  });
  await check('门户已保存修改可继续编辑并保留其他分组', async () => {
    await goto('mobile/workspace-info'); await button('修改').click(); await field('法人代表').fill('保留的基本资料修改'); await button('保存修改').click(); await button('继续修改').click(); assert.equal(await field('法人代表').inputValue(), '保留的基本资料修改'); await button('联系人信息').click(); await button('修改').click(); await button('编辑联系人1').click(); await field('姓名').fill('保留的联系人修改'); await button('保存联系人').click(); await button('保存修改').click(); const text = await page.locator('#root .m-change-comparison').innerText(); assert.ok(text.includes('保留的基本资料修改')); assert.ok(text.includes('保留的联系人修改')); await button('继续修改').click(); await button('银行信息').click(); await button('修改').click(); await page.locator('#root .m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); await field('备注').fill('保留的银行修改'); await button('保存此账户').click(); await button('保存修改').click(); const all = await page.locator('#root .m-change-comparison').innerText(); for (const value of ['保留的基本资料修改', '保留的联系人修改', '保留的银行修改']) assert.ok(all.includes(value));
  });
  await check('门户价税标题返回恢复待处理来源', async () => {
    await goto('mobile/workspace-tasks'); await button('价税拆分').click(); await headerBack(); await page.locator('#root [data-scene="workspace-tasks"]').waitFor(); assert.equal(await page.locator('#root .mobile-page > .m-header h1').innerText(), '价税拆分'); assert.equal(await page.locator('#root .m-tabs [aria-current]').innerText(), '待处理');
  });
  await check('联系人删除按记录身份对比，不把后续记录误报为修改', async () => {
    await goto('mobile/workspace-info'); await button('联系人信息').click(); await button('修改').click(); await button('添加联系人').click(); await field('姓名').fill('新联系人'); await field('电话').fill('13800000001'); await field('邮箱').fill('new@example.com'); await button('保存联系人').click(); await button('保存修改').click(); await button('继续修改').click(); await button('删除联系人1').click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); await button('保存修改').click(); const headings = await page.locator('#root .m-change-comparison h3').allTextContents(); assert.ok(headings.some(t => t.includes('删除') && t.includes('姓名'))); assert.ok(headings.some(t => t.includes('新增') && t.includes('姓名'))); assert.ok(!headings.some(t => t.includes('修改 · 联系人'))); const deletedGroup = page.locator('#root .m-change-comparison .m-change-group[data-change-action="删除"]').first(); assert.equal(await deletedGroup.locator('.m-change-badge').evaluate(n => getComputedStyle(n).color), 'rgb(180, 35, 24)');
  });
  await check('历史截图仍可查看导出确认和评分运维入口', async () => {
    await goto('mobile/shot/200321');
    const exportDialog = page.locator('#root').getByRole('dialog', { name: '导出供应商', exact: true });
    await exportDialog.getByRole('button', { name: '邀请时间（起）', exact: true }).click();
    const datePicker = page.getByRole('dialog', { name: '邀请时间（起）', exact: true });
    assert.equal(await datePicker.getByRole('button', { name: '清空日期', exact: true }).count(), 0);
    await datePicker.getByRole('button', { name: '取消', exact: true }).click();
    await datePicker.waitFor({ state: 'hidden' });
    await exportDialog.getByRole('button', { name: '取消', exact: true }).click();
    await page.locator('#root [data-scene="mine"]').waitFor();
    assert.equal(await button('导出供应商').count(), 0);
    await goto('mobile/shot/201526');
    assert.ok(await button('导出当前记录').isVisible());
  });
  await check('退出门户明确提示未提交修改，取消退出仍可继续提交', async () => {
    await goto('mobile/workspace-info'); await button('修改').click(); await field('法人代表').fill('退出后需提示的资料'); await button('保存修改').click(); await headerBack(); await headerBack(); await button('我的').click(); await button('退出登录').click(); assert.ok((await page.locator('#root').getByRole('dialog').innerText()).includes('退出将放弃')); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('工作台').click(); await button('继续提交资料修改').click(); assert.ok((await page.locator('#root .m-change-comparison').innerText()).includes('退出后需提示的资料'));
  });
  await check('规范吸收：状态语义在列表、详情和门户一致', async () => {
    await goto('mobile'); const listTag = card('北京初然').locator('.m-status'); assert.equal(await listTag.innerText(), '已审批'); assert.equal(await listTag.getAttribute('data-tone'), 'success'); const appearance = await listTag.evaluate(n => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor]); await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click(); const detailTag = page.locator('#root .m-detail-summary .m-status'); assert.deepEqual(await detailTag.evaluate(n => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor]), appearance); await goto('mobile/workspace-home'); assert.equal(await page.locator('#root .m-workspace .m-status').getAttribute('data-tone'), 'success'); await page.screenshot({ path: path.join(output, 'adopt-home.png') });
  });
  await check('规范吸收：已应用条件值、结果数和取消保持一致', async () => {
    await goto('mobile');
    await button('筛选供应商').click();
    await choose('供应商状态', '已审批');
    await choose('供应商推荐', '信息传输、计算机服务和软件业');
    await button('应用筛选').click();
    const summary = page.locator('#root').getByRole('region', { name: '查询结果' });
    assert.equal(await summary.innerText(), '共 3 家供应商');
    await button('筛选供应商').click();
    await choose('供应商状态', '草稿');
    await page.locator('#root .m-fullscreen-panel .m-header').getByRole('button', { name: '返回', exact: true }).click();
    assert.equal(await summary.innerText(), '共 3 家供应商');
    assert.equal(await page.locator('#root .m-supplier-card').count(), 3);
    await page.screenshot({ path: path.join(output, 'adopt-applied-filters.png') });
  });
  await check('规范吸收：搜索和应用筛选后清除旧批量选择', async () => {
    await goto('mobile/mine-batch');
    const supplier = page.locator('#root').getByRole('checkbox', { name: '选择北京初然文化传媒有限公司733324', exact: true });
    await supplier.check();
    await field('搜索供应商名称').fill('草稿');
    await page.waitForFunction(() => document.querySelectorAll('.m-supplier-card input:checked').length === 0);
    assert.match(await page.locator('#root .m-batch-actions').innerText(), /已选 0 项/);
    await button('清空搜索').click();
    await supplier.check();
    await button('筛选供应商').click();
    await choose('供应商状态', '草稿');
    await button('应用筛选').click();
    assert.equal(await page.locator('#root .m-supplier-card input:checked').count(), 0);
    assert.equal(await page.locator('#root .m-supplier-card').count(), 3);
  });
  await check('规范吸收：空列表与无匹配结果明确区分', async () => {
    await goto('mobile/shot/200005'); await page.locator('#root').getByText('暂无供应商记录', { exact: true }).waitFor(); await goto('mobile'); await field('搜索供应商名称').fill('没有这家供应商'); await page.locator('#root').getByText('暂无匹配结果，请调整搜索或筛选条件', { exact: true }).waitFor(); await button('清空搜索').click(); assert.ok(await page.locator('#root .m-supplier-card').count() > 0);
  });
  await check('规范吸收：长文件名可读，长选项层标题和动作可达', async () => {
    await page.setViewportSize({ width: 320, height: 640 }); await goto('mobile/register'); const name = '供应商注册营业执照与补充证明长文件名称'.repeat(5) + '.png'; await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles({ ...upload, name }); const line = page.locator('#root .m-attachment-name'); assert.ok((await line.innerText()).includes(name)); assert.ok(await line.evaluate(n => n.scrollWidth <= n.clientWidth)); await page.locator('#root').getByRole('combobox', { name: '所属行业', exact: true }).click(); const sheet = page.locator('#root').getByRole('dialog'); await sheet.evaluate(n => { n.scrollTop = n.scrollHeight; }); for (const label of ['取消', '清空选择']) { const box = await sheet.getByRole('button', { name: label, exact: true }).boundingBox(); assert.ok(box.y >= 0 && box.y + box.height <= 640); } await page.screenshot({ path: path.join(output, 'adopt-long-picker.png') }); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('规范吸收：主操作与占位文字保持足够对比', async () => {
    await goto('mobile/register'); const colors = await page.locator('#root .m-actions button').last().evaluate(n => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor]); const luminance = rgb => rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0); const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05); assert.ok(contrast(...colors) >= 4.5); const placeholder = await field('供应商名称').evaluate(n => getComputedStyle(n, '::placeholder').color); assert.ok(contrast(placeholder, 'rgb(255,255,255)') >= 4.5);
  });
  await check('移动复核：日期居中、键盘选择、闰日与单日期清空', async () => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 845 }); await goto('mobile'); await button('筛选供应商').click(); await button('邀请时间（起）').click();
      await dateValue('年', '2024'); await dateValue('月', '1'); await dateValue('日', '31'); await dateValue('月', '2');
      await page.waitForFunction(() => document.querySelector('[role=listbox][aria-label="日"] [aria-selected=true]')?.textContent === '29日');
      for (const name of ['年', '月', '日']) { const wheel = page.locator('#root').getByRole('listbox', { name, exact: true }); const box = await wheel.boundingBox(), chosen = await wheel.getByRole('option', { selected: true }).boundingBox(); assert.ok(Math.abs(chosen.y + chosen.height / 2 - box.y - box.height / 2) < 2); }
      for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.ok(await page.locator('#root').getByRole('dialog').evaluate(n => n.contains(document.activeElement))); } await page.screenshot({ path: path.join(output, 'ux-date-' + width + '.png') }); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.ok((await button('邀请时间（起）').innerText()).includes('2024-02-29'));
      await button('邀请时间（止）').click(); await page.locator('#root').getByRole('listbox', { name: '日', exact: true }).press('End'); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); const end = await button('邀请时间（止）').innerText();
      await button('邀请时间（起）').click(); await button('清空日期').click(); assert.ok((await button('邀请时间（起）').innerText()).includes('开始日期')); assert.equal(await button('邀请时间（止）').innerText(), end);
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('移动复核：银行空态新增、零变更禁用与目录选择', async () => {
    await goto('mobile'); await card('快速创建').getByRole('button', { name: '修改银行', exact: true }).click(); assert.ok(await button('提交变更').isDisabled()); await button('添加银行账户').click(); assert.ok(await page.locator('#root').getByRole('heading', { name: '新增银行账户', exact: true }).isVisible()); await button('开户银行').click(); const picker = page.locator('#root').getByRole('dialog'); assert.equal(await picker.getByRole('button', { name: '确定', exact: true }).count(), 0); await page.screenshot({ path: path.join(output, 'ux-bank-picker.png') }); await picker.getByRole('radio').first().click(); assert.equal(await picker.count(), 0); assert.ok((await button('开户银行').innerText()).includes('中国农业发展银行'));
  });
  await check('移动复核：管理员批删与本人单删分离', async () => {
    await goto('mobile/query?map=1&role=employee');
    assert.equal(await button('批量操作').count(), 0);
    await button('我的邀请').click();
    await button('供应商查询').click();
    assert.equal(await button('批量操作').count(), 0);
    await goto('mobile');
    await button('批量操作').click();
    assert.ok(await button('删除').isDisabled());
    assert.equal(await page.locator('#root').getByRole('checkbox', {name:'全选当前结果',exact:true}).count(), 0);
    await goto('mobile/mine');
    await button('批量操作').click();
    assert.equal(await button('删除').count(), 0);
    assert.ok(await button('批量变更邀请人').isVisible());
    assert.ok(await page.locator('#root .m-supplier-card input[type=checkbox]:disabled').count() > 0);
  });
  await check('移动供应商数据权限随演示身份、邀请人工号及菜单切换', async () => {
    const search = field('搜索供应商名称');
    const result = page.getByRole('region', { name: '查询结果' });
    for (const role of ['employee', 'admin_supplier', 'expLaPeople', 'admin']) {
      await goto('mobile/query?map=1&role=' + role);
      await search.fill('哈哈人');
      assert.equal(await card('哈哈人').count(), role === 'employee' ? 0 : 1);
      assert.match(await result.innerText(), role === 'employee' ? /0\s*家供应商/ : /1\s*家供应商/);
      assert.equal(await button('批量操作').count(), role === 'admin' ? 1 : 0);
      await button('我的邀请').click();
      await search.fill('哈哈人');
      assert.equal(await card('哈哈人').count(), 0);
      await search.fill('代注册草稿');
      assert.ok(await card('代注册草稿').isVisible());
    }
    await goto('mobile/query?map=1&role=employee&inviterCode=MOCK-002');
    assert.ok(await card('演示历史供应商').isVisible());
    await search.fill('北京初然');
    assert.equal(await card('北京初然').count(), 0);
    await goto('mobile/detail?map=1&role=employee&record=person');
    assert.ok(await page.getByText('供应商记录不存在或超出查询范围').isVisible());
  });
  await check('移动复核：点击星星左右半边直接选择半星整星', async () => {
    await goto('mobile/my-ratings'); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '评分', exact: true }).click(); assert.equal(await page.locator('#root .m-rating-precision').count(), 0); assert.equal(await page.locator('#root').getByText('点击星星左半边选半星，右半边选整星。', { exact: true }).count(), 0); assert.equal(await page.locator('#root').getByRole('spinbutton').count(), 0);
    for (let score = .5; score <= 5; score += .5) { await rate('人员/服务质量', score); assert.equal(await page.locator('#root').getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), String(score)); }
    await rate('人员/服务质量', 3.5); await page.screenshot({ path: path.join(output, 'ux-rating.png') });
  });
  await check('移动复核：注册不分组定位，附件查看替换分离', async () => {
    await goto('mobile/register'); assert.equal(await page.locator('#root').getByRole('navigation', { name: '基本信息分组' }).count(), 0); assert.equal(await page.locator('#root .m-basic-group').count(), 0); await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload); await button('查看营业执照').click(); await button('打开附件').click(); assert.ok(await page.locator('#root .m-attachment-full').isVisible()); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click(); const chooser = page.waitForEvent('filechooser'); await page.locator('#root').getByText('替换照片或文件', { exact: true }).click(); await (await chooser).setFiles({ ...upload, name: '替换证明.png' }); assert.ok((await page.locator('#root .m-attachment-name').innerText()).includes('替换证明.png')); await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles({ name: '证明.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }); await button('查看营业执照').click(); await button('打开附件').click(); assert.ok(await page.locator('#root').getByRole('link', { name: '打开文件', exact: true }).isVisible()); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click(); await page.screenshot({ path: path.join(output, 'ux-form.png') });
    await goto('mobile/workspace-info?edit=1'); await button('查看营业执照').click(); assert.ok(await page.locator('#root').getByText('此附件仅有截图示例，未提供原件，暂不可预览原图。', { exact: true }).isVisible()); assert.equal(await page.locator('#root .m-attachment-full').count(), 0);
  });
  await check('移动复核：运维创建日期和排除姓名筛选及取消', async () => {
    await goto('mobile/rating-ops'); await button('筛选评分运维').click(); await field('排除评分人').fill('陈才慧'); await button('应用筛选').click(); assert.equal(await page.locator('#root .m-rating-list .m-bank-card').count(), 1); assert.ok((await page.locator('#root .m-rating-list').innerText()).includes('李雨思')); assert.equal(await button('导出当前记录').count(), 0); await button('筛选评分运维').click(); await field('排除评分人').fill('李雨思'); await page.getByRole('dialog', { name: '筛选评分运维', exact: true }).getByRole('button', { name: '返回', exact: true }).click(); assert.equal(await page.locator('#root .m-rating-list .m-bank-card').count(), 1); await button('筛选评分运维').click(); assert.equal(await field('排除评分人').inputValue(), '陈才慧'); await button('创建时间（起）').click(); await dateValue('年', '2027'); await page.locator('#root').getByRole('dialog', { name: '创建时间（起）', exact: true }).getByRole('button', { name: '确认', exact: true }).click(); await button('应用筛选').click(); assert.equal(await page.locator('#root .m-rating-list .m-bank-card').count(), 0); assert.ok(await button('批量发起评分').isDisabled());
  });
  await check('反馈修正：银行新增入口常显、无变更汇总且编辑目标不串行', async () => {
    await goto('mobile/bank'); assert.ok(await button('添加银行账户').isVisible()); assert.ok((await button('添加银行账户').boundingBox()).y < (await page.locator('#root .m-bank-card').first().boundingBox()).y); await page.locator('#root .m-bank-card').first().getByRole('button', { name: '删除', exact: true }).click(); await page.locator('#root').getByRole('dialog', { name: '银行删除校验', exact: true }).waitFor(); await button('知道了').click();
    for (const number of ['000111', '000222']) { await button('添加银行账户').click(); await fillBank('一般账户'); await field('银行账号').fill(number); await button('保存此账户').click(); assert.ok(await button('添加银行账户').isVisible()); }
    assert.equal(await page.locator('#root .m-pending-changes').count(), 0); assert.equal(await button('只看变更').count(), 0); assert.equal(await page.locator('#root .m-bank-card').count(), 3);
    const target = page.locator('#root .m-bank-card').filter({ hasText: '000111' }); await target.getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('银行账号').inputValue(), '000111'); await field('备注').fill('只编辑目标账户'); await button('保存此账户').click(); assert.ok((await target.innerText()).includes('只编辑目标账户')); assert.ok(!(await page.locator('#root .m-bank-card').filter({ hasText: '000222' }).innerText()).includes('只编辑目标账户')); assert.ok(await target.getByRole('button', { name: '删除', exact: true }).isEnabled());
    const heading = target.locator('.m-record-heading'), badge = heading.getByLabel('变更状态：新增'); assert.ok(await badge.isVisible()); assert.ok(await target.locator('.m-change-field-row').count() > 0); assert.equal(await target.locator('.m-change-value-new').count(), 0); assert.ok(await target.locator('.m-change-value-normal').count() > 0); const hb = await heading.boundingBox(), bb = await badge.boundingBox(); assert.ok(bb.x + bb.width > hb.x + hb.width - 24); await shot('followup-bank');
    await target.getByRole('button', { name: '删除', exact: true }).click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await target.count(), 1); await target.getByRole('button', { name: '删除', exact: true }).click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await target.count(), 0); assert.equal(await page.locator('#root .m-bank-card').count(), 2);
  });
  await check('反馈修正：权限变更状态同样位于卡片右上角', async () => {
    await goto('mobile/permissions'); await button('新增权限').click(); await choose('所属权限', '集团权限'); await choose('权限分类', '集团其他业务'); await button('保存此权限').click(); const badge = page.locator('#root .m-bank-card .m-record-heading').getByLabel('变更状态：新增'); assert.ok(await badge.isVisible()); assert.equal(await page.locator('#root .m-pending-changes').count(), 0); assert.equal(await button('只看变更').count(), 0); assert.equal(await page.locator('#root .m-bank-card').count(), 2);
  });
  await check('反馈修正：三个列表筛选入口共用图标组件', async () => {
    const icons = []; for (const [route, name] of [['mobile', '筛选供应商'], ['mobile/my-ratings', '筛选评分'], ['mobile/rating-ops', '筛选评分运维']]) { await goto(route); const control = button(name); assert.equal(await control.innerText(), ''); icons.push(await control.locator('img').getAttribute('src')); const box = await control.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44); await control.click(); assert.ok(await button('应用筛选').isVisible()); } assert.equal(new Set(icons).size, 1);
  });
  await check('反馈修正：紧凑胶囊、同行值、只读无灰底及图片删除小图标', async () => {
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/detail'); const tabs = page.locator('#root .m-tab-bar-pill'); assert.ok((await tabs.boundingBox()).height <= 46); const current = tabs.locator('button.active'); const visual = await current.evaluate(n => { const s = getComputedStyle(n, '::before'); return n.offsetHeight - parseFloat(s.top) - parseFloat(s.bottom); }); assert.equal(visual, 32); for (const row of await page.locator('#root .m-detail .m-row').all()) { const l = await row.locator('.m-label').boundingBox(), v = await row.locator('.m-value').boundingBox(); assert.ok(Math.abs(l.y - v.y) < 2); } }
    await goto('mobile/bank-form-selected'); assert.equal(await field('开户所在省').evaluate(n => getComputedStyle(n).backgroundColor), 'rgba(0, 0, 0, 0)'); await goto('mobile/register'); await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload); const remove = page.locator('#root').getByRole('button', { name: '移除营业执照', exact: true }); const rect = await remove.boundingBox(); assert.ok(rect.width <= 28 && rect.height <= 28); await remove.click(); assert.ok(await page.locator('#root').getByRole('dialog').isVisible()); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await page.screenshot({ path: path.join(output, 'feedback-register.png') }); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('工作台组件：搜索有记录、无记录及清空恢复，原始资产显示', async () => {
    await goto('mobile'); const search = page.locator('#root').getByRole('searchbox', { name: '搜索供应商名称', exact: true }); await search.fill('陈才慧'); assert.equal(await page.locator('#root .m-supplier-card').count(), 0); await search.fill('北京'); assert.ok(await page.locator('#root .m-supplier-card').count()); await shot('workbench-search-found'); await search.fill('完全不存在的供应商ABC'); assert.equal(await page.locator('#root .m-supplier-card').count(), 0); const empty = page.locator('#root .m-empty-search'); assert.ok(await empty.isVisible()); assert.equal(await empty.locator('img').count(), 5); for (const img of await empty.locator('img').all()) assert.ok(await img.evaluate(n => n.complete && n.naturalWidth > 0)); await shot('workbench-search-empty'); await button('清空搜索').click(); assert.ok(await page.locator('#root .m-supplier-card').count());
  });
  await check('工作台组件：普通选择和搜索选择、日期底部确认、输入焦点', async () => {
    await goto('mobile'); await button('筛选供应商').click();
    const filterState = page.locator('#root').getByRole('combobox', { name: '供应商类型', exact: true });
    const filterLabel = page.locator('#root .m-filter-view [data-field-label="供应商类型"] > label');
    assert.equal(await filterState.innerText(), '供应商类型');
    assert.ok((await filterLabel.boundingBox()).width <= 1);
    assert.equal(await field('邀请人').getAttribute('placeholder'), '输入邀请人');
    assert.ok((await button('邀请时间（起）').innerText()).includes('开始日期'));
    await filterState.click(); assert.ok(await page.locator('#root .m-option-picker.is-simple').isVisible()); assert.equal(await page.locator('#root').getByRole('dialog').getByRole('searchbox').count(), 0); assert.equal(await page.locator('#root .m-option-picker.is-simple .m-option-radio').count(), 0); const simpleOption = page.locator('#root .m-option-picker.is-simple .m-sheet-options > button').first(); assert.equal(await simpleOption.evaluate(n => getComputedStyle(n).justifyContent), 'center'); assert.equal(await simpleOption.locator('span').first().evaluate(n => getComputedStyle(n).textAlign), 'center'); await shot('workbench-option-simple'); await button('企业供应商').click(); await page.locator('#root').getByRole('combobox', { name: '供应商类型', exact: true }).click(); const selectedSimple = page.locator('#root .m-option-picker.is-simple .m-sheet-options > button.selected'); assert.notEqual(await selectedSimple.evaluate(n => getComputedStyle(n).backgroundColor), await page.locator('#root .m-option-picker.is-simple .m-sheet-options > button:not(.selected)').first().evaluate(n => getComputedStyle(n).backgroundColor)); assert.equal(await selectedSimple.evaluate(n => getComputedStyle(n).color), 'rgb(20, 92, 255)'); assert.equal(await selectedSimple.evaluate(n => getComputedStyle(n).borderRadius), '12px'); await button('取消').click(); await page.locator('#root').getByRole('combobox', { name: '供应商推荐', exact: true }).click(); const search = page.locator('#root').getByRole('searchbox', { name: '搜索供应商推荐', exact: true }); await search.fill('软件'); assert.ok(await page.locator('#root .m-option-picker.has-selection-marks').isVisible());
    const softwareOption = page.locator('#root .m-option-picker .m-sheet-options > button').first();
    const softwareName = await softwareOption.locator('span').first().innerText();
    await softwareOption.click();
    await page.locator('#root').getByRole('combobox', { name: '供应商推荐', exact: true }).click();
    await search.fill(softwareName);
    const checkedMark = page.locator('#root .m-option-radio[data-selected=true]');
    assert.equal(await checkedMark.evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(255, 255, 255)');
    assert.equal(await checkedMark.evaluate(n => getComputedStyle(n).borderTopColor), 'rgb(20, 92, 255)');
    assert.equal(await checkedMark.locator('svg').evaluate(n => getComputedStyle(n).color), 'rgb(20, 92, 255)'); assert.ok(await page.locator('#root .m-option-radio').count()); await shot('workbench-option-search'); await search.fill('不存在的行业ABC'); assert.ok(await page.locator('#root .m-option-picker .m-empty-search').isVisible()); await button('取消').click(); await field('邀请人').focus(); const outline = await field('邀请人').evaluate(n => getComputedStyle(n.closest('.m-field')).boxShadow); assert.notEqual(outline, 'none'); await shot('workbench-filter-input'); await button('邀请时间（起）').click(); assert.equal(await page.locator('#root .m-date-columns > span').count(), 3); assert.ok(await page.locator('#root .m-date-picker .m-picker-actions').getByRole('button', { name: '确认', exact: true }).isVisible()); await shot('workbench-date'); await button('取消').click();
  });
  await check('工作台组件：附件列表到预览及返回、审批圆点连线和直接意见', async () => {
    await goto('mobile/register'); await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload); await button('查看营业执照').click(); assert.ok(await page.locator('#root .m-attachment-file').isVisible()); assert.ok(await page.locator('#root .m-file-icon img').evaluate(n => n.complete && n.naturalWidth === 24)); assert.equal(await page.locator('#root .m-attachment-full').count(), 0); await shot('workbench-attachment-list'); await button('打开附件').click(); assert.ok(await page.locator('#root .m-attachment-full').isVisible()); await button('返回附件列表').click(); assert.ok(await page.locator('#root .m-attachment-file').isVisible()); await button('返回').last().click();
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/approval'); const nodes = page.locator('#root .m-approval > .m-section:first-of-type .m-approval-timeline > li'); assert.equal(await nodes.count(), 4); for (const node of await nodes.all()) { assert.equal(await node.locator(':scope > .m-approval-heading .m-status').count(), 1); assert.equal(await node.locator('.m-approval-node time').count(), 1); assert.equal(await node.locator('.m-approval-node h3').count(), 0); assert.equal(await node.locator('.m-approval-node .m-row').filter({ hasText: '审批意见' }).count(), 1); assert.equal(await node.locator('details').count(), 0); assert.equal(await node.evaluate(n => getComputedStyle(n, '::before').width), '8px'); } assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot('workbench-approval-' + width); } await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('单选统一即时回填，取消保留及清空即关闭', async () => {
    await goto('mobile/register'); const control = page.locator('#root').getByRole('combobox', { name: '企业类型', exact: true }); await control.click(); const picker = page.locator('#root').getByRole('dialog'); assert.equal(await picker.getByRole('button', { name: '确认', exact: true }).count(), 0); const option = picker.locator('.m-sheet-options button').first(); const value = await option.innerText(); await option.click(); assert.equal(await picker.count(), 0); assert.ok((await control.innerText()).includes(value)); await control.click(); await picker.getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await control.innerText()).includes(value)); await control.click(); await picker.getByRole('button', { name: '清空选择', exact: true }).click(); assert.equal(await picker.count(), 0); assert.ok((await control.innerText()).includes('请选择'));
  });
  await check('邀请字段不重叠、运维无常驻工程说明、须知页面确认进入表单', async () => {
    for (const width of [320, 390, 430]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/mine'); for (const row of await page.locator('#root .m-supplier-card-mine dl > div').all()) { const dt = row.locator('dt'), dd = row.locator('dd'); const label = await dt.evaluate(n => { const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().right; }); const value = await dd.boundingBox(); assert.ok(label <= value.x + 1, await dt.innerText()); assert.ok(await dd.evaluate(n => n.scrollWidth <= n.clientWidth + 1)); } await shot('mine-no-overlap-' + width); }
    await page.setViewportSize({ width: 390, height: 845 }); await goto('mobile/rating-ops'); assert.equal(await page.locator('#root').getByText('当前为演示记录，查询与导出仅处理本页演示数据；批量发起评分暂未接通真实服务。', { exact: true }).count(), 0); assert.ok(await button('批量发起评分').isDisabled()); await goto('mobile/bank-application'); assert.equal(await page.locator('#root').getByRole('dialog', { name: '申请须知', exact: true }).count(), 0); assert.ok(await page.locator('#root').getByRole('heading', { name: '申请须知', exact: true }).isVisible()); await shot('bank-notice-page'); await button('确认申请').click(); assert.ok(await field('银行名称').isVisible()); const country = page.locator('#root [data-field-label="国家/地区"] .m-select-field'); await country.click(); const countryPicker = page.locator('#root').getByRole('dialog', { name: '国家/地区', exact: true }); assert.ok(await countryPicker.locator('.m-option-picker.is-simple').isVisible()); assert.equal(await countryPicker.getByRole('searchbox').count(), 0); assert.equal(await countryPicker.locator('.m-option-radio').count(), 0); assert.equal(await countryPicker.getByRole('button', { name: '确认', exact: true }).count(), 0); const countryOption = countryPicker.getByRole('button', { name: '中国', exact: true }); assert.equal(await countryOption.evaluate(n => getComputedStyle(n).justifyContent), 'center'); await countryOption.click(); await countryPicker.waitFor({ state: 'detached' }); assert.ok((await country.innerText()).includes('中国'));
  });
  await check('查询评分末行、批量删除确认与注册基本信息拆分', async () => {
    await goto('mobile/query?map=1&role=admin'); for (const record of await page.locator('#root .m-supplier-card').all()) assert.equal(await record.locator('dl > div:last-child dt').innerText(), '评分'); const before = await page.locator('#root .m-supplier-card').count(); await button('批量操作').click(); const disabled = page.locator('#root .m-supplier-card input[type=checkbox]:disabled'); assert.ok(await disabled.count() > 0); const choices = page.locator('#root .m-supplier-card input[type=checkbox]:enabled'); await choices.first().check(); await choices.nth(1).check(); const count = await page.locator('#root .m-supplier-card input:checked').count(); assert.equal(count, 2); await button('删除').click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.locator('#root .m-supplier-card').count(), before); await button('删除').click(); await page.locator('#root').getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await page.locator('#root .m-supplier-card').count(), before - count); await button('取消批量操作').click(); await shot('query-score-last');
    await goto('mobile/detail'); assert.equal(await page.locator('#root .m-detail .m-tabs button').count(), 9); assert.equal(await page.locator('#root .m-detail .m-section .m-label').allTextContents().then(x => x.join('|')), '供应商账号|邀请人|邀请时间|曾用名|注册邮箱'); await shot('detail-registration'); await button('基本信息').click(); assert.ok(await page.locator('#root').getByText('统一社会信用代码', { exact: true }).isVisible()); assert.ok(await page.locator('#root').getByText('经营优势及业务优势', { exact: true }).isVisible()); assert.equal(await page.locator('#root .m-section .m-label').filter({ hasText: '注册邮箱' }).count(), 0); await shot('detail-basic'); for (const [route, active] of [['mobile/detail-bank','银行信息'], ['mobile/detail-approval-empty','审批记录'], ['mobile/detail-ratings','合作信息及评分']]) { await goto(route); assert.equal(await page.locator('#root .m-detail .m-tabs [aria-current=page]').innerText(), active); }
  });
  await check('详情记录卡片宽度与标题分隔线统一', async () => {
    await goto('mobile'); await card('北京初然').getByRole('button', { name: '查看详情', exact: true }).click(); const tabs = page.locator('#root .m-detail .m-tabs');
    for (const label of ['联系人信息', '银行信息', '分配权限', '财务OU', '黑名单操作记录']) {
      await tabs.getByRole('button', { name: label, exact: true }).click();
      const collection = page.locator('#root .m-detail .m-record-collection');
      assert.equal(await collection.getAttribute('aria-label'), label);
      assert.equal(await collection.locator('.m-record-collection-header').count(), 0);
    }
    await tabs.getByRole('button', { name: '银行信息', exact: true }).click();
    const bank = page.locator('#root .m-detail .m-record-collection .m-bank-card').first(); await bank.waitFor();
    const width = await bank.evaluate(n => Math.round(n.getBoundingClientRect().width));
    const divider = node => node.locator('.m-record-heading,.m-record-card-heading').evaluate(n => getComputedStyle(n).borderBottomWidth);
    assert.equal(await divider(bank), '1px');
    await tabs.getByRole('button', { name: '财务OU', exact: true }).click();
    const finance = page.locator('#root .m-record-collection .m-record-card').first(); await finance.waitFor();
    assert.equal(await finance.evaluate(n => Math.round(n.getBoundingClientRect().width)), width); assert.equal(await divider(finance), '1px');
    await tabs.getByRole('button', { name: '黑名单操作记录', exact: true }).click();
    const blacklist = page.locator('#root .m-record-collection .m-record-card').first(); await blacklist.waitFor();
    assert.equal(await blacklist.evaluate(n => Math.round(n.getBoundingClientRect().width)), width); assert.equal(await divider(blacklist), '1px');
    await tabs.getByRole('button', { name: '合作信息及评分', exact: true }).click();
    const ratingList = page.locator('#root .m-rating-list'); assert.equal(await ratingList.evaluate(n => getComputedStyle(n).paddingLeft), '16px'); assert.equal(await ratingList.evaluate(n => getComputedStyle(n).paddingRight), '16px'); assert.equal(await ratingList.evaluate(n => Math.round(n.getBoundingClientRect().width - parseFloat(getComputedStyle(n).paddingLeft) - parseFloat(getComputedStyle(n).paddingRight))), width); const ratingCard = ratingList.locator('.m-bank-card').first(); if (await ratingCard.count()) { assert.equal(await ratingCard.locator(':scope > h3').evaluate(n => getComputedStyle(n).borderBottomWidth), '1px'); assert.equal(await ratingCard.locator(':scope > h3').evaluate(n => getComputedStyle(n).fontSize), '16px'); }
  });
  await check('审批历史按单号卡片折叠，当前进度保持展开', async () => {
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/approval-history'); const cards = page.locator('#root .m-approval-history-card'); assert.equal(await cards.count(), 2); assert.ok((await page.locator('#root .m-approval > .m-section:first-of-type').innerText()).includes('资料变更')); const first = cards.nth(0), second = cards.nth(1); assert.equal(await first.getAttribute('open'), null); await first.locator('summary').click(); assert.equal(await first.locator('.m-approval-timeline').count(), 0); assert.ok(await first.getByText('发起时间', { exact: true }).isVisible()); await second.locator('summary').click(); assert.notEqual(await first.getAttribute('open'), null); assert.notEqual(await second.getAttribute('open'), null); assert.equal(await second.locator('.m-approval-timeline').count(), 0); assert.ok(await second.getByText('发起人', { exact: true }).isVisible()); await shot('approval-history-' + width); await first.locator('summary').focus(); await page.keyboard.press('Enter'); assert.equal(await first.getAttribute('open'), null); assert.notEqual(await second.getAttribute('open'), null); assert.equal(await page.locator('#root .m-approval > .m-section:first-of-type .m-approval-timeline > li').count(), 4); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); } await page.setViewportSize({ width: 390, height: 845 }); await goto('mobile'); await card('快速创建').getByRole('button', { name: '查看详情', exact: true }).click(); await button('审批记录').click(); assert.equal(await page.locator('#root .m-approval-history-card').count(), 0);
  });
  await check('单条和批量变更邀请人两行对齐且互不重叠', async () => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 845 });
      for (const route of ['mobile/inviter', 'mobile/inviter-batch?map=1']) {
        await goto(route);
        const group = page.locator('#root .m-inviter-applicants');
        const previousRow = group.locator('.m-row');
        const nextRow = group.locator('[data-field-label="新邀请人"]');
        const picker = nextRow.getByRole('button', { name: '新邀请人', exact: true });
        const [previous, next, previousLabel, nextLabel, previousValue, nextValue, control] = await Promise.all([
          previousRow.boundingBox(), nextRow.boundingBox(), previousRow.locator('.m-label').boundingBox(),
          nextRow.locator('.m-field-name').boundingBox(), previousRow.locator('.m-value').boundingBox(),
          picker.locator('span').boundingBox(), picker.boundingBox(),
        ]);
        assert.ok(previous.y + previous.height <= next.y);
        assert.ok(Math.abs(previous.height - next.height) <= 1);
        assert.ok(Math.abs(previousLabel.x + 12 - nextLabel.x) <= 1);
        assert.ok(Math.abs(previousValue.x + 13 - nextValue.x) <= 1);
        assert.ok(control.height >= 44 && nextLabel.x + nextLabel.width <= control.x);
      }
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('我的邀请批量删除校验全部所选记录并复核确认', async () => {
    await goto('mobile/mine');
    await button('批量操作').click();
    const first = page.getByRole('checkbox', { name: '选择代注册草稿', exact: true });
    const second = page.getByRole('checkbox', { name: '选择邀请注册企业000253', exact: true });
    const approved = page.getByRole('checkbox', { name: '选择快速创建557348', exact: true });
    await first.check();
    await second.check();
    await approved.check();
    await button('删除').click();
    await page.getByRole('dialog', { name: '批量操作校验', exact: true }).getByRole('heading', { name: '无法删除', exact: true }).waitFor();
    await button('知道了').click();
    assert.ok(await first.isChecked() && await second.isChecked());
    await approved.uncheck();
    await button('删除').click();
    await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
    assert.ok(await first.isChecked() && await second.isChecked());
    await button('删除').click();
    await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click();
    assert.equal(await first.count(), 0);
    assert.equal(await second.count(), 0);
    assert.ok(await approved.isVisible());
  });
  await check('切换评分页面时动效正文避开白色导航栏和底栏', async () => {
    await goto('mobile/my-ratings');
    const result = await page.getByRole('button', { name: '评分', exact: true }).first().evaluate(control => {
      control.click();
      const shell = document.querySelector('#root .mobile-page');
      const header = shell.querySelector('.m-header');
      const footer = shell.querySelector('.m-actions');
      const clips = [...document.querySelectorAll('.m-motion-ghost')].map(node =>
        [...node.style.clipPath.matchAll(/([0-9.]+)px/g)].map(match => Number(match[1])));
      return { clips, top: header.getBoundingClientRect().bottom, bottom: innerHeight - footer.getBoundingClientRect().top,
        colors: [getComputedStyle(header).backgroundColor, getComputedStyle(footer).backgroundColor] };
    });
    assert.deepEqual(result.colors, ['rgb(255, 255, 255)', 'rgb(255, 255, 255)']);
    assert.ok(result.clips.length >= 1);
    for (const [top, , bottom] of result.clips) {
      assert.ok(top >= result.top - 1 && bottom >= result.bottom - 1);
    }
  });
  await check('填写供应商评分通过页首返回，未保存评分可继续编辑或放弃', async () => {
    await goto('mobile/my-ratings');
    const score = page.locator('#root .m-rating-list article').first().getByRole('button', { name: '评分', exact: true });
    await score.click();
    const footer = page.locator('#root [data-scene="rating-edit"] .m-actions');
    assert.deepEqual(await footer.getByRole('button').allTextContents(), ['提交']);
    await headerBack();
    await score.click();
    await page.getByRole('slider', { name: '人员/服务质量', exact: true }).press('ArrowRight');
    await headerBack();
    await button('继续编辑').click();
    assert.equal(await page.getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), '0.5');
    await headerBack();
    await button('放弃修改').click();
    await score.waitFor();
  });
  await check('我的邀请批量操作提交校验与新邀请人确认', async () => {
    await goto('mobile/mine'); await button('批量操作').click(); assert.equal(await page.locator('#root .m-batch-help').count(), 0); await page.locator('#root').getByRole('checkbox', { name: '选择快速创建557348', exact: true }).check(); assert.ok(await button('删除').isVisible()); await button('批量变更邀请人').click(); await page.locator('#root [data-scene="inviter-batch"]').waitFor(); await button('新邀请人').click(); await page.locator('#root').getByRole('searchbox', { name: '搜索姓名或工号', exact: true }).fill('周辉'); await page.locator('#root .m-reference-card').getByRole('heading', { name: '周辉', exact: true }).click(); assert.ok(await button('确认').isVisible()); await button('确认').click(); await button('提交').click(); await page.locator('#root').getByRole('dialog', { name: '提示', exact: true }).getByRole('button', { name: '确认', exact: true }).click(); await button('供应商查询').click(); assert.ok((await card('快速创建').innerText()).includes('周辉'));
  });
  await check('普通卡片字段与开户证明和报价附件复用移动样式', async () => {
    for (const [route, fieldSelector, valueSelector] of [
      ['query', '.m-supplier-card dl > div', 'dd'],
      ['my-ratings', '.m-rating-list .m-row', '.m-value'],
      ['workspace-home', '.m-portal-identity-details .m-row', '.m-value'],
      ['workspace-tasks', '.m-portal-task-card .m-row', '.m-value'],
      ['workspace-info', '.m-workspace .m-section-content .m-row', '.m-value'],
    ]) {
      await goto('mobile/' + route);
      const row = page.locator(fieldSelector).first();
      assert.equal(await row.evaluate(el => getComputedStyle(el).minHeight), route === 'workspace-home' ? '20px' : '36px', route);
      assert.equal(await row.evaluate(el => getComputedStyle(el).lineHeight), route === 'workspace-home' ? '20px' : '22px', route);
      assert.equal(await row.locator(valueSelector).evaluate(el => getComputedStyle(el).textAlign), 'right', route);
    }
    await goto('mobile/bank');
    await button('添加银行账户').click();
    const proof = page.locator('[data-field-label="开户证明"]');
    const proofSelect = proof.getByRole('button', { name: '选择开户证明', exact: true });
    const appearance = node => {
      const style = getComputedStyle(node);
      return [style.minHeight, style.borderRadius, style.backgroundColor, style.color, style.fontSize];
    };
    const proofCamera = proof.getByRole('button', { name: '拍照上传开户证明', exact: true });
    assert.deepEqual(await proofSelect.evaluate(appearance), ['44px', '12px', 'rgb(229, 241, 255)', 'rgb(20, 92, 255)', '14px']);
    assert.deepEqual(await proofCamera.evaluate(appearance), await proofSelect.evaluate(appearance));
    const [fileBox, cameraBox] = await Promise.all([proofSelect.boundingBox(), proofCamera.boundingBox()]);
    assert.equal(fileBox.width, cameraBox.width);
    assert.equal(cameraBox.x - fileBox.x - fileBox.width, 8);
    const chooser = page.waitForEvent('filechooser');
    await proofSelect.click();
    await (await chooser).setFiles(upload);
    const removeStyle = await proof.getByRole('button', { name: '移除开户证明', exact: true }).evaluate(appearance);
    await goto('mobile/workspace-quote-detail?record=MOCK-INQ-001');
    assert.equal(await page.getByText('修改后将同步到全部明细税率。', { exact: true }).count(), 0);
    const rate = page.locator('.m-quote-rate').getByRole('textbox', { name: '税率（%）', exact: true });
    await rate.fill('6');
    const itemRates = page.locator('.m-portal-pricing > .m-section').filter({ has: page.getByRole('heading', { name: /^[0-9]+\./ }) })
      .locator('.m-row').filter({ hasText: '税率（%）' }).locator('.m-value');
    const values = await itemRates.allTextContents();
    assert.ok(values.length > 0 && values.every(value => value === '6'));
    await button('编辑第1项报价').click();
    const quote = page.locator('[data-field-label="报价附件"]');
    const chooseAttachment = quote.getByRole('button', { name: '选择文件', exact: true });
    assert.equal(await quote.locator('input[capture]').count(), 0);
    const input = quote.locator('input[type="file"][id]');
    assert.equal(await input.getAttribute('multiple'), '');
    const quoteChooser = page.waitForEvent('filechooser');
    await chooseAttachment.click();
    await (await quoteChooser).setFiles(upload);
    assert.deepEqual(await quote.getByRole('button', { name: '删除报价附件1', exact: true }).evaluate(appearance), removeStyle);
  });
  await check('门户报价详情询价资料前置及报价附件多文件编辑', async () => {
    await goto('mobile/workspace-home'); await button('报价管理待处理').click(); await button('报价').click();
    const headings = await page.locator('#root .m-portal-pricing > .m-section > h2').allTextContents();
    assert.equal(headings[0], '询价资料'); assert.equal(headings[1], '1. Dell.R740');
    assert.ok(await page.locator('#root .m-portal-pricing').getByText('采购类型', { exact: true }).isVisible());
    assert.equal(await page.locator('#root .m-portal-object-summary .m-field').count(), 0);
    const edit = button('编辑第1项报价');
    assert.equal(await edit.innerText(), '编辑');
    await edit.click();
    const editor = page.locator('#root .m-pricing-editor');
    const attachmentField = editor.locator('.m-multi-attachment-field');
    const labelBox = await attachmentField.locator('label').boundingBox(), controlBox = await attachmentField.locator('.m-field-control').boundingBox();
    assert.ok(controlBox.y >= labelBox.y + labelBox.height); assert.ok(Math.abs(controlBox.x - labelBox.x) <= 13);
    await editor.getByLabel('报价附件', { exact: true }).setInputFiles([
      { name: '报价附件A.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') },
      { name: '报价附件B.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('test workbook') }
    ]);
    assert.equal(await editor.locator('.m-multi-attachment-item').count(), 2);
    assert.equal(await editor.getByRole('button', { name: '替换文件', exact: true }).count(), 0);
    await editor.getByRole('button', { name: '删除报价附件1', exact: true }).click();
    await page.locator('#root').getByRole('dialog').last().getByRole('button', { name: '确认', exact: true }).click();
    assert.equal(await editor.locator('.m-multi-attachment-item').count(), 1);
    await editor.getByRole('textbox', { name: '含税单价', exact: true }).fill('100');
    await editor.getByRole('textbox', { name: '税率（%）', exact: true }).fill('13');
    await editor.getByRole('button', { name: '确定', exact: true }).click();
    await page.locator('#root [data-scene="workspace-quote-detail"]').waitFor();
    assert.ok(await button('查看附件：报价附件B.xlsx').isVisible());
    assert.equal(await button('查看附件：报价附件A.pdf').count(), 0);
  });
  await check('门户价税订单资料前置及发票金额红字提醒', async () => {
    await goto('mobile/workspace-tax-detail');
    const headings = await page.locator('#root .m-portal-pricing > .m-section > h2').allTextContents();
    assert.equal(headings[0], '1. Dell.R740');
    assert.equal(await page.locator('#root .m-order-info-card .m-record-heading h2').innerText(), 'DEMO-ORDER-001');
    assert.equal(await page.locator('#root .m-order-info-card .m-record-heading .m-status').innerText(), '待处理');
    assert.equal(await page.locator('#root .m-portal-object-summary').count(), 0);
    assert.ok(await page.locator('#root .m-portal-pricing > .m-section').first().getByText('采购类型', { exact: true }).isVisible());
    const warning = page.locator('#root .m-pricing-warning');
    assert.equal(await warning.innerText(), '请您按照发票金额填写并检查，否则会影响后续付款！');
    assert.equal(await warning.evaluate(node => getComputedStyle(node).color), 'rgb(180, 35, 24)');
  });
  await check('差旅四类账单在当前页面上传并透传对应差旅入口', async () => {
    await goto('mobile/workspace-travel');
    assert.equal(await page.locator('#root').getByRole('textbox', { name: '账期', exact: true }).count(), 0);
    assert.equal(await button('返回工作台').count(), 0);
    assert.equal(await page.locator('#root .m-travel-upload-entry').count(), 4);
    const entries = [['train', '火车账单'], ['hotel', '酒店账单'], ['flight', '飞机账单'], ['rental', '租车账单']];
    for (const [key, label] of entries) {
      const row = page.locator(`#root [data-travel-type="${key}"]`);
      const input = row.getByLabel(label + '附件', { exact: true });
      assert.equal(await input.evaluate(node => node.multiple), true);
      assert.equal(await input.getAttribute('accept'), null);
      assert.ok(await row.getByRole('button', { name: label + '上传附件', exact: true }).isVisible());
    }
    const select = async (type, names) => page.evaluate(({ type, names }) => {
      const input = document.querySelector(`#root [data-travel-type="${type}"] input[type="file"]`);
      const transfer = new DataTransfer();
      names.forEach(name => transfer.items.add(new File(['bill'], name)));
      Object.defineProperty(input, 'files', { configurable: true, value: transfer.files });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, { type, names });
    await page.evaluate(() => { delete window.__PORTAL_TRAVEL_UPLOAD__; });
    await select('train', ['火车账单.pdf']);
    await page.waitForFunction(() => document.querySelector('#root [data-travel-type="train"]')?.dataset.uploadStatus === 'success');
    assert.ok(await page.locator('#root [data-travel-type="train"]').getByText('上传成功，共 1 个附件', { exact: true }).isVisible());
    await page.evaluate(() => {
      window.__PORTAL_TRAVEL_UPLOAD_CALLS__ = [];
      window.__PORTAL_TRAVEL_UPLOAD__ = async ({ type, files, timeoutMs }) => {
        window.__PORTAL_TRAVEL_UPLOAD_CALLS__.push({ type, names: files.map(file => file.name), timeoutMs });
        return { success: true };
      };
    });
    const selected = {
      train: ['火车账单A.pdf', '火车账单B.txt'],
      hotel: ['酒店账单.csv'],
      flight: ['飞机账单.xlsx'],
      rental: ['租车账单.bin']
    };
    for (const [key] of entries) {
      await select(key, selected[key]);
      await page.waitForFunction(key => document.querySelector(`#root [data-travel-type="${key}"]`)?.dataset.uploadStatus === 'success', key);
    }
    const calls = await page.evaluate(() => window.__PORTAL_TRAVEL_UPLOAD_CALLS__);
    assert.deepEqual(calls, [
      { type: 'train', names: ['火车账单A.pdf', '火车账单B.txt'], timeoutMs: 180000 },
      { type: 'hotel', names: ['酒店账单.csv'], timeoutMs: 180000 },
      { type: 'flight', names: ['飞机账单.xlsx'], timeoutMs: 180000 },
      { type: 'rental', names: ['租车账单.bin'], timeoutMs: 180000 }
    ]);
  });

  await check('门户待办角标、双邮箱验证及密码修改', async () => {
    await goto('mobile/workspace-home');
    assert.equal(await page.locator('#root .m-portal-pending-count').count(), 2);
    assert.equal(await page.locator('.m-portal-entry-grid').first().evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 3);
    assert.equal(await page.locator('.m-portal-entry-icon img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 20).length), 7);
    assert.ok(await button('退出账号').isVisible());
    const rightEdges = await page.locator('#root .m-portal-home-identity :is(.m-status, .m-value)').evaluateAll(nodes => nodes.map(node => {
      const text = document.createRange();
      text.selectNodeContents(node);
      return text.getBoundingClientRect().right;
    }));
    assert.ok(rightEdges.every(edge => Math.abs(edge - rightEdges[0]) < 1));

    const checkSecurityLayout = async label => {
      const layout = await page.locator('#root .m-form-summary').evaluate((summary, fieldLabel) => {
        const readLabel = summary.querySelector('.m-label');
        const value = summary.querySelector('.m-value');
        const field = [...summary.parentElement.querySelectorAll('[data-field-label]')].find(node => node.dataset.fieldLabel === fieldLabel);
        const editLabel = field.querySelector('.m-field-name');
        const edit = field.querySelector('input');
        return {
          readLabel: readLabel.getBoundingClientRect().toJSON(),
          readValue: value.getBoundingClientRect().toJSON(),
          editLabel: editLabel.getBoundingClientRect().toJSON(),
          editControl: field.querySelector('.m-field-control').getBoundingClientRect().toJSON(),
          align: getComputedStyle(value).textAlign,
          labels: [readLabel, editLabel].map(node => getComputedStyle(node).color),
          values: [value, edit].map(node => getComputedStyle(node).color),
          gap: summary.nextElementSibling.getBoundingClientRect().top - summary.getBoundingClientRect().bottom,
        };
      }, label);
      assert.ok(layout.readLabel.right <= layout.readValue.left);
      assert.equal(layout.readLabel.top, layout.readValue.top);
      assert.equal(layout.readValue.right, layout.editControl.right);
      assert.equal(layout.align, 'right');
      assert.ok(layout.editLabel.bottom < layout.editControl.top);
      assert.equal(layout.labels[0], layout.labels[1]);
      assert.equal(layout.values[0], layout.values[1]);
      assert.equal(layout.gap, 16);
    };
    await button('修改注册邮箱').click();
    await checkSecurityLayout('邮箱验证码');
    await button('下一步').click();
    assert.ok(await page.getByText('请输入邮箱验证码', { exact: true }).isVisible());
    await button('获取验证码').click(); await button('下一步').click();
    await field('新邮箱').waitFor();
    await checkSecurityLayout('新邮箱');
    await field('新邮箱').fill('updated@example.invalid');
    await button('获取验证码').click(); await button('保存').click();
    await page.locator('#root [data-scene="workspace-home"]').waitFor();
    assert.ok(await page.locator('#root .m-portal-identity-details').getByText('updated@example.invalid', { exact: true }).isVisible());
    await button('修改密码').click();
    await checkSecurityLayout('新密码');
    await button('获取验证码').click();
    await page.locator('#root').getByLabel('新密码', { exact: true }).fill('Mock-Password-A1');
    await page.locator('#root').getByLabel('确认新密码', { exact: true }).fill('Mock-Password-B1');
    await button('保存').click();
    assert.ok(await page.locator('#root').getByText('两次输入的密码不一致', { exact: true }).isVisible());
    await page.locator('#root').getByLabel('确认新密码', { exact: true }).fill('Mock-Password-A1');
    await button('保存').click();
    await page.locator('#root [data-scene="workspace-home"]').waitFor();
  });
  await check('采购待办和已办标题及日期控件在三种宽度保持一致', async () => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 845 });
      for (const tab of [0, 1, 2, 3]) {
        await goto('mobile/workspace-tasks?map=1&tab=' + tab);
        const quote = tab < 2;
        assert.equal(await page.locator('#root .mobile-page > .m-header h1').innerText(), quote ? '采购报价' : '价税拆分');
        await button(quote ? '筛选报价' : '筛选价税拆分').click();
        const date = page.locator('#root .m-date-range');
        assert.deepEqual(await date.locator('.m-select-field').allInnerTexts(), ['选择开始日期', '选择结束日期']);
        const [start, end, separator] = await Promise.all([
          date.getByRole('button', { name: '单据日期（起）', exact: true }).boundingBox(),
          date.getByRole('button', { name: '单据日期（止）', exact: true }).boundingBox(),
          date.locator('.m-date-range-separator').boundingBox(),
        ]);
        assert.ok(Math.abs(start.width - end.width) <= 1);
        assert.ok(Math.abs(start.y - end.y) <= 1);
        assert.ok(Math.abs((separator.y + separator.height / 2) - (end.y + end.height / 2)) <= 2);
      }
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('各筛选日期逆序标记结束字段并保留已选日期', async () => {
    for (const [route, openLabel, startLabel, endLabel] of [
      ['mobile', '筛选供应商', '邀请时间（起）', '邀请时间（止）'],
      ['mobile/workspace-tasks?map=1&tab=0', '筛选报价', '单据日期（起）', '单据日期（止）'],
      ['mobile/my-ratings', '筛选评分', '评分时间（起）', '评分时间（止）'],
      ['mobile/rating-ops', '筛选评分运维', '创建时间（起）', '创建时间（止）'],
    ]) {
      await goto(route); await button(openLabel).click();
      for (const [label, month] of [[startLabel, '11月'], [endLabel, '10月']]) {
        await button(label).click();
        const picker = page.getByRole('dialog', { name: label, exact: true });
        await picker.getByRole('option', { name: month, exact: true }).click();
        await picker.getByRole('button', { name: '确认', exact: true }).click();
      }
      const dates = await Promise.all([button(startLabel).innerText(), button(endLabel).innerText()]);
      await button('应用筛选').click();
      const end = button(endLabel);
      assert.equal(await end.getAttribute('aria-invalid'), 'true');
      assert.equal(await button(startLabel).getAttribute('aria-invalid'), 'false');
      assert.deepEqual(await Promise.all([button(startLabel).innerText(), end.innerText()]), dates);
      await end.click(); await button('清空日期').click();
      assert.equal(await end.getAttribute('aria-invalid'), 'false');
      await button('应用筛选').click();
      assert.equal(await end.count(), 0);
    }
  });
  await check('银行只读详情保留账户字段，编辑仍展示开户证明', async () => {
    for (const route of ['mobile/detail-bank', 'mobile/workspace-info?map=1&tab=2']) {
      await goto(route);
      const card = page.locator('#root .m-bank-card').first();
      assert.ok(await card.getByText('开户银行', { exact: true }).isVisible());
      assert.equal(await card.getByText('开户证明', { exact: true }).count(), 0);
    }
    await goto('mobile/bank');
    await button('添加银行账户').click();
    assert.equal(await page.locator('#root').getByLabel('开户证明', { exact: true }).count(), 1);
  });
  await check('门户筛选字段、独立页签、取消及重置', async () => {
    const back = () => page.locator('#root .m-portal-task-filter').getByRole('button', { name: '返回', exact: true }).click();
    await goto('mobile/workspace-home'); await button('报价管理待处理').click(); await button('筛选报价').click(); await field('采购单位').fill('演示采购'); await choose('采购类型', '服务器'); await button('应用筛选').click(); assert.ok(await button('报价').isVisible());
    await button('筛选报价').click(); await field('采购单位').fill('不存在'); await back(); assert.ok(await button('报价').isVisible());
    await button('已处理').click(); await button('筛选报价').click(); assert.equal(await field('采购单位').inputValue(), ''); await back();
    await button('待处理').click(); assert.equal(await page.locator('#root .m-filter-notice').getByRole('status').innerText(), '已应用2项条件');
    await button('筛选报价').click(); assert.equal(await field('采购单位').inputValue(), '演示采购'); await back();
    await headerBack(); await button('价税拆分待处理').click(); await page.locator('#root').getByRole('searchbox',{name:'搜索订单编号',exact:true}).fill('不存在'); assert.ok(await page.locator('#root').getByText('暂无匹配的订单',{exact:true}).isVisible()); await button('筛选价税拆分').click(); assert.ok(await field('采购公司').isVisible()); await button('重置').click(); await button('应用筛选').click(); assert.ok(await page.locator('#root').getByText('暂无匹配的订单',{exact:true}).isVisible()); await button('清空搜索').click(); assert.ok(await button('价税拆分').isVisible());
  });
  await check('采购报价和价税拆分各页签清除条件保留搜索', async () => {
    for (const tab of [0, 1, 2, 3]) {
      await goto('mobile/workspace-tasks?map=1&tab=' + tab);
      const quote = tab < 2;
      const search = field(quote ? '搜索询价单号' : '搜索订单编号');
      const filterButton = button(quote ? '筛选报价' : '筛选价税拆分');
      const businessTab = button(tab % 2 ? '已处理' : '待处理');
      await search.fill('演示编号');
      await filterButton.click();
      await field(quote ? '采购单位' : '采购公司').fill('演示采购');
      await button('应用筛选').click();
      await page.locator('#root').getByText('已应用1项条件', { exact: true }).waitFor();
      assert.match(await filterButton.locator('img').getAttribute('src'), /filter-active\.svg$/);
      await button('清除条件').click();
      assert.equal(await search.inputValue(), '演示编号');
      assert.equal(await businessTab.getAttribute('aria-current'), 'page');
      assert.match(await filterButton.locator('img').getAttribute('src'), /\/filter\.svg$/);
    }
  });
  for (const width of [320, 390, 430, 768]) await check('代表页面宽度 ' + width, async () => {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 845 });
    for (const route of ['mobile', 'mobile/bank-form-selected', 'mobile/register-contacts', 'mobile/permissions', 'mobile/my-ratings', 'mobile/rating-ops', 'mobile/bank-application-form', 'mobile/rating-edit', 'mobile/portal', 'mobile/workspace-home', 'mobile/workspace-info', 'mobile/workspace-tasks', 'mobile/workspace-tax-detail', 'mobile/workspace-account', 'mobile/mine-batch']) {
      await goto(route); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + '横向溢出');
      if (width === 390) await shot('layout-' + route.split('/').at(-1));
    }
  });
  await check('电脑与移动入口切换样式隔离', async () => { await goto('login'); await page.locator('body').waitFor(); await goto('mobile'); assert.equal(await page.locator('#root .mobile-page').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(244, 247, 250)'); });
  await check('账号邮箱去除首尾空格，密码保留空格进入登录验证', async () => {
    await goto('mobile/portal');
    await field('账号').pressSequentially('Juniper Crest');
    await field('账号').blur();
    assert.equal(await field('账号').inputValue(), 'Juniper Crest');
    await field('账号').fill('　 supplier-demo  '); await field('账号').blur();
    assert.equal(await field('账号').inputValue(), 'supplier-demo');
    await page.getByLabel('密码', { exact: true }).fill(' 123456');
    await field('验证码').fill('cbvs');
    await button('下一步').click();
    await page.getByText('密码错误', { exact: true }).waitFor();
    await page.getByLabel('密码', { exact: true }).fill('123456');
    await button('下一步').click();
    await field('注册邮箱').fill('　 supplier@example.com  '); await field('注册邮箱').blur();
    assert.equal(await field('注册邮箱').inputValue(), 'supplier@example.com');
    await button('发送验证码').click();
    await field('邮箱验证码').fill('123456');
    await button('登录').click();
    await page.locator('#root [data-scene="workspace-home"]').waitFor();
    assert.ok((await page.locator('#root .m-portal-identity-details').innerText()).includes('supplier-demo'));
  });
  await check('移动注册定位首个错误字段并在提交失败时返回对应步骤', async () => {
    const waitForFocus = label => page.waitForFunction(name => {
      const active = document.activeElement;
      const box = active.getBoundingClientRect();
      return active.getAttribute('aria-label') === name && box.top >= 56 && box.bottom <= innerHeight - 68;
    }, label);
    await goto('mobile/register');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await button('下一步（1/4）').click();
    await waitForFocus('选择营业执照');
    assert.equal(await field('供应商名称').getAttribute('aria-invalid'), 'false');

    await goto('mobile/register?map=1&step=3');
    await button('提交').click();
    await waitForFocus('注册地址');
    assert.match(await page.locator('#root .m-registration-steps [aria-current="step"]').innerText(), /基本信息/);
    assert.equal(await field('供应商名称').inputValue(), '北京初然文化传媒有限公司483920');

    await goto('mobile/register?map=1&step=1');
    await button('下一步（2/4）').click();
    await waitForFocus('添加联系人');
    await button('添加联系人').click();
    await button('保存').click();
    await waitForFocus('姓名');

    await goto('mobile/register?map=1&step=2&panel=bank');
    const section = button('开户银行信息');
    await section.click();
    assert.equal(await section.getAttribute('aria-expanded'), 'false');
    await button('添加').click();
    await waitForFocus('账户类型');
    assert.equal(await section.getAttribute('aria-expanded'), 'true');
  });

  await check('注册邮箱与后续必填项同时错误时优先定位邮箱', async () => {
    for (const route of ['workspace-info?map=1&edit=1&step=0', 'register', 'register-supplier?map=1&step=0']) {
      await goto('mobile/' + route);
      if (route.startsWith('register')) {
        await page.locator('#root').getByLabel('营业执照', { exact: true }).setInputFiles(upload);
        if (route === 'register') await field('供应商名称').fill('注册邮箱优先定位测试');
      }
      const email = field('注册邮箱');
      const creditCode = field('统一社会信用代码');
      await creditCode.clear();
      for (const [value, message] of [['', '请填写注册邮箱'], ['格式错误', '请输入正确的注册邮箱']]) {
        await email.fill(value);
        await button('下一步（1/4）').click();
        await page.locator('#root [data-field-label="注册邮箱"] .m-field-error').getByText(message, { exact: true }).waitFor();
        await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === '注册邮箱');
        assert.equal(await creditCode.getAttribute('aria-invalid'), 'false');
      }
      await email.fill('order@example.com');
      await button('下一步（1/4）').click();
      await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === '统一社会信用代码');
    }
  });
  await check('受邀注册按页面顺序定位多个错误中的第一个字段', async () => {
    await goto('mobile/register-supplier?map=1');
    await button('提交').click();
    await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === '账号');
    await field('账号').fill('注册校验定位测试');
    await button('提交').click();
    await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === '密码');
    assert.equal(await field('账号').inputValue(), '注册校验定位测试');
  });
  await check('受邀注册处理账号首尾空格并校验密码', async () => {
    await goto('mobile/register-supplier?map=1');
    await field('账号').fill('　注册空格测试  '); await field('账号').blur();
    assert.equal(await field('账号').inputValue(), '注册空格测试');
    await page.getByLabel('密码', { exact: true }).fill('Abc12345 ');
    await page.getByLabel('确认密码', { exact: true }).fill('Abc12345 ');
    await field('验证码').fill('cbvs');
    await button('提交').click();
    await page.locator('#root .m-registration-steps-horizontal').waitFor();
    assert.equal(await page.locator('#root .m-supplier-account-registration').count(), 0);
  });
  await check('评分数量随搜索和筛选更新，状态切换维持同一统计范围', async () => {
    await goto('mobile/my-ratings');
    const counts = () => page.locator('#root .m-count-tabs strong').allTextContents();
    assert.deepEqual(await counts(), ['4', '2', '2']);
    await button('未评分').click();
    assert.deepEqual(await counts(), ['4', '2', '2']);
    assert.equal(await page.locator('#root .m-rating-list .m-bank-card').count(), 2);
    await page.getByRole('searchbox', { name: '搜索供应商或合作事项', exact: true }).fill('快速创建');
    assert.deepEqual(await counts(), ['1', '0', '1']);
    assert.equal(await page.locator('#root .m-rating-list .m-bank-card').count(), 0);
    await button('已评分').click();
    assert.deepEqual(await counts(), ['1', '0', '1']);
    assert.equal(await page.locator('#root .m-rating-list .m-bank-card').count(), 1);
    await button('清空搜索').click();
    await button('筛选评分').click();
    await choose('合作类型', '电子产品');
    await button('应用筛选').click();
    assert.deepEqual(await counts(), ['0', '0', '0']);
  });
  await check('修改密码保留空格并校验两次一致，正确邮箱保存后可回看', async () => {
    await goto('mobile/workspace-account-password?map=1');
    await button('获取验证码').click();
    await page.locator('#root').getByLabel('新密码', { exact: true }).fill('Abc12345　');
    await page.locator('#root').getByLabel('确认新密码', { exact: true }).fill('Abc12345');
    await button('保存').click();
    assert.ok(await page.getByText('两次输入的密码不一致', { exact: true }).isVisible());
    await page.locator('#root').getByLabel('确认新密码', { exact: true }).fill('Abc12345　');
    await button('保存').click();
    await page.locator('#root [data-scene="workspace-home"]').waitFor();
    await goto('mobile/workspace-account-email?map=1');
    await button('获取验证码').click(); await button('下一步').click();
    await field('新邮箱').fill('　trimmed@example.invalid '); await field('新邮箱').blur();
    assert.equal(await field('新邮箱').inputValue(), 'trimmed@example.invalid');
    await button('获取验证码').click(); await button('保存').click();
    await page.locator('#root [data-scene="workspace-home"]').waitFor();
    assert.ok((await page.locator('#root .m-portal-identity-details').innerText()).includes('trimmed@example.invalid'));
  });
  await check('结果栏同行并高亮数字，卡片状态和正文对齐', async () => {
    for (const width of [320, 375, 430]) {
      await page.setViewportSize({ width, height: 845 });
      for (const route of ['query', 'mine']) {
        await goto('mobile/' + route + (route === 'query' ? '?map=1&role=admin' : ''));
        const results = page.locator('#root').getByRole('region', { name: '查询结果' });
        const count = results.locator('.m-result-count');
        const number = count.locator('.m-result-count-value');
        const action = results.getByRole('button', { name: '批量操作', exact: true });
        const [c, b] = await Promise.all([count.boundingBox(), action.boundingBox()]);
        assert.ok(b.x > c.x + c.width && Math.abs(b.y + b.height / 2 - c.y - c.height / 2) < 1);
        assert.ok(Number(await number.innerText()) >= await page.locator('#root .m-supplier-card').count());
        assert.equal(await number.evaluate(el => getComputedStyle(el).color), 'rgb(20, 92, 255)');
        assert.notEqual(await count.evaluate(el => getComputedStyle(el).color), 'rgb(20, 92, 255)');
        const card = page.locator('#root .m-supplier-card').first();
        assert.equal(await card.locator('.m-supplier-heading').evaluate(el => getComputedStyle(el).flexWrap), 'nowrap');
        assert.equal(await card.locator('dd').first().evaluate(el => getComputedStyle(el).textAlign), 'right');
        const tags = await page.locator('#root .m-supplier-heading > .m-status').evaluateAll(nodes => nodes.map(node => {
          const style = getComputedStyle(node);
          return { tone: node.dataset.tone, text: style.color, stroke: style.borderTopColor, width: style.borderTopWidth };
        }));
        assert.ok(tags.length > 0 && tags.every(tag => tag.stroke !== tag.text && tag.width === '1px'));
        assert.equal(tags.find(tag => tag.tone === 'neutral').text, 'rgb(102, 111, 129)');
        await action.click();
        assert.ok(await results.getByRole('button', { name: '取消批量操作', exact: true }).isVisible());
        await shot('result-' + route + '-' + width);
      }
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('登记和资料修改逐字段核对上下排版及营业执照上传', async () => {
    for (const [route, expected] of [
      ['register', '供应商类型'],
      ['register-edit?map=1', '供应商类型'],
      ['register-edit-all?map=1', '供应商类型'],
      ['register-supplier?map=1&step=0', '注册邮箱'],
      ['workspace-info?edit=1', '注册邮箱'],
    ]) {
      await goto('mobile/' + route);
      const panel = page.locator('#root .m-supplier-basic-fields');
      await panel.locator('[data-field-label="' + expected + '"]').waitFor();
      const fields = await panel.locator(':scope > .m-field').evaluateAll(nodes => nodes.map(field => {
        const label = field.querySelector(':scope > label').getBoundingClientRect();
        const control = field.querySelector(':scope > .m-field-control').getBoundingClientRect();
        return { name: field.dataset.fieldLabel, gap: control.top - label.bottom, width: control.width,
          readOnly: !!field.querySelector('input[readonly]'), inline: label.right <= control.left && label.top === control.top };
      }));
      assert.ok(fields.length > 10);
      for (const field of fields) {
        assert.ok(field.readOnly ? field.inline : field.gap >= 7 && field.width > 290, route + ' · ' + field.name);
      }
    }
    await goto('mobile/register?map=1&step=3');
    const registrationPreview = page.locator('#root .m-registration-preview');
    await registrationPreview.locator('.m-preview-basic').waitFor();
    assert.equal(await registrationPreview.locator('.m-qualification-section').count(), 0);
    await goto('mobile/register');
    const chooseLicense = button('选择营业执照');
    assert.equal(await chooseLicense.innerText(), '选择文件');
    assert.equal((await chooseLicense.boundingBox()).height, 44);
    const chooser = page.waitForEvent('filechooser');
    await chooseLicense.click();
    await (await chooser).setFiles({ name: '营业执照.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await button('查看附件：营业执照.pdf').waitFor();

    const camera = page.waitForEvent('filechooser');
    await button('拍照上传营业执照').click();
    const cameraInput = await camera;
    assert.equal(await cameraInput.element().getAttribute('capture'), 'environment');
    await cameraInput.setFiles(upload);
    const link = page.locator('#root').getByRole('button', { name: '查看附件：测试证明.png', exact: true });
    await link.click();
    await page.locator('#root').getByRole('button', { name: '打开附件', exact: true }).click();
    await page.locator('#root .m-attachment-full').waitFor();
  });
  await check('资质空卡和已填卡片与输入框对齐，底边可完整查看', async () => {
    for (const [route, width] of [
      ['register', 320],
      ['register-edit?map=1', 375],
      ['register-edit-all?map=1', 430],
      ['register-supplier?map=1&step=0', 320],
      ['workspace-info?edit=1', 375],
    ]) {
      await page.setViewportSize({ width, height: 740 });
      await goto('mobile/' + route);
      const section = page.locator('#root .m-supplier-basic-fields .m-qualification-section');
      const control = page.locator('#root .m-supplier-basic-fields [data-field-label="经营优势及业务优势"] textarea');
      const card = section.locator(':is(.m-record-empty-card, .m-record-card)').last();
      await card.waitFor();
      if (route === 'register') {
        assert.ok(await section.getByText('暂无资质信息').isVisible());
      }
      const checkCard = async () => {
        await card.evaluate(el => Promise.allSettled(el.getAnimations().map(animation => animation.finished)));
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const [box, input, footer] = await Promise.all([
          card.boundingBox(), control.boundingBox(), page.locator('#root .m-registration-actions').boundingBox(),
        ]);
        assert.ok(Math.abs(box.x - input.x) < 1 && Math.abs(box.width - input.width) < 1, route + ' · 卡片宽度');
        assert.ok(footer.y - box.y - box.height >= 12, route + ' · 卡片底边露出');
        assert.ok(await card.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 1));
        }), route + ' · 卡片底边可见');
      };
      await checkCard();
      if (route === 'register') {
        await button('添加资质').click();
        await field('资质名称').fill('移动端资质检查');
        await button('保存').click();
        await page.locator('#root .m-record-editor').waitFor({ state: 'hidden' });
        await section.getByRole('heading', { name: '移动端资质检查', exact: true }).waitFor();
        await checkCard();
      }
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  const passed = results.filter(x => x.passed).length, failed = results.length - passed;
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, failed, results }, null, 2));
  console.log(JSON.stringify({ passed, failed, failures: results.filter(x => !x.passed) }, null, 2));
  if (failed) process.exitCode = 1;
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }



