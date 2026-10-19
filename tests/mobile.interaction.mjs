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
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
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
  async function goto(route) { await page.goto(base + '/?case=' + (++navigation) + '#/' + route); await page.locator('.mobile-page, .auth-shell, .register-page').first().waitFor(); await page.evaluate(() => document.fonts.ready); }
  async function check(name, fn) {
    if (process.env.MOBILE_CASE_FILTER && !new RegExp(process.env.MOBILE_CASE_FILTER).test(name)) return;
    errors = [];
    try { await fn(); assert.equal(errors.length, 0, errors.join('\n')); results.push({ name, passed: true }); }
    catch (e) { results.push({ name, passed: false, error: e.message }); await page.screenshot({ path: path.join(output, 'failure-' + results.length + '.png') }).catch(() => {}); }
    console.log((results.at(-1).passed ? 'PASS ' : 'FAIL ') + name);
  }
  const button = name => page.getByRole('button', { name, exact: true });
  const field = name => page.getByRole('textbox', { name, exact: true });
  const headerBack = () => page.locator('.mobile-page > .m-header').getByRole('button', { name: '返回', exact: true }).click();
  const card = name => page.locator('.m-supplier-card').filter({ hasText: name });
  async function action(name, label) { await card(name).getByRole('button', { name: '更多操作', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click(); }
  async function choose(label, value) { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('dialog').locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); }
  async function shot(name) { await page.evaluate(() => { scrollTo(0, 0); document.querySelectorAll('.m-fullscreen-panel').forEach(n => { n.scrollTop = 0; }); }); await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true }); }
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
  const upload = { name: '测试证明.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') };
  async function fillBasic(name = '移动交互测试企业') {
    await page.getByLabel('营业执照', { exact: true }).setInputFiles(upload);
    for (const [label, value] of [['供应商名称', name], ['供应商注册邮箱', 'mobile@example.com'], ['统一社会信用代码', 'MOBILE-TEST-001'], ['法人代表', '测试法人'], ['公司电话', '010-12345678'], ['注册资金', '100'], ['经营范围', '交互测试']]) await field(label).fill(value);
    for (const label of ['成立日期', '证件有效期至']) { await button(label).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); }
    for (const [label, value] of [['企业类型', '有限责任公司'], ['所属行业', '文化、体育、娱乐业'], ['注册币种', '人民币'], ['国家', '国内']]) await choose(label, value);
    await button('注册地址').click(); await button('选择地址').click();
    for (const value of ['北京市', '北京市', '朝阳区']) await page.locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click();
    await field('详细地址').fill('移动测试地址'); await button('确定').click();
  }
  async function fillBank(accountType = '基本账户') {
    await choose('账户类型', accountType);
    await button('开户银行').click(); await page.locator('.m-reference-card').filter({ hasText: '中国农业发展银行' }).first().click(); await page.getByRole('dialog').getByRole('button', { name: '确定', exact: true }).click();
    await button('银行分行').click(); await page.locator('.m-reference-card').filter({ hasText: '北京市分行' }).click(); await page.getByRole('dialog').getByRole('button', { name: '确定', exact: true }).click();
    await field('账户名称').fill('移动交互测试企业'); await field('银行账号').fill('001234567890'); await choose('币种', '人民币'); await page.getByLabel('开户证明', { exact: true }).setInputFiles(upload);
  }
  for (const s of screenshotScenes) await check('原入口 ' + s.index + ' ' + s.title, async () => {
    await goto('mobile/shot/' + s.time);
    assert.equal(await page.locator('[data-scene="' + s.scene + '"]').count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '页面横向溢出');
    await shot('scene-' + s.time);
  });
  await check('全部功能可直接发现并进入银行申请', async () => {
    await goto('mobile'); await button('全部标签').click(); await page.getByRole('dialog').getByRole('button', { name: '银行信息申请', exact: true }).click(); await button('确认申请').waitFor();
  });
  await check('主模块内容左滑切到我的邀请，右滑返回', async () => {
    await goto('mobile'); await swipe(page.locator('.m-supplier-card h3').first(), -130); await page.locator('[data-scene="mine"]').waitFor(); await swipe(page.locator('.m-supplier-card h3').first(), 130, 0, 100); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('纵向手势和边缘手势不误切模块', async () => {
    await goto('mobile'); await swipe(page.locator('.m-supplier-card h3').first(), -90, 140); assert.ok(page.url().endsWith('#/mobile')); await swipe(page.locator('.m-supplier-card h3').first(), 130, 0, 5); assert.ok(page.url().endsWith('#/mobile'));
  });
  await check('详情内容左右滑动，标签同步，输入控件不接管', async () => {
    await goto('mobile'); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click();
    await swipe(page.locator('.m-detail .m-swipe-area').first(), -130); assert.equal(await page.locator('.m-detail [aria-current="page"]').innerText(), '联系人信息');
    await swipe(page.locator('.m-detail .m-swipe-area').first(), 130, 0, 100); assert.equal(await page.locator('.m-detail [aria-current="page"]').innerText(), '基本信息'); await shot('detail');
  });
  await check('查询详情返回保留关键词及滚动位置', async () => {
    await goto('mobile'); await page.getByRole('textbox', { name: '搜索供应商名称或邀请人' }).fill('陈才慧'); await page.evaluate(() => scrollTo(0, 300)); const y = await page.evaluate(() => scrollY); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); await headerBack(); await page.locator('[data-scene="query"]').waitFor(); assert.equal(await page.getByRole('textbox', { name: '搜索供应商名称或邀请人' }).inputValue(), '陈才慧'); assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 90);
  });
  await check('我的邀请详情返回仍是我的邀请，字段可展开', async () => {
    await goto('mobile/mine'); await card('代注册草稿').locator('summary').click(); assert.ok(await card('代注册草稿').getByText('联系人邮箱：').isVisible()); await card('代注册草稿').getByRole('button', { name: '详情', exact: true }).click(); await headerBack(); await page.locator('[data-scene="mine"]').waitFor();
  });
  await check('查询筛选生效且重复打开回填，清空恢复', async () => {
    await goto('mobile'); await button('筛选供应商').click(); await choose('供应商状态', '草稿'); await button('确定').click(); assert.equal(await page.locator('.m-supplier-card').count(), 1); await button('已筛选 · 1项').click(); assert.ok((await page.getByRole('combobox', { name: '供应商状态', exact: true }).innerText()).includes('草稿')); await button('取消').click(); await button('清除筛选').click(); assert.ok(await page.locator('.m-supplier-card').count() > 1);
  });
  await check('审批默认纵向节点，完整表格可展开', async () => {
    await goto('mobile/approval'); assert.equal(await page.locator('.m-approval-timeline li').count(), 4); assert.equal(await page.locator('table:visible').count(), 0); await page.locator('.m-approval-table > summary').click(); assert.ok(await page.locator('table').isVisible()); await shot('approval');
  });
  await check('帮助可通过点击查看，日期初始化今天，长期可选', async () => {
    await goto('mobile/bank-form'); await button('开户银行填写说明').click(); await page.getByRole('dialog', { name: '开户银行填写说明' }).waitFor(); await button('知道了').click();
    await goto('mobile/register'); await button('证件有效期至').click(); assert.equal(await page.getByRole('listbox', { name: '年', exact: true }).inputValue(), String(new Date().getFullYear())); await button('长期').click(); assert.ok((await button('证件有效期至').innerText()).includes('长期'));
  });
  await check('空分行和人员搜索提示与能力一致', async () => {
    await goto('mobile/inviter'); await button('新邀请人').click(); await page.getByText('请输入姓名搜索人员', { exact: true }).waitFor(); await page.getByRole('textbox', { name: '请输入人员姓名' }).fill('不存在的姓名'); await page.getByText('没有匹配结果，请调整关键词', { exact: true }).waitFor(); await shot('people-empty');
  });
  await check('表单未保存返回可继续编辑或放弃', async () => {
    await goto('mobile/invite'); await field('供应商名称').fill('尚未保存'); await headerBack(); await button('继续编辑').click(); assert.equal(await field('供应商名称').inputValue(), '尚未保存'); await button('取消').click(); await button('放弃修改').click(); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('系统返回先关闭选择层而非跳离填写页', async () => {
    await goto('mobile'); await button('新增供应商').click(); await button('邀请注册').click(); await page.getByRole('combobox', { name: '供应商类型', exact: true }).click(); await page.goBack(); await page.waitForURL(/#\/mobile\/invite$/); assert.equal(await page.getByRole('dialog').count(), 0); await page.goBack(); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('系统返回未保存时继续编辑保留内容，再返回可放弃', async () => {
    await goto('mobile'); await button('新增供应商').click(); await button('邀请注册').click(); await field('供应商名称').fill('系统返回检查'); await page.goBack(); await button('继续编辑').click(); assert.equal(await field('供应商名称').inputValue(), '系统返回检查'); await headerBack(); await button('放弃修改').click(); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('注册缺项定位首个字段且持续显示错误', async () => {
    await goto('mobile/register'); await page.getByRole('button', { name: /下一步/ }).click(); await page.locator('[aria-invalid="true"]').first().waitFor(); assert.equal(await page.locator('[aria-invalid="true"]').first().getAttribute('aria-label'), '供应商名称'); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '供应商名称');
  });
  await check('评分半分输入、类型切换取消保护及提交修改', async () => {
    await goto('mobile/my-ratings'); await button('未评分').click(); await page.locator('.m-bank-card').first().getByRole('button', { name: '评分', exact: true }).click();
    for (const input of await page.getByRole('spinbutton').all()) await input.fill('3.5'); await button('人员/服务质量加0.5分').click(); assert.equal(await page.getByRole('spinbutton', { name: '人员/服务质量', exact: true }).inputValue(), '4'); await button('人员/服务质量减0.5分').click();
    await choose('合作类型', '电子产品'); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.getByRole('spinbutton', { name: '人员/服务质量', exact: true }).inputValue(), '3.5');
    await shot('rating-edit'); await button('提交').click(); await page.locator('[data-scene="my-ratings"]').waitFor(); await button('全部').click(); await page.locator('.m-bank-card').filter({ hasText: '滴滴出行' }).first().getByRole('button', { name: '评分详情', exact: true }).click(); assert.equal(await page.getByRole('spinbutton').count(), 0); assert.ok((await page.locator('.mobile-page').innerText()).includes('3.5 / 5'));
  });
  await check('评分筛选保留状态、关键词、条件并可清除', async () => {
    await goto('mobile/my-ratings'); await button('未评分').click(); await page.getByRole('textbox', { name: '搜索供应商或合作事项' }).fill('滴滴'); await button('筛选').click(); await field('所属部门').fill('ERP'); await button('确定').click(); await page.locator('[data-scene="my-ratings"]').waitFor(); assert.equal(await page.getByRole('textbox', { name: '搜索供应商或合作事项' }).inputValue(), '滴滴'); assert.equal(await page.locator('.m-status-tabs .active').innerText(), '未评分'); await button('筛选').click(); assert.equal(await field('所属部门').inputValue(), 'ERP'); await button('取消').click(); await button('清除筛选').click(); assert.equal(await page.locator('.m-filter-summary').count(), 0);
  });
  await check('权限编辑保存只是暂存，外层取消保护且正式详情不变', async () => {
    await goto('mobile/permissions'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await choose('权限分类', '火车'); await button('保存此权限').click(); await page.getByText('待提交变更：1 项').waitFor(); await button('取消').click(); await button('放弃修改').click(); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); await button('分配权限').click(); assert.ok((await page.locator('.m-detail').innerText()).includes('飞机'));
  });
  await check('银行编辑取消保护、保存暂存、省市保留、提交不改原详情', async () => {
    await goto('mobile/bank'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await field('备注').fill('待提交备注'); await page.locator('.m-fullscreen-panel > .m-header').getByRole('button', { name: '返回', exact: true }).click(); await button('继续编辑').click(); assert.equal(await field('备注').inputValue(), '待提交备注'); await button('保存此账户').click(); await page.getByText('待提交变更：1 项').waitFor(); await button('提交变更').click(); await page.locator('[data-scene="query"]').waitFor(); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); await button('银行信息').click(); assert.ok(!(await page.locator('.m-detail').innerText()).includes('待提交备注'));
  });
  await check('企业注册完整路径、单联系人编辑删除取消、银行编辑、预览直改', async () => {
    await goto('mobile/register'); await fillBasic(); await page.getByRole('button', { name: /下一步/ }).click(); await button('添加联系人').click(); await field('姓名').fill('移动联系人'); await field('电话').fill('13800138000'); await field('邮箱').fill('contact@example.com'); await button('保存联系人').click(); await button('删除联系人1').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('编辑联系人1').click(); assert.equal(await field('姓名').inputValue(), '移动联系人'); await button('保存联系人').click(); await page.getByRole('button', { name: /下一步/ }).click();
    await button('添加银行').click(); await fillBank(); await shot('bank-editor'); await button('添加以上信息').click(); assert.ok((await page.locator('.m-register-banks').innerText()).includes('尾号7890')); await page.getByRole('button', { name: /下一步/ }).click(); await button('修改基本信息').click(); await field('法人代表').fill('修改后的法人'); await button('保存并返回预览').click(); await page.locator('.m-register-preview').waitFor(); assert.ok((await page.locator('.m-register-preview').innerText()).includes('修改后的法人')); await button('修改银行信息').click(); await page.locator('.m-register-banks .m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('开户所在省').inputValue(), '北京市'); await button('添加以上信息').click(); await button('保存并返回预览').click(); await shot('register-preview'); await button('提交').click(); await page.locator('[data-scene="mine"]').waitFor(); assert.ok((await card('移动交互测试企业').innerText()).includes('审批中'));
  });
  await check('草稿保存后重开，已审批修改全部信息取消不改变', async () => {
    await goto('mobile/register'); await field('供应商名称').fill('保存草稿测试'); await button('保存草稿').click(); await action('保存草稿测试', '修改'); assert.equal(await field('供应商名称').inputValue(), '保存草稿测试'); await button('保存草稿').click(); await action('北京初然', '修改全部信息'); await field('供应商名称').fill('取消不保存'); await headerBack(); await button('放弃修改').click(); await page.locator('[data-scene="mine"]').waitFor(); assert.equal(await card('取消不保存').count(), 0);
  });
  await check('银行申请校验、结果回看、演示边界', async () => {
    await goto('mobile/bank-application'); await button('确认申请').click(); await button('提交').click(); assert.equal(await page.locator('[aria-invalid="true"]').count() > 0, true); for (const [label,value] of [['银行名称','申请测试银行'],['开户行(分行)名称','测试分行'],['开户行省','北京市'],['开户行市','北京市'],['申请说明','目录缺少此分行']]) await field(label).fill(value); await choose('国家/地区', '中国'); await button('提交').click(); await page.getByText('申请信息已在原型中保存', { exact: true }).waitFor(); await shot('application-result'); await page.locator('.m-actions').getByRole('button', { name: '返回', exact: true }).click(); await button('查看本次演示申请').click(); await page.getByText('目录缺少此分行', { exact: true }).waitFor(); assert.ok((await page.locator('.mobile-page').innerText()).includes('银行目录未更新'));
  });
  await check('自选附件跨填写页预览及移除确认', async () => {
    await goto('mobile/bank'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await page.getByLabel('开户证明', { exact: true }).setInputFiles(upload); await button('移除开户证明').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('保存此账户').click(); await page.getByRole('button', { name: '测试证明.png', exact: true }).click(); assert.ok(await page.locator('.m-attachment-full').isVisible());
  });
  await check('运维规则未定时不显示假执行结果', async () => {
    await goto('mobile/rating-ops'); assert.ok(await button('批量发起评分').isDisabled()); await button('查询条件').click(); await page.getByRole('textbox', { name: '过滤名单' }).fill('甲#乙'); assert.equal(await page.getByRole('textbox', { name: '过滤名单' }).inputValue(), '甲\n乙'); await shot('rating-operations');
  });
  await check('登录键盘语义、显示密码和验证码演示', async () => {
    await goto('mobile/portal'); await field('账号').fill('demo'); await page.getByLabel('密码', { exact: true }).fill('prototype'); await button('显示密码').click(); assert.equal(await page.getByLabel('密码', { exact: true }).getAttribute('type'), 'text'); await field('验证码').fill('cbvs'); await button('下一步').click(); assert.equal(await field('邮箱验证码').getAttribute('inputmode'), 'numeric'); await field('注册邮箱').fill('mobile@example.com'); await button('发送验证码').click(); await field('邮箱验证码').fill('123456'); assert.equal(await page.locator('[aria-invalid="true"]').count(), 0); await shot('portal-email'); await button('登录').click(); await page.locator('[data-scene="query"]').waitFor();
  });
  await check('四类供应商表单及个人注册跳过联系人', async () => {
    for (const type of ['企业供应商', '个人供应商', '政府机构', '国外供应商']) {
      await goto('mobile/register'); await choose('供应商类型', type); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (type === '个人供应商') { assert.ok((await page.locator('.m-steps').innerText()).includes('银行信息')); assert.ok(!(await page.locator('.m-steps').innerText()).includes('联系人信息')); }
    }
  });
  await check('少量选项不强制搜索，长枚举保留搜索', async () => {
    await goto('mobile/register'); await page.getByRole('combobox', { name: '企业类型', exact: true }).click(); assert.equal(await page.getByRole('dialog').getByRole('textbox').count(), 0); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await goto('mobile/permission-form'); await page.getByRole('combobox', { name: '所属权限', exact: true }).click(); assert.equal(await page.getByRole('dialog').getByRole('textbox').count(), 1);
  });
  await check('折叠分组中的错误自动展开并定位', async () => {
    await goto('mobile/bank-form'); await button('开户银行信息').click(); await button('保存此账户').click(); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '开户银行'); assert.ok(await button('开户银行').isVisible());
  });
  await check('维护填写页和嵌套选择层隔离背景及键盘焦点', async () => {
    await goto('mobile/bank'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); assert.ok(await page.locator('.m-bank-card').first().evaluate(n => !!n.closest('[inert]'))); await button('开户银行').click(); assert.ok(await page.locator('.m-fullscreen-panel').evaluate(n => n.inert || !!n.closest('[inert]') || [...n.children].some(c => c.inert))); await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await check('列表筛选和评分操作满足触控尺寸', async () => {
    await goto('mobile'); const filter = await button('筛选供应商').boundingBox(); assert.ok(filter.width >= 44 && filter.height >= 44); await goto('mobile/rating-edit'); for (const item of await page.locator('.m-star-control > span:first-child button').all()) { const rect = await item.boundingBox(); assert.ok(rect.width >= 44 && rect.height >= 44); }
  });
  await check('同名附件分别预览，普通账户删除不影响基本账户', async () => {
    await goto('mobile/bank');
    for (const number of ['000111', '000222']) { await button('新增银行信息').click(); await fillBank('一般账户'); await field('银行账号').fill(number); await button('保存此账户').click(); }
    const records = page.locator('.m-bank-card');
    await records.nth(0).getByRole('button', { name: '测试证明.png', exact: true }).click(); const second = await page.locator('.m-attachment-full').getAttribute('src'); await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
    await records.nth(1).getByRole('button', { name: '测试证明.png', exact: true }).click(); const first = await page.locator('.m-attachment-full').getAttribute('src'); assert.notEqual(first, second); await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
    assert.equal(await records.filter({ hasText: '基本账户' }).getByRole('button', { name: '删除', exact: true }).count(), 0); await records.nth(0).getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await records.count(), 2);
  });
  for (const width of [320, 390, 430, 768]) await check('代表页面宽度 ' + width, async () => {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 845 });
    for (const route of ['mobile', 'mobile/bank-form-selected', 'mobile/register-contacts', 'mobile/permissions', 'mobile/my-ratings', 'mobile/rating-ops', 'mobile/bank-application-form', 'mobile/rating-edit', 'mobile/portal']) {
      await goto(route); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + '横向溢出');
      if (width === 390) await shot('layout-' + route.split('/').at(-1));
    }
  });
  await check('电脑与移动入口切换样式隔离', async () => { await goto('login'); await page.locator('body').waitFor(); await goto('mobile'); assert.equal(await page.locator('.mobile-page').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)'); });
  const passed = results.filter(x => x.passed).length, failed = results.length - passed;
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, failed, results }, null, 2));
  console.log(JSON.stringify({ passed, failed, failures: results.filter(x => !x.passed) }, null, 2));
  if (failed) process.exitCode = 1;
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
