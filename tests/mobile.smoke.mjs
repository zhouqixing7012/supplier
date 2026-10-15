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
  async function choose(label, value) {
    await page.getByRole('combobox', { name: label, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click();
    await dialog.getByRole('button', { name: '确认', exact: true }).click();
  }
  async function fillCompanyBasic() {
    const upload = { name: '演示附件.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') };
    await page.getByLabel('营业执照', { exact: true }).setInputFiles(upload);
    for (const [label, value] of [['供应商名称', '自动化代注册公司'], ['供应商注册邮箱', 'register@example.com'], ['统一社会信用代码', 'DEMO-CODE-001'], ['法人代表', '演示法人'], ['公司电话', '010-12345678'], ['注册资金', '100'], ['经营范围', '演示合作事项']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    for (const label of ['成立日期', '证件有效期至']) { await page.getByRole('button', { name: label, exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click(); }
    for (const [label, value] of [['企业类型', '有限责任公司'], ['所属行业', '文化、体育、娱乐业'], ['注册币种', '人民币'], ['国家', '国内']]) await choose(label, value);
    await page.getByRole('button', { name: '注册地址', exact: true }).click(); await page.getByRole('button', { name: '选择地址', exact: true }).click();
    for (const value of ['北京市', '北京市', '朝阳区']) await page.locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click();
    await page.getByRole('textbox', { name: '详细地址', exact: true }).fill('演示地址'); await page.getByRole('button', { name: '确定', exact: true }).click();
    return upload;
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
    await goto('mobile'); await page.getByRole('button', { name: '筛选供应商' }).click(); await choose('供应商状态', '已审批'); await page.getByRole('button', { name: '确定', exact: true }).click();
    assert.equal(await page.locator('.m-supplier-card').count(), 3);
    await page.getByRole('button', { name: '筛选供应商' }).click(); await page.getByRole('button', { name: '重置', exact: true }).click(); await page.getByRole('button', { name: '确定', exact: true }).click(); assert.equal(await page.locator('.m-supplier-card').count(), 6);
  });
  await check('银行取消不修改供应商状态', async () => { await goto('mobile'); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '修改银行', exact: true }).click(); await page.getByRole('button', { name: '新增银行信息' }).click(); await page.getByRole('textbox', { name: '账户名称', exact: true }).fill('取消测试'); await page.getByRole('button', { name: '取消', exact: true }).click(); await page.getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).innerText()).includes('已审批')); });
  await check('银行选择、修改、提交进入变更中并保留原详情', async () => {
    await goto('mobile'); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '修改银行', exact: true }).click(); await page.getByRole('button', { name: '修改', exact: true }).click(); await page.getByRole('textbox', { name: '账户名称', exact: true }).fill('变更账户名称'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.locator('.m-change-修改').isVisible()); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok((await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).innerText()).includes('变更中')); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '详情', exact: true }).click(); await page.getByRole('button', { name: '银行信息', exact: true }).click(); assert.ok(await page.getByText('牛来豹拉', { exact: true }).isVisible());
  });
  await check('邀请表单必填校验', async () => { await goto('mobile/invite'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.getByRole('status').isVisible()); assert.equal(await page.locator('.mobile-page').getAttribute('data-scene'), 'invite'); });
  await check('邀请注册完整路径不发送邮件', async () => {
    await goto('mobile/invite'); await choose('供应商类型', '企业供应商'); for (const [label, value] of [['供应商名称', '自动化演示供应商'], ['联系人姓名', '演示联系人'], ['邮箱', 'demo@example.com'], ['手机号', '13800000000']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); assert.ok((await page.locator('.m-supplier-card').first().innerText()).includes('邀请中')); assert.ok((await page.getByRole('status').innerText()).includes('未发送真实邮件'));
  });
  await check('人员选择确认和取消', async () => { await goto('mobile/inviter'); await page.getByRole('button', { name: '新邀请人' }).click(); await page.getByRole('textbox', { name: '请输入人员工号或姓名' }).fill('周'); await page.locator('input[type="radio"][value="周辉"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click(); assert.ok((await page.getByRole('button', { name: '新邀请人', exact: true }).innerText()).includes('周辉')); });
  await check('导出演示文件', async () => { await goto('mobile/shot/200321'); const download = page.waitForEvent('download'); await page.getByRole('button', { name: '确认', exact: true }).click(); const file = await download; assert.ok(file.suggestedFilename().endsWith('.csv')); });
  await check('非草稿批量删除受阻', async () => { await goto('mobile/shot/201829'); await page.getByRole('checkbox', { name: '全选', exact: true }).check(); await page.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('button', { name: '确认', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('仅草稿')); assert.equal(await page.locator('.m-supplier-card').count(), 3); });
  await check('截屏提示关闭', async () => { await goto('mobile/shot/194640'); await page.getByRole('button', { name: '知道了', exact: true }).click(); assert.equal(await page.getByRole('dialog').count(), 0); });
  await check('注册表单阻止空提交', async () => { await goto('mobile/register'); await page.getByRole('button', { name: /下一步/ }).click(); assert.ok((await page.getByRole('status').innerText()).includes('请填写')); assert.equal(await page.locator('.m-contact-form').count(), 0); });
  await check('个人供应商不展示联系人步骤', async () => { await goto('mobile/register'); await choose('供应商类型', '个人供应商'); assert.equal(await page.locator('.m-steps > div').count(), 3); assert.equal(await page.locator('.m-steps').getByText('联系人信息').count(), 0); });
  await check('银行信息申请进入填写页', async () => { await goto('mobile/bank-application'); await page.getByRole('button', { name: '确认申请', exact: true }).click(); await page.locator('[data-scene="bank-application-form"]').waitFor(); assert.ok(await page.getByRole('textbox', { name: '银行名称', exact: true }).isVisible()); });
  await check('登录验证完整路径与错误恢复', async () => {
    await goto('mobile/portal'); await page.getByRole('textbox', { name: '账号', exact: true }).fill('demo'); await page.getByLabel('密码', { exact: true }).fill('demo-password'); await page.getByRole('textbox', { name: '验证码', exact: true }).fill('error'); await page.getByRole('button', { name: '下一步', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('图形验证码错误')); await page.getByRole('textbox', { name: '验证码', exact: true }).fill('cbvs'); await page.getByRole('button', { name: '下一步', exact: true }).click(); await page.getByRole('textbox', { name: '注册邮箱', exact: true }).fill('demo@example.com'); await page.getByRole('button', { name: '发送验证码', exact: true }).click(); await page.getByRole('textbox', { name: '邮箱验证码', exact: true }).fill('123456'); await page.getByRole('button', { name: '登录', exact: true }).click(); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('企业代注册从填写到审批中完整路径', async () => {
    await goto('mobile/register');
    const upload = await fillCompanyBasic();
    await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: '添加', exact: true }).click();
    for (const [label, value] of [['姓名', '演示联系人'], ['电话', '13800000000'], ['邮箱', 'contact@example.com']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: '添加', exact: true }).click();
    await choose('账户类型', '基本账户');
    await page.getByRole('button', { name: '开户银行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('button', { name: '银行分行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行北京市分行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('textbox', { name: '银行账号', exact: true }).fill('123456789'); await choose('币种', '人民币'); await page.getByLabel('开户证明', { exact: true }).setInputFiles(upload);
    await page.getByRole('button', { name: '添加以上信息', exact: true }).click(); await page.getByRole('button', { name: /下一步/ }).click();
    assert.ok((await page.locator('.m-register-preview').innerText()).includes('自动化代注册公司')); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); assert.ok((await page.locator('.m-supplier-card').first().innerText()).includes('审批中'));
  });
  await check('权限选择联动和提交', async () => {
    await goto('mobile/permissions'); await page.getByRole('button', { name: '新增权限', exact: true }).click(); await choose('所属权限', '集团权限'); await choose('权限分类', '集团其他业务'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.getByText('新增', { exact: true }).isVisible()); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="query"]').waitFor(); assert.ok((await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).innerText()).includes('变更中'));
  });
  for (const type of ['company', 'personal', 'government', 'foreign']) await check('电脑端代注册样式 ' + type, async () => { await page.goto(base + '/#/register/' + type); await page.locator('.supplier-register-antd').waitFor(); assert.equal(await page.locator('.register-form').count(), 1); assert.ok((await page.locator('.register-shell').evaluate(el => getComputedStyle(el).maxWidth)) !== 'none'); await page.getByRole('link', { name: '移动端', exact: true }).click(); await page.locator('.mobile-page').waitFor(); assert.equal(await page.locator('.m-header').evaluate(el => getComputedStyle(el).position), 'sticky'); });
  await check('电脑端登录样式及返回移动端', async () => { await page.goto(base + '/#/login'); await page.locator('.auth-shell').waitFor(); assert.equal(await page.locator('.brand-panel').count(), 1); assert.notEqual(await page.locator('.brand-panel').evaluate(el => getComputedStyle(el).backgroundImage), 'none'); await page.getByRole('link', { name: '移动端', exact: true }).click(); await page.locator('.mobile-page').waitFor(); });
  for (const width of [320, 430, 1440]) await check('布局宽度 ' + width, async () => { await page.setViewportSize({ width, height: 900 }); await goto('mobile'); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await page.screenshot({ path: path.join(output, 'width-' + width + '.png'), fullPage: true }); });
  await page.setViewportSize({ width: 390, height: 845 });
  await check('查询与我的邀请列表保持白底', async () => {
    for (const route of ['mobile', 'mobile/mine']) { await goto(route); assert.equal(await page.locator('.m-list-page').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)'); assert.equal(await page.locator('.m-supplier-card').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)'); }
  });
  await check('已有权限修改删除及原版本保留', async () => {
    await goto('mobile/permissions'); await page.getByRole('button', { name: '修改', exact: true }).click(); await choose('权限分类', '火车'); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok((await page.locator('.m-bank-card').innerText()).includes('修改')); await page.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await page.locator('.m-bank-card').innerText()).includes('火车')); await page.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="query"]').waitFor(); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '详情', exact: true }).click(); await page.getByRole('button', { name: '分配权限', exact: true }).click(); assert.ok(await page.getByText('飞机', { exact: true }).isVisible());
  });
  await check('基本账户保护与一般账户删除校验', async () => {
    await goto('mobile/bank'); assert.equal(await page.getByRole('button', { name: '删除', exact: true }).count(), 0); await page.getByRole('button', { name: '修改', exact: true }).click(); await choose('账户类型', '一般账户'); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('必须有且只有一个基本账户'));
  });
  await check('银行字段分组及长文本完整展示', async () => {
    await goto('mobile/bank-form-selected'); for (const heading of ['开户银行信息', '账户信息', '证明及备注']) assert.ok(await page.getByRole('button', { name: heading, exact: true }).isVisible()); const text = page.getByRole('button', { name: '银行分行', exact: true }).locator('span'); assert.equal(await text.evaluate(el => getComputedStyle(el).whiteSpace), 'normal'); assert.equal(await text.evaluate(el => getComputedStyle(el).textOverflow), 'clip');
  });
  await check('评分筛选联系人部门均为文本框且条件生效', async () => {
    await goto('mobile/rating-filter'); await page.getByRole('textbox', { name: '业务线联系人', exact: true }).fill('陈才慧'); await page.getByRole('textbox', { name: '所属部门', exact: true }).fill('ERP'); await page.getByRole('button', { name: '确定', exact: true }).click(); await page.locator('[data-scene="ratings"]').waitFor(); assert.equal(await page.locator('.m-rating-list article').count(), 1);
  });
  await check('未评分填写校验提交详情修改完整路径', async () => {
    await goto('mobile/my-ratings'); await page.getByRole('button', { name: '未评分', exact: true }).click(); await page.locator('.m-rating-list article').first().getByRole('button', { name: '评分', exact: true }).click(); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('全部评分项')); for (const input of await page.getByRole('spinbutton').all()) await input.fill('3.5'); await page.getByRole('textbox', { name: '评价', exact: true }).fill('移动端评分验证'); await page.screenshot({ path: path.join(output, 'fixed-rating.png'), fullPage: true }); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="my-ratings"]').waitFor(); const row = page.locator('.m-rating-list article').first(); await row.getByRole('button', { name: '评分详情', exact: true }).click(); await page.locator('[data-scene="rating-detail"]').waitFor(); assert.ok(await page.getByText('移动端评分验证', { exact: true }).isVisible()); assert.equal(await page.getByRole('button', { name: '提交', exact: true }).count(), 0); await page.locator('.m-actions').getByRole('button', { name: '返回', exact: true }).click(); await page.locator('.m-rating-list article').first().getByRole('button', { name: '修改评分', exact: true }).click(); assert.equal(await page.getByRole('spinbutton').first().inputValue(), '3.5'); await page.getByRole('spinbutton').first().fill('4'); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="my-ratings"]').waitFor();
  });
  await check('电子产品评分项切换及取消不写入', async () => {
    await goto('mobile/ratings'); const count = await page.locator('.m-rating-list article').count(); await page.getByRole('button', { name: '新增评分', exact: true }).click(); await choose('合作类型', '电子产品'); assert.ok(await page.getByRole('spinbutton', { name: '售后质量（退换货及维护等）', exact: true }).isVisible()); await page.locator('.m-actions').getByRole('button', { name: '返回', exact: true }).click(); await page.locator('[data-scene="ratings"]').waitFor(); assert.equal(await page.locator('.m-rating-list article').count(), count);
  });
  await check('我的邀请已审批修改全部信息回填并取消', async () => {
    await goto('mobile/mine'); const card = page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }); await card.getByRole('button', { name: '修改全部信息', exact: true }).click(); assert.equal(await page.getByRole('textbox', { name: '供应商名称', exact: true }).inputValue(), '北京初然文化传媒有限公司733324'); await page.getByRole('textbox', { name: '供应商名称', exact: true }).fill('不应保存的变更'); await page.locator('.m-header').getByRole('button', { name: '返回', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); assert.equal(await page.getByText('不应保存的变更', { exact: true }).count(), 0);
  });
  await check('评分运维显示完整字段并支持查询导出', async () => {
    await goto('mobile/rating-ops'); assert.equal(await page.locator('.m-rating-list article').count(), 3); await page.screenshot({ path: path.join(output, 'fixed-operations.png'), fullPage: true }); for (const label of ['主键', '合作类型', '合作内容', '业务线联系人', '所属部门', '合作时间', '创建时间']) assert.ok((await page.locator('.m-rating-list article').first().innerText()).includes(label)); const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出', exact: true }).click(); assert.ok((await download).suggestedFilename().endsWith('.csv')); await page.getByRole('textbox', { name: '过滤名单', exact: true }).fill('滴滴出行科技有限公司'); await page.getByRole('button', { name: '查询', exact: true }).click(); assert.equal(await page.locator('.m-rating-list article').count(), 3); assert.ok((await page.getByRole('status').innerText()).includes('口径待确认'));
  });
  await check('银行申请必填校验与完整填写提交', async () => {
    await goto('mobile/bank-application'); await page.getByRole('button', { name: '确认申请', exact: true }).click(); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok((await page.getByRole('status').innerText()).includes('银行名称')); for (const [label, value] of [['银行名称', '演示银行'], ['开户行(分行)名称', '演示分行'], ['开户行省', '北京市'], ['开户行市', '北京市'], ['申请说明', '补充银行目录演示']]) await page.getByRole('textbox', { name: label, exact: true }).fill(value); await choose('国家/地区', '中国'); await page.screenshot({ path: path.join(output, 'fixed-bank-application.png'), fullPage: true }); await page.getByRole('button', { name: '提交', exact: true }).click(); assert.ok(await page.getByText('申请信息已在原型中保存', { exact: true }).isVisible());
  });
  await check('统一选择弹层可搜索且取消不修改', async () => {
    await goto('mobile/register'); await page.getByRole('combobox', { name: '供应商类型', exact: true }).click(); const dialog = page.getByRole('dialog'); await dialog.getByRole('textbox', { name: '搜索供应商类型', exact: true }).fill('个人'); assert.equal(await dialog.locator('.m-sheet-options button').count(), 1); await dialog.locator('.m-sheet-options button').click(); await dialog.getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await page.getByRole('combobox', { name: '供应商类型', exact: true }).innerText()).includes('企业供应商'));
  });
  await check('日期长期确认触控区域分离', async () => {
    await goto('mobile/register'); await page.getByRole('button', { name: '证件有效期至', exact: true }).click(); const dialog = page.getByRole('dialog'); const long = await dialog.getByRole('button', { name: '长期', exact: true }).boundingBox(); const confirm = await dialog.getByRole('button', { name: '确认', exact: true }).boundingBox(); assert.ok(long.height >= 44); assert.ok(confirm.x - long.x - long.width >= 16); await dialog.getByRole('button', { name: '长期', exact: true }).click(); assert.ok((await page.getByRole('button', { name: '证件有效期至', exact: true }).innerText()).includes('长期'));
  });
  await check('草稿修改银行分行带出省市并再次保存恢复', async () => {
    await goto('mobile/register'); const upload = await fillCompanyBasic();
    await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: '添加', exact: true }).click();
    await choose('账户类型', '基本账户');
    await page.getByRole('button', { name: '开户银行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('button', { name: '银行分行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行北京市分行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.getByRole('textbox', { name: '银行账号', exact: true }).fill('123456789'); await choose('币种', '人民币'); await page.getByLabel('开户证明', { exact: true }).setInputFiles(upload);
    await page.getByRole('button', { name: '添加以上信息', exact: true }).click(); await page.getByRole('button', { name: '保存草稿', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor();
    const card = page.locator('.m-supplier-card').filter({ hasText: '自动化代注册公司' }); await card.getByRole('button', { name: '修改', exact: true }).click(); await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: /下一步/ }).click(); assert.equal(await page.getByRole('textbox', { name: '开户所在省', exact: true }).inputValue(), '北京市');
    await page.getByRole('button', { name: '银行分行', exact: true }).click(); await page.locator('input[type="radio"][value="中国农业发展银行天津市分行"]').check(); await page.getByRole('button', { name: '确定', exact: true }).click(); assert.equal(await page.getByRole('textbox', { name: '开户所在市', exact: true }).inputValue(), '天津市'); await page.getByRole('button', { name: '保存草稿', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); await page.locator('.m-supplier-card').filter({ hasText: '自动化代注册公司' }).getByRole('button', { name: '修改', exact: true }).click(); await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: /下一步/ }).click(); assert.equal(await page.getByRole('textbox', { name: '开户所在省', exact: true }).inputValue(), '天津市'); await page.screenshot({ path: path.join(output, 'fixed-draft-bank.png'), fullPage: true });
  });
  await check('修改全部信息提交后保留原详情并进入变更中', async () => {
    await goto('mobile/mine'); await page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }).getByRole('button', { name: '修改全部信息', exact: true }).click(); await fillCompanyBasic();
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="mine"]').waitFor(); const card = page.locator('.m-supplier-card').filter({ hasText: '北京初然文化传媒有限公司733324' }); assert.ok((await card.innerText()).includes('变更中')); assert.equal(await page.getByText('自动化代注册公司', { exact: true }).count(), 0); await card.getByRole('button', { name: '详情', exact: true }).click(); assert.ok((await page.locator('.m-detail').innerText()).includes('北京初然文化传媒有限公司733324'));
  });
  for (const width of [320, 390, 430]) await check('新工作流窄屏布局 ' + width, async () => {
    await page.setViewportSize({ width, height: 845 });
    for (const route of ['mobile/bank-form-selected', 'mobile/permissions', 'mobile/my-ratings', 'mobile/rating-ops', 'mobile/bank-application-form', 'mobile/rating-edit']) {
      await goto(route); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + '横向溢出');
      if (route.endsWith('rating-edit')) { await choose('合作类型', '技术服务'); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
    }
  });
  await check('供应商详情评分修改后返回合作评分页签', async () => {
    await goto('mobile'); await page.locator('.m-supplier-card').filter({ hasText: '快速创建557348' }).getByRole('button', { name: '详情', exact: true }).click(); await page.getByRole('button', { name: '合作信息及评分', exact: true }).click(); await page.getByRole('button', { name: '修改评分', exact: true }).click(); await page.locator('[data-scene="rating-edit"]').waitFor(); assert.ok((await page.locator('.mobile-page').innerText()).includes('2026-10-14 19:22:50')); for (const input of await page.getByRole('spinbutton').all()) await input.fill('4'); await page.getByRole('button', { name: '提交', exact: true }).click(); await page.locator('[data-scene="detail-ratings"]').waitFor(); assert.ok(await page.getByRole('button', { name: '评分详情', exact: true }).isVisible());
  });
  const passed = results.filter(x => x.passed).length;
  const failed = results.length - passed;
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, failed, results }, null, 2));
  console.log(JSON.stringify({ passed, failed, failures: results.filter(x => !x.passed) }, null, 2));
  if (failed) process.exitCode = 1;
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
