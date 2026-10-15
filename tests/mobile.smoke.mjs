import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { screenshotScenes } from '../src/pages/mobile-data.js';

// 在同一进程中启动生产构建服务，测试不依赖开发服务器或线上业务接口。
const root = path.resolve('dist');
const output = path.resolve(process.env.MOBILE_TEST_OUTPUT || 'test-output/mobile');
await fs.mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (requested === '/' ? '/index.html' : requested));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
let browser;
const results = [];
try {
  let playwright;
  try { playwright = await import('playwright'); }
  catch (error) {
    if (!process.env.PLAYWRIGHT_MODULE) throw new Error('缺少 Playwright，请先安装开发依赖。', { cause: error });
    playwright = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
  }
  browser = await playwright.chromium.launch({ headless: true, ...(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN, args: ['--no-sandbox', '--no-zygote', '--single-process', '--disable-gpu', '--no-proxy-server'] } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 845 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  let errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
  async function check(name, fn) {
    errors = [];
    try { await fn(); assert.equal(errors.length, 0, errors.join('\n')); results.push({ name, passed: true }); }
    catch (error) { results.push({ name, passed: false, error: error.message }); }
  }
  let navigation = 0;
  async function goto(route) { await page.goto(base + '/?case=' + (++navigation) + '#/' + route, { waitUntil: 'domcontentloaded', timeout: 10000 }); await page.locator('.mobile-page, .m-scene-gallery, .portal-page, .register-page').first().waitFor({ state: 'visible' }); await page.evaluate(() => document.fonts.ready); }
  for (const s of screenshotScenes) {
    await check('截图 ' + s.time + ' ' + s.title, async () => {
      await page.setViewportSize({ width: 390, height: Math.round(s.sourceHeight * 390 / s.sourceWidth) });
      await goto('mobile/shot/' + s.time);
      assert.equal(await page.locator('.mobile-page').getAttribute('data-scene'), s.scene);
      assert.equal(await page.locator('.m-header').evaluate(el => getComputedStyle(el).position), 'sticky', '移动端样式未加载');
      await page.waitForTimeout(200);
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok((await page.locator('.mobile-page').innerText()).length > 25);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '页面出现横向溢出');
      const broken = await page.locator('img').evaluateAll(images => images.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
      assert.equal(broken.length, 0, '图片加载失败：' + broken.join(','));
      await page.screenshot({ path: path.join(output, s.time + '.png'), fullPage: false });
      if (['200506', '200800', '195913'].includes(s.time)) await page.screenshot({ path: path.join(output, s.time + '-full.png'), fullPage: true });
    });
  }
  await page.setViewportSize({ width: 390, height: 845 });
  await check('截图目录包含47个唯一入口', async () => { await goto('mobile/scenes'); assert.equal(await page.locator('ol a').count(), 47); });
  await check('名称搜索和空状态', async () => { await goto('mobile'); await page.getByRole('textbox', { name: '搜索供应商名称或邀请人' }).fill('不存在的供应商'); assert.equal(await page.locator('.m-supplier-card').count(), 0); assert.ok(await page.getByText('没有查询到相关数据').isVisible()); });
  await check('筛选应用和重置', async () => {
    await goto('mobile'); await page.getByRole('button', { name: '筛选供应商' }).click(); await page.getByRole('combobox', { name: '供应商状态' }).selectOption('已审批'); await page.getByRole('button', { name: '确定', exact: true }).click();
    assert.equal(await page.locator('.m-supplier-card').count(), 3);
    await page.getByRole('button', { name: '筛选供应商' }).click(); await page.getByRole('button', { name: '重置', exact: true }).click(); await page.getByRole('button', { name: '确定', exact: true }).click(); assert.equal(await page.locator('.m-supplier-card').count(), 6);
  });
  await check('银行取消不修改供应商状态', async () => { await goto('mobile'); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '修改银行', exact: true }).click(); await page.getByRole('button', { name: '新增银行信息' }).click(); await page.getByRole('textbox', { name: '账户名称', exact: true }).fill('取消测试'); await page.getByRole('button', { name: '取消', exact: true }).click(); await page.getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).innerText()).includes('已审批')); });
  await check('银行选择、修改、提交进入变更中并保留原详情', async () => {
    await goto('mobile'); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '修改银行', exact: true }).click(); await page.getByRole('button', { name: '银行信息操作' }).click(); await page.getByRole('button', { name: '修改', exact: true }).click(); await page.getByRole('textbox', { name: '账户名称', exact: true }).fill('变更账户名称'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.getByText('修改', { exact: true }).isVisible()); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok((await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).innerText()).includes('变更中')); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '详情', exact: true }).click(); await page.getByRole('button', { name: '银行信息', exact: true }).click(); assert.ok(await page.getByText('牛来豹拉', { exact: true }).isVisible());
  });
  await check('邀请表单必填校验', async () => { await goto('mobile/invite'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.getByRole('status').isVisible()); assert.equal(await page.locator('.mobile-page').getAttribute('data-scene'), 'invite'); });
  await check('邀请注册完整路径不发送邮件', async () => {
    await goto('mobile/invite'); await page.getByRole('combobox', { name: '供应商类型' }).selectOption('企业供应商'); for (const [label, value] of [['供应商名称', '自动化演示供应商'], ['联系人姓名', '演示联系人'], ['邮箱', 'demo@example.com'], ['手机号', '13800000000']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); assert.ok((await page.locator('.m-supplier-card').first().innerText()).includes('邀请中')); assert.ok((await page.getByRole('status').innerText()).includes('未发送真实邮件'));
  });
  await check('人员选择确认和取消', async () => { await goto('mobile/inviter'); await page.getByRole('button', { name: '新邀请人' }).click(); await page.getByRole('textbox', { name: '请输入人员工号或姓名' }).fill('周'); await page.locator('input[type="radio"][value="周辉"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click(); assert.ok((await page.getByRole('button', { name: '新邀请人', exact: true }).innerText()).includes('周辉')); });
  await check('导出演示文件', async () => { await goto('mobile/shot/200321'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: '确认', exact: true }).click(); const file = await download; assert.ok(file.suggestedFilename().endsWith('.csv')); });
  await check('非草稿批量删除受阻', async () => { await goto('mobile/shot/201829'); await page.getByRole('checkbox', { name: '全选', exact: true }).check(); await page.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('仅草稿')); assert.equal(await page.locator('.m-supplier-card').count(), 3); });
  await check('截屏提示关闭', async () => { await goto('mobile/shot/194640'); await page.getByRole('button', { name: '知道了', exact: true }).click(); assert.equal(await page.getByRole('dialog').count(), 0); });
  await check('注册表单阻止空提交', async () => { await goto('mobile/register'); await page.getByRole('button', { name: /下一步/ }).click(); assert.ok((await page.getByRole('status').innerText()).includes('请填写')); assert.equal(await page.locator('.m-contact-form').count(), 0); });
  await check('个人供应商不展示联系人步骤', async () => { await goto('mobile/register'); await page.getByRole('combobox', { name: '供应商类型' }).selectOption('个人供应商'); assert.equal(await page.locator('.m-steps > div').count(), 3); assert.equal(await page.locator('.m-steps').getByText('联系人信息').count(), 0); });
  await check('银行信息申请完整空状态路径', async () => { await goto('mobile/bank-application'); await page.getByRole('button', { name: '确认申请', exact: true }).click(); await page.locator('[data-scene="application-empty"]').waitFor(); assert.ok(await page.getByText('暂无相关数据,请联系管理员设置').isVisible()); });
  await check('登录验证完整路径与错误恢复', async () => {
    await goto('mobile/portal'); await page.getByRole('textbox', { name: '账号', exact: true }).fill('demo'); await page.getByLabel('密码', { exact: true }).fill('demo-password'); await page.getByRole('textbox', { name: '验证码', exact: true }).fill('error'); await page.getByRole('button', { name: '下一步', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('图形验证码错误')); await page.getByRole('textbox', { name: '验证码', exact: true }).fill('cbvs'); await page.getByRole('button', { name: '下一步', exact: true }).click(); await page.getByRole('textbox', { name: '注册邮箱', exact: true }).fill('demo@example.com'); await page.getByRole('button', { name: '发送验证码', exact: true }).click(); await page.getByRole('textbox', { name: '邮箱验证码', exact: true }).fill('123456'); await page.getByRole('button', { name: '登录', exact: true }).click(); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('企业代注册从填写到审批中完整路径', async () => {
    await goto('mobile/register');
    const upload = { name: '演示附件.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') };
    await page.getByLabel('营业执照', { exact: true }).setInputFiles(upload);
    for (const [label, value] of [['供应商名称', '自动化代注册公司'], ['供应商注册邮箱', 'register@example.com'], ['统一社会信用代码', 'DEMO-CODE-001'], ['法人代表', '演示法人'], ['公司电话', '010-12345678'], ['注册资金', '100'], ['经营范围', '演示合作事项']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    for (const label of ['成立日期', '证件有效期至']) { await page.getByRole('button', { name: label, exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click(); }
    for (const [label, value] of [['企业类型', '有限责任公司'], ['所属行业', '文化、体育、娱乐业'], ['注册币种', '人民币'], ['国家', '国内']]) await page.getByRole('combobox', { name: label, exact: true }).selectOption(value);
    await page.getByRole('button', { name: '注册地址', exact: true }).click(); await page.getByRole('button', { name: '选择地址', exact: true }).click();
    for (const value of ['北京市', '北京市', '朝阳区']) await page.locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click();
    await page.getByRole('textbox', { name: '详细地址', exact: true }).fill('演示地址'); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: '添加', exact: true }).click();
    for (const [label, value] of [['姓名', '演示联系人'], ['电话', '13800000000'], ['邮箱', 'contact@example.com']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: '添加', exact: true }).click();
    await page.getByRole('combobox', { name: '账户类型' }).selectOption('基本账户');
    await page.getByRole('button', { name: '开户银行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('button', { name: '银行分行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行北京市分行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('textbox', { name: '银行账号', exact: true }).fill('123456789'); await page.getByRole('combobox', { name: '币种', exact: true }).selectOption('人民币'); await page.getByLabel('开户证明', { exact: true }).setInputFiles(upload);
    await page.getByRole('button', { name: '添加以上信息', exact: true }).click(); await page.getByRole('button', { name: /下一步/ }).click();
    assert.ok((await page.locator('.m-register-preview').innerText()).includes('自动化代注册公司')); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); assert.ok((await page.locator('.m-supplier-card').first().innerText()).includes('审批中'));
  });
  await check('权限选择联动和提交', async () => {
    await goto('mobile/permissions'); await page.getByRole('button', { name: '新增权限', exact: true }).click(); await page.getByRole('combobox', { name: '所属权限' }).selectOption('集团权限'); await page.getByRole('combobox', { name: '权限分类' }).selectOption('集团其他业务'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.getByText('新增', { exact: true }).isVisible()); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="query"]').waitFor(); assert.ok((await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).innerText()).includes('变更中'));
  });
  for (const type of ['company', 'personal', 'government', 'foreign']) await check('电脑端代注册样式 ' + type, async () => { await page.goto(base + '/#/register/' + type); await page.locator('.supplier-register-antd').waitFor(); assert.equal(await page.locator('.register-form').count(), 1); assert.ok((await page.locator('.register-shell').evaluate(el => getComputedStyle(el).maxWidth)) !== 'none'); await page.getByRole('link', { name: '移动端', exact: true }).click(); await page.locator('.mobile-page').waitFor(); assert.equal(await page.locator('.m-header').evaluate(el => getComputedStyle(el).position), 'sticky'); });
  await check('电脑端登录样式及返回移动端', async () => { await page.goto(base + '/#/login'); await page.locator('.auth-shell').waitFor(); assert.equal(await page.locator('.brand-panel').count(), 1); assert.notEqual(await page.locator('.brand-panel').evaluate(el => getComputedStyle(el).backgroundImage), 'none'); await page.getByRole('link', { name: '移动端', exact: true }).click(); await page.locator('.mobile-page').waitFor(); });
  for (const width of [320, 430, 1440]) await check('布局宽度 ' + width, async () => { await page.setViewportSize({ width, height: 900 }); await goto('mobile'); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await page.screenshot({ path: path.join(output, 'width-' + width + '.png'), fullPage: true }); });
  const passed = results.filter(x => x.passed).length;
  const failed = results.length - passed;
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, failed, results }, null, 2));
  console.log(JSON.stringify({ passed, failed, failures: results.filter(x => !x.passed) }, null, 2));
  if (failed) process.exitCode = 1;
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
