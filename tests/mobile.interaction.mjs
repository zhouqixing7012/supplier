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
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
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
  const field = name => page.getByRole(name.startsWith('搜索') || name === '请输入人员姓名' ? 'searchbox' : 'textbox', { name, exact: true });
  const headerBack = () => page.locator('.mobile-page > .m-header').getByRole('button', { name: '返回', exact: true }).click();
  const card = name => page.locator('.m-supplier-card').filter({ hasText: name });
  async function action(name, label) { await card(name).getByRole('button', { name: '更多操作', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click(); }
  async function rate(label, value) { const control = button(label + ' ' + Math.ceil(value) + '星'); const box = await control.boundingBox(), star = await control.locator('.m-star-slot').boundingBox(); await control.click({ position: { x: star.x - box.x + star.width * (Number.isInteger(value) ? .75 : .25), y: star.y - box.y + star.height / 2 } }); }
  async function dateValue(label, value) { await page.getByRole('listbox', { name: label, exact: true }).getByRole('option', { name: value + label, exact: true }).click(); }
  async function choose(label, value) { await page.getByRole('combobox', { name: label, exact: true }).click(); await page.getByRole('dialog').locator('.m-sheet-options').getByRole('button', { name: value, exact: true }).click(); }
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
    await button('开户银行').click(); await page.locator('.m-reference-card').filter({ hasText: '中国农业发展银行' }).first().click(); 
    await button('银行分行').click(); await page.locator('.m-reference-card').filter({ hasText: '北京市分行' }).click(); 
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
    await swipe(page.locator('.m-detail .m-swipe-area').first(), -130); assert.equal(await page.locator('.m-detail [aria-current="page"]').innerText(), '基本信息');
    await swipe(page.locator('.m-detail .m-swipe-area').first(), 130, 0, 100); assert.equal(await page.locator('.m-detail [aria-current="page"]').innerText(), '注册信息'); await shot('detail');
  });
  await check('查询详情返回保留关键词及滚动位置', async () => {
    await goto('mobile'); await page.getByRole('searchbox', { name: '搜索供应商名称或邀请人' }).fill('陈才慧'); await page.evaluate(() => scrollTo(0, 300)); const y = await page.evaluate(() => scrollY); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); await headerBack(); await page.locator('[data-scene="query"]').waitFor(); assert.equal(await page.getByRole('searchbox', { name: '搜索供应商名称或邀请人' }).inputValue(), '陈才慧'); assert.ok(Math.abs(await page.evaluate(() => scrollY) - y) < 90);
  });
  await check('我的邀请字段直接展示且详情返回保持来源', async () => {
    await goto('mobile/mine'); assert.ok(await card('代注册草稿').getByText('联系人邮箱', { exact: true }).isVisible()); await card('代注册草稿').getByRole('button', { name: '详情', exact: true }).click(); await headerBack(); await page.locator('[data-scene="mine"]').waitFor();
  });
  await check('查询筛选生效且重复打开回填，清空恢复', async () => {
    await goto('mobile'); await button('筛选供应商').click(); await choose('供应商状态', '草稿'); await button('应用筛选').click(); assert.equal(await page.locator('.m-supplier-card').count(), 1); await button('已筛选 · 1项').click(); assert.ok((await page.getByRole('combobox', { name: '供应商状态', exact: true }).innerText()).includes('草稿')); await button('取消').click(); await button('清除筛选').click(); assert.ok(await page.locator('.m-supplier-card').count() > 1);
  });
  await check('审批仅展示纵向节点，审批意见直接可见', async () => {
    await goto('mobile/approval'); assert.equal(await page.locator('.m-approval > .m-section:first-of-type .m-approval-timeline li').count(), 4); assert.equal(await page.locator('.m-approval table').count(), 0); assert.equal(await page.locator('.m-approval > .m-section:first-of-type .m-approval-timeline summary').count(), 0); assert.equal(await page.locator('.m-approval > .m-section:first-of-type .m-approval-timeline .m-row').filter({ hasText: '审批意见' }).count(), 4); await shot('approval');
  });
  await check('帮助可通过点击查看，日期初始化今天，长期可选', async () => {
    await goto('mobile/bank-form'); await button('开户银行填写说明').click(); await page.getByRole('dialog', { name: '开户银行填写说明' }).waitFor(); await button('知道了').click();
    await goto('mobile/register'); await button('证件有效期至').click(); assert.equal((await page.getByRole('listbox', { name: '年', exact: true }).getByRole('option', { selected: true }).innerText()).replace('年', ''), String(new Date().getFullYear())); await button('长期').click(); assert.ok((await button('证件有效期至').innerText()).includes('长期'));
  });
  await check('空分行和人员搜索提示与能力一致', async () => {
    await goto('mobile/inviter'); await button('新邀请人').click(); await page.getByText('请输入姓名搜索人员', { exact: true }).waitFor(); await page.getByRole('searchbox', { name: '请输入人员姓名' }).fill('不存在的姓名'); await page.getByText('没有匹配结果，请调整关键词', { exact: true }).waitFor(); await shot('people-empty');
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
    for (const slider of await page.getByRole('slider').all()) await rate(await slider.getAttribute('aria-label'), 3.5); await page.getByRole('slider', { name: '人员/服务质量', exact: true }).press('ArrowRight'); assert.equal(await page.getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), '4'); await page.getByRole('slider', { name: '人员/服务质量', exact: true }).press('ArrowLeft');
    await choose('合作类型', '电子产品'); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), '3.5');
    await shot('rating-edit'); await button('提交').click(); await page.locator('[data-scene="my-ratings"]').waitFor(); await button('全部').click(); await page.locator('.m-bank-card').filter({ hasText: '滴滴出行' }).first().getByRole('button', { name: '评分详情', exact: true }).click(); assert.equal(await page.getByRole('spinbutton').count(), 0); assert.ok((await page.locator('.mobile-page').innerText()).includes('3.5 / 5'));
  });
  await check('评分筛选保留状态、关键词、条件并可清除', async () => {
    await goto('mobile/my-ratings'); await button('未评分').click(); await page.getByRole('searchbox', { name: '搜索供应商或合作事项' }).fill('滴滴'); await button('筛选评分').click(); await field('所属部门').fill('ERP'); await button('应用筛选').click(); await page.locator('[data-scene="my-ratings"]').waitFor(); assert.equal(await page.getByRole('searchbox', { name: '搜索供应商或合作事项' }).inputValue(), '滴滴'); assert.equal(await page.locator('.m-status-tabs .active').innerText(), '未评分'); await button('筛选评分').click(); assert.equal(await field('所属部门').inputValue(), 'ERP'); await button('取消').click(); await button('清除筛选').click(); assert.equal(await page.locator('.m-filter-summary').count(), 0);
  });
  await check('权限编辑保存只是暂存，外层取消保护且正式详情不变', async () => {
    await goto('mobile/permissions'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await choose('权限分类', '火车'); await button('保存此权限').click(); await page.getByLabel('变更状态：修改', { exact: true }).waitFor(); await button('取消').click(); await button('放弃修改').click(); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); await button('分配权限').click(); assert.ok((await page.locator('.m-detail').innerText()).includes('飞机'));
  });
  await check('银行编辑取消保护、保存暂存、省市保留、提交不改原详情', async () => {
    await goto('mobile/bank'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await field('备注').fill('待提交备注'); await page.locator('.m-fullscreen-panel > .m-header').getByRole('button', { name: '返回', exact: true }).click(); await button('继续编辑').click(); assert.equal(await field('备注').inputValue(), '待提交备注'); await button('保存此账户').click(); await page.getByLabel('变更状态：修改', { exact: true }).waitFor(); await button('提交变更').click(); await page.locator('[data-scene="query"]').waitFor(); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); await button('银行信息').click(); assert.ok(!(await page.locator('.m-detail').innerText()).includes('待提交备注'));
  });
  await check('企业注册完整路径、单联系人编辑删除取消、银行编辑、预览直改', async () => {
    await goto('mobile/register'); await fillBasic(); await page.getByRole('button', { name: /下一步/ }).click(); await button('添加联系人').click(); await field('姓名').fill('移动联系人'); await field('电话').fill('13800138000'); await field('邮箱').fill('contact@example.com'); await button('保存联系人').click(); await button('删除联系人1').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('编辑联系人1').click(); assert.equal(await field('姓名').inputValue(), '移动联系人'); await button('保存联系人').click(); await page.getByRole('button', { name: /下一步/ }).click();
    await button('添加银行').click(); await fillBank(); await shot('bank-editor'); await button('添加以上信息').click(); assert.ok((await page.locator('.m-register-banks').innerText()).includes('尾号7890')); await page.getByRole('button', { name: /下一步/ }).click(); await button('修改基本信息').click(); await field('法人代表').fill('修改后的法人'); await button('保存并返回预览').click(); await page.locator('.m-register-preview').waitFor(); assert.ok((await page.locator('.m-register-preview').innerText()).includes('修改后的法人')); await button('修改银行信息').click(); await page.locator('.m-register-banks .m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('开户所在省').inputValue(), '北京市'); await button('添加以上信息').click(); await button('保存并返回预览').click(); await shot('register-preview'); await button('提交').click(); await page.locator('[data-scene="mine"]').waitFor(); assert.ok((await card('移动交互测试企业').innerText()).includes('审批中'));
  });
  await check('草稿保存后重开，已审批修改全部信息取消不改变', async () => {
    await goto('mobile/register'); await field('供应商名称').fill('保存草稿测试'); await button('保存草稿').click(); await action('保存草稿测试', '修改'); assert.equal(await field('供应商名称').inputValue(), '保存草稿测试'); await button('保存草稿').click(); await action('北京初然', '修改全部信息'); await field('供应商名称').fill('取消不保存'); await headerBack(); await button('放弃修改').click(); await page.locator('[data-scene="mine"]').waitFor(); assert.equal(await card('取消不保存').count(), 0);
  });
  await check('银行申请校验、结果回看、演示边界', async () => {
    await goto('mobile/bank-application'); await button('确认申请').click(); await button('提交').click(); assert.equal(await page.locator('[aria-invalid="true"]').count() > 0, true); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '银行名称'); for (const [label,value] of [['银行名称','申请测试银行'],['开户行(分行)名称','测试分行'],['开户行省','北京市'],['开户行市','北京市'],['申请说明','目录缺少此分行']]) await field(label).fill(value); await choose('国家/地区', '中国'); await button('提交').click(); await page.getByText('申请信息已暂存', { exact: true }).waitFor(); await shot('application-result'); await page.locator('.m-actions').getByRole('button', { name: '返回', exact: true }).click(); await button('查看本次申请').click(); await page.getByText('目录缺少此分行', { exact: true }).waitFor(); assert.equal(await page.getByText('未提交至真实审批服务，银行目录未更新。', { exact: true }).count(), 0);
  });
  await check('自选附件跨填写页预览及移除确认', async () => {
    await goto('mobile/bank'); await page.locator('.m-bank-card').first().getByRole('button', { name: '修改', exact: true }).click(); await page.getByLabel('开户证明', { exact: true }).setInputFiles(upload); await button('移除开户证明').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('保存此账户').click(); await page.getByRole('button', { name: '测试证明.png', exact: true }).click(); await button('打开附件').click(); assert.ok(await page.locator('.m-attachment-full').isVisible());
  });
  await check('运维查询支持排除姓名，真实批量执行仍禁用', async () => {
    await goto('mobile/rating-ops'); assert.ok(await button('批量发起评分').isDisabled()); await button('筛选评分运维').click(); await page.getByRole('textbox', { name: '排除评分人' }).fill('甲#乙'); assert.equal(await page.getByRole('textbox', { name: '排除评分人' }).inputValue(), '甲\n乙'); await shot('rating-operations');
  });
  await check('首页入口及登录键盘语义、显示密码和验证码演示', async () => {
    await goto('login'); const entry = page.getByRole('link', { name: '协同门户移动端', exact: true }); assert.ok(await entry.isVisible()); await entry.click(); await page.locator('[data-scene="portal"]').waitFor(); await button('关闭').click(); await page.locator('[data-scene="query"]').waitFor(); await goto('login'); await page.getByRole('link', { name: '协同门户移动端', exact: true }).click(); await field('账号').fill('demo'); await page.getByLabel('密码', { exact: true }).fill('prototype'); await button('显示密码').click(); assert.equal(await page.getByLabel('密码', { exact: true }).getAttribute('type'), 'text'); await field('验证码').fill('cbvs'); await button('下一步').click(); assert.equal(await field('邮箱验证码').getAttribute('inputmode'), 'numeric'); await field('注册邮箱').fill('mobile@example.com'); await button('发送验证码').click(); await field('邮箱验证码').fill('123456'); assert.equal(await page.locator('[aria-invalid="true"]').count(), 0); await shot('portal-email'); await button('登录').click(); await page.locator('[data-scene="workspace-home"]').waitFor();
  });
  await check('四类供应商表单及个人注册跳过联系人', async () => {
    for (const type of ['企业供应商', '个人供应商', '政府机构', '国外供应商']) {
      await goto('mobile/register'); await choose('供应商类型', type); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (type === '个人供应商') { await page.locator('.m-steps-toggle').click(); assert.ok((await page.locator('.m-registration-steps').innerText()).includes('银行信息')); assert.ok(!(await page.locator('.m-registration-steps').innerText()).includes('联系人信息')); }
    }
  });
  await check('少量选项不强制搜索，长枚举保留搜索', async () => {
    await goto('mobile/register'); await page.getByRole('combobox', { name: '企业类型', exact: true }).click(); assert.equal(await page.getByRole('dialog').getByRole('searchbox').count(), 0); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await goto('mobile/permission-form'); await page.getByRole('combobox', { name: '所属权限', exact: true }).click(); assert.equal(await page.getByRole('dialog').getByRole('searchbox').count(), 1);
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
    for (const number of ['000111', '000222']) { await button('添加银行账户').click(); await fillBank('一般账户'); await field('银行账号').fill(number); await button('保存此账户').click(); }
    const records = page.locator('.m-bank-card');
    await records.nth(0).getByRole('button', { name: '测试证明.png', exact: true }).click(); await button('打开附件').click(); const second = await page.locator('.m-attachment-full').getAttribute('src'); await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
    await records.nth(1).getByRole('button', { name: '测试证明.png', exact: true }).click(); await button('打开附件').click(); const first = await page.locator('.m-attachment-full').getAttribute('src'); assert.notEqual(first, second); await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
    assert.ok(await records.filter({ hasText: '基本账户' }).getByRole('button', { name: '删除', exact: true }).isDisabled()); assert.ok((await records.filter({ hasText: '基本账户' }).innerText()).includes('企业供应商的基本账户不可删除')); await records.nth(0).getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await records.count(), 2);
  });
  await check('竖向步骤默认收起，展开顺序、当前步骤和窄屏布局正确', async () => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 845 }); await goto('mobile/register');
      const toggle = page.locator('.m-steps-toggle'); assert.equal(await toggle.getAttribute('aria-expanded'), 'false'); assert.ok((await toggle.innerText()).includes('第 1 / 4 步'));
      await toggle.click(); const items = await page.locator('.m-registration-steps li').all(); assert.equal(items.length, 4);
      const boxes = await Promise.all(items.map(n => n.boundingBox())); for (let i = 1; i < boxes.length; i++) { assert.ok(boxes[i].y > boxes[i - 1].y); assert.equal(boxes[i].x, boxes[0].x); }
      assert.ok((await page.locator('.m-registration-steps [aria-current="step"]').innerText()).includes('基本信息'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot('vertical-steps-' + width); await toggle.click(); assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('供应商蓝条与关键摘要默认可见，常用操作不藏菜单', async () => {
    await goto('mobile'); const records = page.locator('.m-supplier-card'); assert.equal(await records.locator('h3 .m-blue-mark').count(), await records.count());
    const sample = card('北京初然'); assert.ok(await sample.locator('.m-supplier-kind').filter({ hasText: '企业供应商' }).isVisible()); assert.ok(await sample.getByText('未评分', { exact: true }).isVisible()); assert.ok(await sample.getByRole('button', { name: '修改银行', exact: true }).isVisible());
    assert.ok((await sample.locator('.m-supplier-kind').innerText()).includes('代注册')); const mark = await sample.locator('.m-blue-mark').boundingBox(); assert.ok(mark.width > 0 && mark.height > 0); await page.screenshot({ path: path.join(output, 'query-viewport.png') }); await shot('supplier-summary');
    await goto('mobile/mine'); assert.ok(await card('代注册草稿').getByRole('button', { name: '修改', exact: true }).isVisible()); assert.ok(await card('北京初然').getByRole('button', { name: '修改全部信息', exact: true }).isVisible());
  });
  await check('权限入口不经过二级更多，常用修改可直接进入', async () => {
    await goto('mobile'); await card('代注册草稿').getByRole('button', { name: '修改', exact: true }).click(); await headerBack(); await page.locator('[data-scene="query"]').waitFor(); await action('北京初然', '分配权限'); await page.locator('[data-scene="permissions"]').waitFor(); await button('取消').click(); await card('北京初然').getByRole('button', { name: '修改银行', exact: true }).click(); await page.locator('[data-scene="bank"]').waitFor();
  });
  await check('窄屏与长名称字段保持标签输入同行', async () => {
    await page.setViewportSize({ width: 390, height: 845 }); await goto('mobile/register'); const short = page.locator('[data-field-label="法人代表"]'); const long = page.locator('[data-field-label="供应商名称"]');
    assert.equal(await short.evaluate(n => getComputedStyle(n).display), 'flex'); assert.equal(await long.evaluate(n => getComputedStyle(n).display), 'flex');
    await page.setViewportSize({ width: 320, height: 845 }); assert.equal(await short.evaluate(n => getComputedStyle(n).display), 'flex'); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('评分页先展示评分项，基础信息可展开且结果不浮动遮挡', async () => {
    await goto('mobile/rating-edit'); const info = button('供应商基本信息'); assert.equal(await info.getAttribute('aria-expanded'), 'false'); assert.ok((await page.locator('.m-rating-dimension').first().boundingBox()).y < 845); await shot('rating-focused'); await info.click(); await page.getByText('供应商名称', { exact: true }).waitFor(); await shot('rating-basic-expanded');
    await goto('mobile/register'); await field('供应商名称').fill('结果展示检查'); await button('保存草稿').click(); await page.locator('[data-scene="mine"]').waitFor(); assert.equal(await page.locator('.m-result-banner').evaluate(n => getComputedStyle(n).position), 'relative'); assert.ok((await page.locator('.m-result-banner').boundingBox()).y < (await page.locator('.mobile-page').boundingBox()).y);
  });
  await check('导出日期前置校验、所选CSV和取消回到来源', async () => {
    await goto('mobile/shot/200311'); await button('导出供应商').click(); await button('生成演示文件').click(); assert.ok(await page.getByText('请选择邀请开始日期', { exact: true }).count());
    for (const label of ['邀请开始日期', '邀请结束日期']) { await button(label).click(); await page.getByRole('dialog', { name: label, exact: true }).getByRole('button', { name: '确认', exact: true }).click(); }
    // 样本邀请日期为2026-10-14，设置日期轮盘而非绕过表单。
    for (const label of ['邀请开始日期', '邀请结束日期']) { await button(label).click(); await dateValue('年', '2026'); await dateValue('月', '10'); await dateValue('日', '14'); await page.getByRole('dialog', { name: label, exact: true }).getByRole('button', { name: '确认', exact: true }).click(); }
    await choose('导出范围', '所选记录'); await page.getByRole('checkbox', { name: '导出北京初然文化传媒有限公司733324', exact: true }).check(); await button('生成演示文件').click();
    const csv = await page.locator('a[download="供应商-演示数据.csv"]').evaluate(async a => await (await fetch(a.href)).text()); assert.ok(csv.includes('北京初然文化传媒有限公司733324')); assert.ok(!csv.includes('快速创建557348')); await shot('export-selected'); await button('取消').click(); await page.locator('[data-scene="mine"]').waitFor();
    await goto('mobile/shot/200321'); await page.getByRole('dialog', { name: '导出供应商' }).waitFor(); await button('取消').click(); await page.locator('[data-scene="mine"]').waitFor();
  });
  await check('地址半屏编辑、搜索与取消不跳页', async () => {
    await goto('mobile/register'); await button('注册地址').click(); assert.equal(await page.getByRole('dialog', { name: '编辑注册地址', exact: true }).count(), 1); assert.equal(await page.locator('.m-fullscreen-panel').count(), 0); await button('选择地址').click(); await field('搜索当前省市区').fill('北京'); assert.equal(await page.locator('.m-sheet-options button').count(), 1); await page.locator('.m-sheet-options').getByRole('button', { name: '北京市', exact: true }).click(); await page.locator('.m-sheet-options').getByRole('button', { name: '北京市', exact: true }).click(); await page.locator('.m-sheet-options').getByRole('button', { name: '朝阳区', exact: true }).click(); await field('详细地址').fill('不应写入'); await button('取消').click(); await button('放弃修改').click(); assert.equal(await button('注册地址').innerText(), '请选择注册地址');
  });
  await check('门户导航、内容滑动、价税直达去重和返回', async () => {
    await goto('mobile/workspace-home'); await button('业务任务').click(); await button('价税拆分').click(); await page.locator('[data-scene="workspace-tax-split"]').waitFor(); assert.equal(await page.getByText('物料编码', { exact: true }).count(), 1); assert.equal(await page.getByText('含税金额', { exact: true }).count(), 1); await button('返回待处理任务').click(); assert.equal(await page.locator('.m-tabs [aria-current]').innerText(), '价税拆分待处理'); await swipe(page.locator('.m-workspace .m-section h2'), -130); await page.getByText('暂无已处理的价税拆分记录').waitFor(); await button('账户').click(); await button('退出登录').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('退出登录').click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); await page.locator('[data-scene="portal"]').waitFor();
  });
  await check('门户只读修改取消、清空、保存对比与审批原值保留', async () => {
    await goto('mobile/workspace-info'); assert.equal(await field('法人代表').count(), 0); await button('修改').click(); await field('法人代表').fill('取消修改测试'); await button('取消修改').click(); await button('放弃修改').click(); assert.equal(await page.getByText('取消修改测试', { exact: true }).count(), 0);
    await button('修改').click(); await button('清空法人代表').click(); assert.equal(await field('法人代表').inputValue(), ''); await button('保存修改').click(); assert.equal(await page.locator('[aria-invalid="true"]').count(), 1); assert.equal(await page.getByRole('alert').count(), 1); await field('法人代表').fill('变更后的法人'); await shot('portal-edit'); await button('保存修改').click(); await page.locator('[data-scene="workspace-changes"]').waitFor(); assert.ok((await page.locator('.m-change-comparison').innerText()).includes('变更后的法人')); await button('提交变更').click(); await page.locator('[data-scene="workspace-approval"]').waitFor(); assert.ok(await page.getByText('修改前后对比', { exact: true }).isVisible()); await button('返回供应商信息').click(); assert.equal(await page.getByText('变更后的法人', { exact: true }).count(), 0); await button('查看审批').click(); await shot('portal-change-approval');
  });
  await check('门户银行修改回填和联系人专用图标', async () => {
    await goto('mobile/workspace-info'); await button('银行信息').click(); await button('修改').click(); await page.locator('.m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('开户所在省').inputValue(), '北京市'); assert.equal(await field('银行账号').inputValue(), '6214589503254174'); await page.getByRole('dialog', { name: '门户银行编辑' }).locator('.m-actions').getByRole('button', { name: '取消', exact: true }).click(); await button('取消修改').click(); await button('联系人信息').click(); await button('修改').click(); assert.equal(await button('添加联系人').locator('svg').count(), 1);
  });
  await check('批量邀请人按钮在320宽完整可见', async () => {
    await page.setViewportSize({ width: 320, height: 845 }); await goto('mobile/mine-batch'); const target = button('批量变更邀请人'); assert.ok(await target.isVisible()); assert.equal(await target.evaluate(n => n.scrollWidth <= n.clientWidth), true); await shot('batch-320'); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('管理全部信息保存后与审批页对比且正式版本保留', async () => {
    await goto('mobile/mine'); await action('北京初然', '修改全部信息'); await fillBasic('管理信息变更测试');
    await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: /下一步/ }).click(); await page.getByRole('button', { name: /下一步/ }).click(); await page.getByText('修改前后对比', { exact: true }).waitFor(); await button('提交').click(); await page.locator('[data-scene="information-change"]').waitFor(); await button('查看审批').click(); await page.getByText('修改前后对比', { exact: true }).waitFor(); await headerBack(); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); assert.equal(await page.getByText('管理信息变更测试', { exact: true }).count(), 0); await button('审批记录').click(); assert.equal(await page.getByText('修改前后对比', { exact: true }).count(), 1);
  });
  await check('门户内容紧接标题且底部导航不遮挡末项', async () => {
    await goto('mobile/workspace-home'); assert.ok((await page.locator('.m-workspace').boundingBox()).y < 150); await page.screenshot({ path: path.join(output, 'portal-home-viewport.png') });
    await goto('mobile/workspace-info'); await button('修改').click(); await field('备注').scrollIntoViewIfNeeded(); const last = await field('备注').boundingBox(), footer = await page.locator('.m-workspace .m-actions').boundingBox(); assert.ok(last.y + last.height <= footer.y + 1); await page.screenshot({ path: path.join(output, 'portal-edit-viewport.png') });
  });
  await check('筛选单选点击即收起，状态无搜索，查询确定前不生效', async () => {
    await goto('mobile'); const count = await page.locator('.m-supplier-card').count(); await button('筛选供应商').click(); await page.getByRole('combobox', { name: '供应商状态', exact: true }).click(); const picker = page.getByRole('dialog', { name: '供应商状态', exact: true }); assert.equal(await picker.getByRole('searchbox').count(), 0); assert.equal(await picker.getByRole('button', { name: '确认', exact: true }).count(), 0); await page.screenshot({ path: path.join(output, 'status-picker-viewport.png') }); await picker.getByRole('button', { name: '草稿', exact: true }).click(); assert.equal(await picker.count(), 0); await button('取消').click(); assert.equal(await page.locator('.m-supplier-card').count(), count);
    await button('筛选供应商').click(); await choose('供应商状态', '草稿'); await button('应用筛选').click(); assert.equal(await page.locator('.m-supplier-card').count(), 1); await button('已筛选 · 1项').click(); await page.getByRole('combobox', { name: '供应商状态', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '清空选择', exact: true }).click(); await button('应用筛选').click(); assert.equal(await page.locator('.m-supplier-card').count(), count);
  });
  await check('行业枚举完整且筛选使用行业数据', async () => {
    await goto('mobile'); await button('筛选供应商').click(); await page.getByRole('combobox', { name: '供应商推荐', exact: true }).click(); const picker = page.getByRole('dialog'); assert.equal(await picker.locator('.m-sheet-options button').count(), 21); assert.equal(await picker.getByRole('searchbox').count(), 1); await picker.getByRole('searchbox').fill('农林'); await picker.getByRole('button', { name: '农林牧渔业', exact: true }).click(); await button('应用筛选').click(); assert.equal(await page.locator('.m-supplier-card').count(), 1); assert.ok((await page.locator('.m-supplier-card').innerText()).includes('快速创建'));
  });
  await check('日期同行及滚轮取消确认在320与390宽可用', async () => {
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile'); await button('筛选供应商').click(); for (const label of ['邀请时间（起）', '邀请时间（止）']) { const row = page.locator('[data-field-label="' + label + '"]'); const a = await row.locator('label').boundingBox(), b = await row.locator('.m-select-field').boundingBox(); assert.ok(Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 5); } await button('邀请时间（起）').click(); const picker = page.getByRole('dialog'); await dateValue('日', '14'); assert.ok(await picker.getByRole('button', { name: '确认', exact: true }).isVisible()); await page.screenshot({ path: path.join(output, 'date-picker-' + width + '.png') }); await picker.getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await button('邀请时间（起）').innerText()).includes('请选择')); await page.screenshot({ path: path.join(output, 'filter-inline-' + width + '.png') }); }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('查询多选入口恢复，标签目录不同图标且不越权删除导出', async () => {
    await goto('mobile'); assert.ok(await button('批量选择').isVisible()); assert.notEqual(await button('批量选择').locator('svg').getAttribute('class'), await button('全部标签').first().locator('svg').getAttribute('class')); await button('批量选择').click(); assert.equal(await page.locator('.m-batch-actions').count(), 1); await goto('mobile/query-batch'); await page.getByRole('checkbox', { name: '全选当前结果', exact: true }).check(); assert.equal(await page.locator('.m-supplier-card input[type=checkbox]:enabled').count(), await page.locator('.m-supplier-card input:checked').count()); assert.ok(await button('删除').isEnabled()); await button('退出批量选择').click(); assert.equal(await page.locator('.m-batch-actions').count(), 0); await goto('mobile/mine'); assert.equal(await button('导出供应商').count(), 0); await goto('mobile/shot/201829'); assert.ok(await button('删除').isVisible());
  });
  await check('列表直接展示原字段，无更多信息折叠', async () => {
    await goto('mobile'); assert.equal(await page.locator('.m-card-extra').count(), 0); assert.ok(await card('北京初然').locator('.m-supplier-kind').filter({ hasText: '代注册' }).isVisible()); await goto('mobile/mine'); assert.ok(await card('北京初然').getByText('联系人邮箱', { exact: true }).isVisible());
  });
  await check('门户已保存修改可继续编辑并保留其他分组', async () => {
    await goto('mobile/workspace-info'); await button('修改').click(); await field('法人代表').fill('保留的基本资料修改'); await button('保存修改').click(); await button('继续修改').click(); assert.equal(await field('法人代表').inputValue(), '保留的基本资料修改'); await button('联系人信息').click(); await button('修改').click(); await button('编辑联系人1').click(); await field('姓名').fill('保留的联系人修改'); await button('保存联系人').click(); await button('保存修改').click(); const text = await page.locator('.m-change-comparison').innerText(); assert.ok(text.includes('保留的基本资料修改')); assert.ok(text.includes('保留的联系人修改')); await button('继续修改').click(); await button('银行信息').click(); await button('修改').click(); await page.locator('.m-bank-card').getByRole('button', { name: '修改', exact: true }).click(); await field('备注').fill('保留的银行修改'); await button('保存此账户').click(); await button('保存修改').click(); const all = await page.locator('.m-change-comparison').innerText(); for (const value of ['保留的基本资料修改', '保留的联系人修改', '保留的银行修改']) assert.ok(all.includes(value));
  });
  await check('门户价税标题返回恢复待处理来源', async () => {
    await goto('mobile/workspace-tasks'); await button('价税拆分').click(); await headerBack(); await page.locator('[data-scene="workspace-tasks"]').waitFor(); assert.equal(await page.locator('.m-tabs [aria-current]').innerText(), '价税拆分待处理');
  });
  await check('联系人删除按记录身份对比，不把后续记录误报为修改', async () => {
    await goto('mobile/workspace-info'); await button('联系人信息').click(); await button('修改').click(); await button('添加联系人').click(); await field('姓名').fill('新联系人'); await field('电话').fill('13800000001'); await field('邮箱').fill('new@example.com'); await button('保存联系人').click(); await button('保存修改').click(); await button('继续修改').click(); await button('删除联系人1').click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); await button('保存修改').click(); const headings = await page.locator('.m-change-comparison h3').allTextContents(); assert.ok(headings.some(t => t.includes('删除') && t.includes('姓名'))); assert.ok(headings.some(t => t.includes('新增') && t.includes('姓名'))); assert.ok(!headings.some(t => t.includes('修改 · 联系人')));
  });
  await check('导出页可扩大日期范围，不受来源日期预裁切限制', async () => {
    await goto('mobile/query-export?start=2026-10-14&end=2026-10-14'); await button('导出供应商').click(); await button('邀请开始日期').click(); const picker = page.getByRole('dialog', { name: '邀请开始日期', exact: true }); await dateValue('年', '2023'); await dateValue('月', '7'); await dateValue('日', '4'); await picker.getByRole('button', { name: '确认', exact: true }).click(); await button('生成演示文件').click(); const csv = await page.locator('a[download]').evaluate(async a => (await fetch(a.href)).text()); assert.ok(csv.includes('老六的公司'));
  });
  await check('退出门户明确提示未提交修改，取消退出仍可继续提交', async () => {
    await goto('mobile/workspace-info'); await button('修改').click(); await field('法人代表').fill('退出后需提示的资料'); await button('保存修改').click(); await headerBack(); await button('返回首页').click(); await button('账户').click(); await button('退出登录').click(); assert.ok((await page.getByRole('dialog').innerText()).includes('退出将放弃')); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await button('首页').click(); await button('继续提交资料修改').click(); assert.ok((await page.locator('.m-change-comparison').innerText()).includes('退出后需提示的资料'));
  });
  await check('规范吸收：状态语义在列表、详情和门户一致', async () => {
    await goto('mobile'); const listTag = card('北京初然').locator('.m-status'); assert.equal(await listTag.innerText(), '已审批'); assert.equal(await listTag.getAttribute('data-tone'), 'success'); const appearance = await listTag.evaluate(n => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor]); await card('北京初然').getByRole('button', { name: '详情', exact: true }).click(); const detailTag = page.locator('.m-detail-summary .m-status'); assert.deepEqual(await detailTag.evaluate(n => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor]), appearance); await goto('mobile/workspace-home'); assert.equal(await page.locator('.m-workspace .m-status').getAttribute('data-tone'), 'success'); await page.screenshot({ path: path.join(output, 'adopt-home.png') });
  });
  await check('规范吸收：已应用条件值、结果数和取消保持一致', async () => {
    await goto('mobile'); await button('筛选供应商').click(); await choose('供应商状态', '已审批'); await choose('供应商推荐', '信息传输、计算机服务和软件业'); await button('应用筛选').click(); const summary = page.getByRole('region', { name: '当前查询条件' }); const text = await summary.innerText(); assert.ok(text.includes('已审批')); assert.ok(text.includes('信息传输、计算机服务和软件业')); assert.ok(text.includes('共 2 家供应商')); await button('已筛选 · 2项').click(); await choose('供应商状态', '草稿'); await button('取消').click(); assert.ok((await summary.innerText()).includes('已审批')); assert.equal(await page.locator('.m-supplier-card').count(), 2); await page.screenshot({ path: path.join(output, 'adopt-applied-filters.png') });
  });
  await check('规范吸收：搜索和应用筛选后清除旧批量选择', async () => {
    await goto('mobile/mine-batch'); await page.getByRole('checkbox', { name: '选择北京初然文化传媒有限公司733324', exact: true }).check(); await field('搜索供应商名称或邀请人').fill('草稿'); await page.waitForFunction(() => document.querySelectorAll('.m-supplier-card input:checked').length === 0); assert.ok((await page.locator('.m-batch-actions').innerText()).includes('已选 0 项')); await button('清空搜索').click(); await page.getByRole('checkbox', { name: '选择北京初然文化传媒有限公司733324', exact: true }).check(); await button('筛选供应商').click(); await choose('供应商状态', '草稿'); await button('应用筛选').click(); assert.equal(await page.locator('.m-supplier-card input:checked').count(), 0); assert.equal(await page.locator('.m-supplier-card').count(), 1);
  });
  await check('规范吸收：空列表与无匹配结果明确区分', async () => {
    await goto('mobile/shot/200005'); await page.getByText('暂无供应商记录', { exact: true }).waitFor(); await goto('mobile'); await field('搜索供应商名称或邀请人').fill('没有这家供应商'); await page.getByText('暂无匹配结果，请调整搜索或筛选条件', { exact: true }).waitFor(); await button('清空搜索').click(); assert.ok(await page.locator('.m-supplier-card').count() > 0);
  });
  await check('规范吸收：长文件名可读，长选项层标题和动作可达', async () => {
    await page.setViewportSize({ width: 320, height: 640 }); await goto('mobile/register'); const name = '供应商注册营业执照与补充证明长文件名称'.repeat(5) + '.png'; await page.getByLabel('营业执照', { exact: true }).setInputFiles({ ...upload, name }); const line = page.locator('.m-attachment-name'); assert.ok((await line.innerText()).includes(name)); assert.ok(await line.evaluate(n => n.scrollWidth <= n.clientWidth)); await page.getByRole('combobox', { name: '所属行业', exact: true }).click(); const sheet = page.getByRole('dialog'); await sheet.evaluate(n => { n.scrollTop = n.scrollHeight; }); for (const label of ['取消', '清空选择']) { const box = await sheet.getByRole('button', { name: label, exact: true }).boundingBox(); assert.ok(box.y >= 0 && box.y + box.height <= 640); } await page.screenshot({ path: path.join(output, 'adopt-long-picker.png') }); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('规范吸收：主操作与占位文字保持足够对比', async () => {
    await goto('mobile/register'); const colors = await page.locator('.m-actions button').last().evaluate(n => [getComputedStyle(n).color, getComputedStyle(n).backgroundColor]); const luminance = rgb => rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0); const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05); assert.ok(contrast(...colors) >= 4.5); const placeholder = await field('供应商名称').evaluate(n => getComputedStyle(n, '::placeholder').color); assert.ok(contrast(placeholder, 'rgb(255,255,255)') >= 4.5);
  });
  await check('移动复核：日期居中、键盘选择、闰日与单日期清空', async () => {
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 845 }); await goto('mobile'); await button('筛选供应商').click(); await button('邀请时间（起）').click();
      await dateValue('年', '2024'); await dateValue('月', '1'); await dateValue('日', '31'); await dateValue('月', '2');
      await page.waitForFunction(() => document.querySelector('[role=listbox][aria-label="日"] [aria-selected=true]')?.textContent === '29日');
      for (const name of ['年', '月', '日']) { const wheel = page.getByRole('listbox', { name, exact: true }); const box = await wheel.boundingBox(), chosen = await wheel.getByRole('option', { selected: true }).boundingBox(); assert.ok(Math.abs(chosen.y + chosen.height / 2 - box.y - box.height / 2) < 2); }
      for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert.ok(await page.getByRole('dialog').evaluate(n => n.contains(document.activeElement))); } await page.screenshot({ path: path.join(output, 'ux-date-' + width + '.png') }); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.ok((await button('邀请时间（起）').innerText()).includes('2024-02-29'));
      await button('邀请时间（止）').click(); await page.getByRole('listbox', { name: '日', exact: true }).press('End'); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); const end = await button('邀请时间（止）').innerText();
      await button('邀请时间（起）').click(); await button('清空日期').click(); assert.ok((await button('邀请时间（起）').innerText()).includes('请选择')); assert.equal(await button('邀请时间（止）').innerText(), end);
    }
    await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('移动复核：银行空态新增、零变更禁用与目录选择', async () => {
    await goto('mobile'); await card('快速创建').getByRole('button', { name: '修改银行', exact: true }).click(); assert.ok(await button('提交变更').isDisabled()); await button('添加银行账户').click(); assert.ok(await page.getByRole('heading', { name: '新增银行账户', exact: true }).isVisible()); await button('开户银行').click(); const picker = page.getByRole('dialog'); assert.equal(await picker.getByRole('button', { name: '确定', exact: true }).count(), 0); await page.screenshot({ path: path.join(output, 'ux-bank-picker.png') }); await picker.getByRole('radio').first().click(); assert.equal(await picker.count(), 0); assert.ok((await button('开户银行').innerText()).includes('中国农业发展银行'));
  });
  await check('移动复核：查询批量删除只选草稿，我的邀请保留独立入口', async () => {
    await goto('mobile'); await button('批量选择').click(); assert.equal(await page.locator('.m-batch-actions').count(), 1); assert.ok(await button('删除').isDisabled()); await goto('mobile/mine'); await button('批量选择').click(); assert.equal(await page.locator('.m-batch-actions').count(), 1); assert.ok(await button('删除').isVisible()); assert.ok(await button('批量变更邀请人').isVisible()); await goto('mobile/shot/201829'); assert.ok(await page.getByRole('checkbox', { name: '全选当前结果', exact: true }).isDisabled()); assert.ok(await button('删除').isDisabled()); await goto('mobile/register'); await field('供应商名称').fill('批量草稿验证'); await button('保存草稿').click(); await page.goto((await page.url()).split('#')[0] + '#/mobile/shot/201829'); await page.getByRole('checkbox', { name: '全选当前结果', exact: true }).check(); const enabled = page.locator('.m-supplier-card input[type=checkbox]:enabled'); assert.equal(await enabled.count(), await page.locator('.m-supplier-card input:checked').count()); assert.ok(await button('删除').isVisible());
  });
  await check('移动复核：点击星星左右半边直接选择半星整星', async () => {
    await goto('mobile/my-ratings'); await page.locator('.m-bank-card').first().getByRole('button', { name: '评分', exact: true }).click(); assert.equal(await page.locator('.m-rating-precision').count(), 0); assert.equal(await page.getByText('点击星星左半边选半星，右半边选整星。', { exact: true }).count(), 0); assert.equal(await page.getByRole('spinbutton').count(), 0);
    for (let score = .5; score <= 5; score += .5) { await rate('人员/服务质量', score); assert.equal(await page.getByRole('slider', { name: '人员/服务质量', exact: true }).getAttribute('aria-valuenow'), String(score)); }
    await rate('人员/服务质量', 3.5); await page.screenshot({ path: path.join(output, 'ux-rating.png') });
  });
  await check('移动复核：注册不分组定位，附件查看替换分离', async () => {
    await goto('mobile/register'); assert.equal(await page.getByRole('navigation', { name: '基本信息分组' }).count(), 0); assert.equal(await page.locator('.m-basic-group').count(), 0); await page.getByLabel('营业执照', { exact: true }).setInputFiles(upload); await button('查看营业执照').click(); await button('打开附件').click(); assert.ok(await page.locator('.m-attachment-full').isVisible()); await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click(); const chooser = page.waitForEvent('filechooser'); await page.getByText('替换照片或文件', { exact: true }).click(); await (await chooser).setFiles({ ...upload, name: '替换证明.png' }); assert.ok((await page.locator('.m-attachment-name').innerText()).includes('替换证明.png')); await page.getByLabel('营业执照', { exact: true }).setInputFiles({ name: '证明.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }); await button('查看营业执照').click(); await button('打开附件').click(); assert.ok(await page.getByRole('link', { name: '打开文件', exact: true }).isVisible()); await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click(); await page.screenshot({ path: path.join(output, 'ux-form.png') });
    await goto('mobile/workspace-info?edit=1'); await button('查看营业执照').click(); assert.ok(await page.getByText('此附件仅有截图示例，未提供原件，暂不可预览原图。', { exact: true }).isVisible()); assert.equal(await page.locator('.m-attachment-full').count(), 0);
  });
  await check('移动复核：运维创建日期和排除姓名筛选、取消及导出一致', async () => {
    await goto('mobile/rating-ops'); await button('筛选评分运维').click(); await field('排除评分人').fill('陈才慧'); await button('应用筛选').click(); assert.equal(await page.locator('.m-rating-list .m-bank-card').count(), 1); assert.ok((await page.locator('.m-rating-list').innerText()).includes('李雨思')); const downloadReady = page.waitForEvent('download'); await button('导出当前记录').click(); const csv = await fs.readFile(await (await downloadReady).path(), 'utf8'); assert.ok(csv.includes('李雨思') && !csv.includes('陈才慧')); await button('筛选评分运维').click(); await field('排除评分人').fill('李雨思'); await button('关闭').click(); assert.equal(await page.locator('.m-rating-list .m-bank-card').count(), 1); await button('筛选评分运维').click(); assert.equal(await field('排除评分人').inputValue(), '陈才慧'); await button('创建时间（起）').click(); await dateValue('年', '2027'); await page.getByRole('dialog', { name: '创建时间（起）', exact: true }).getByRole('button', { name: '确认', exact: true }).click(); await button('应用筛选').click(); assert.equal(await page.locator('.m-rating-list .m-bank-card').count(), 0); assert.ok(await button('批量发起评分').isDisabled());
  });
  await check('反馈修正：银行新增入口常显、无变更汇总且编辑目标不串行', async () => {
    await goto('mobile/bank'); assert.ok(await button('添加银行账户').isVisible()); assert.ok((await button('添加银行账户').boundingBox()).y < (await page.locator('.m-bank-card').first().boundingBox()).y); assert.ok(await page.locator('.m-bank-card').first().getByRole('button', { name: '删除', exact: true }).isDisabled());
    for (const number of ['000111', '000222']) { await button('添加银行账户').click(); await fillBank('一般账户'); await field('银行账号').fill(number); await button('保存此账户').click(); assert.ok(await button('添加银行账户').isVisible()); }
    assert.equal(await page.locator('.m-pending-changes').count(), 0); assert.equal(await button('只看变更').count(), 0); assert.equal(await page.locator('.m-bank-card').count(), 3);
    const target = page.locator('.m-bank-card').filter({ hasText: '000111' }); await target.getByRole('button', { name: '修改', exact: true }).click(); assert.equal(await field('银行账号').inputValue(), '000111'); await field('备注').fill('只编辑目标账户'); await button('保存此账户').click(); assert.ok((await target.innerText()).includes('只编辑目标账户')); assert.ok(!(await page.locator('.m-bank-card').filter({ hasText: '000222' }).innerText()).includes('只编辑目标账户')); assert.ok(await target.getByRole('button', { name: '删除', exact: true }).isEnabled());
    const heading = target.locator('.m-record-heading'), badge = heading.getByLabel('变更状态：新增'); assert.ok(await badge.isVisible()); const hb = await heading.boundingBox(), bb = await badge.boundingBox(); assert.ok(bb.x + bb.width > hb.x + hb.width - 24); await shot('followup-bank');
    await target.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await target.count(), 1); await target.getByRole('button', { name: '删除', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await target.count(), 0); assert.equal(await page.locator('.m-bank-card').count(), 2);
  });
  await check('反馈修正：权限变更状态同样位于卡片右上角', async () => {
    await goto('mobile/permissions'); await button('新增权限').click(); await choose('所属权限', '集团权限'); await choose('权限分类', '集团其他业务'); await button('保存此权限').click(); const badge = page.locator('.m-bank-card .m-record-heading').getByLabel('变更状态：新增'); assert.ok(await badge.isVisible()); assert.equal(await page.locator('.m-pending-changes').count(), 0); assert.equal(await button('只看变更').count(), 0); assert.equal(await page.locator('.m-bank-card').count(), 2);
  });
  await check('反馈修正：三个列表筛选入口共用图标组件', async () => {
    const icons = []; for (const [route, name] of [['mobile', '筛选供应商'], ['mobile/my-ratings', '筛选评分'], ['mobile/rating-ops', '筛选评分运维']]) { await goto(route); const control = button(name); assert.equal(await control.innerText(), ''); icons.push(await control.locator('img').getAttribute('src')); const box = await control.boundingBox(); assert.ok(box.width >= 44 && box.height >= 44); await control.click(); assert.ok(await button('应用筛选').isVisible()); } assert.equal(new Set(icons).size, 1);
  });
  await check('反馈修正：紧凑胶囊、同行值、只读无灰底及图片删除小图标', async () => {
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/detail'); const tabs = page.locator('.m-tab-bar-pill'); assert.ok((await tabs.boundingBox()).height <= 46); const current = tabs.locator('button.active'); const visual = await current.evaluate(n => { const s = getComputedStyle(n, '::before'); return n.offsetHeight - parseFloat(s.top) - parseFloat(s.bottom); }); assert.equal(visual, 32); for (const row of await page.locator('.m-detail .m-row').all()) { const l = await row.locator('.m-label').boundingBox(), v = await row.locator('.m-value').boundingBox(); assert.ok(Math.abs(l.y - v.y) < 2); } }
    await goto('mobile/bank-form-selected'); assert.equal(await field('开户所在省').evaluate(n => getComputedStyle(n).backgroundColor), 'rgba(0, 0, 0, 0)'); await goto('mobile/register'); await page.getByLabel('营业执照', { exact: true }).setInputFiles(upload); const remove = page.getByRole('button', { name: '移除营业执照', exact: true }); const rect = await remove.boundingBox(); assert.ok(rect.width <= 28 && rect.height <= 28); await remove.click(); assert.ok(await page.getByRole('dialog').isVisible()); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); await page.screenshot({ path: path.join(output, 'feedback-register.png') }); await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('工作台组件：搜索有记录、无记录及清空恢复，原始资产显示', async () => {
    await goto('mobile'); const search = page.getByRole('searchbox', { name: '搜索供应商名称或邀请人', exact: true }); await search.fill('北京'); assert.ok(await page.locator('.m-supplier-card').count()); await shot('workbench-search-found'); await search.fill('完全不存在的供应商ABC'); assert.equal(await page.locator('.m-supplier-card').count(), 0); const empty = page.locator('.m-empty-search'); assert.ok(await empty.isVisible()); assert.equal(await empty.locator('img').count(), 5); for (const img of await empty.locator('img').all()) assert.ok(await img.evaluate(n => n.complete && n.naturalWidth > 0)); await shot('workbench-search-empty'); await button('清空搜索').click(); assert.ok(await page.locator('.m-supplier-card').count());
  });
  await check('工作台组件：普通选择和搜索选择、日期底部确认、输入焦点', async () => {
    await goto('mobile'); await button('筛选供应商').click(); await page.getByRole('combobox', { name: '供应商状态', exact: true }).click(); assert.ok(await page.locator('.m-option-picker.is-simple').isVisible()); assert.equal(await page.getByRole('dialog').getByRole('searchbox').count(), 0); await shot('workbench-option-simple'); await button('已审批').click(); await page.getByRole('combobox', { name: '供应商推荐', exact: true }).click(); const search = page.getByRole('searchbox', { name: '搜索供应商推荐', exact: true }); await search.fill('软件'); assert.ok(await page.locator('.m-option-radio').count()); await shot('workbench-option-search'); await search.fill('不存在的行业ABC'); assert.ok(await page.locator('.m-option-picker .m-empty-search').isVisible()); await button('取消').click(); await field('邀请人').focus(); const outline = await field('邀请人').evaluate(n => getComputedStyle(n.closest('.m-field')).boxShadow); assert.notEqual(outline, 'none'); await shot('workbench-filter-input'); await button('邀请时间（起）').click(); assert.equal(await page.locator('.m-date-columns > span').count(), 3); assert.ok(await page.locator('.m-date-picker .m-picker-actions').getByRole('button', { name: '确认', exact: true }).isVisible()); await shot('workbench-date'); await button('取消').click();
  });
  await check('工作台组件：附件列表到预览及返回、审批圆点连线和直接意见', async () => {
    await goto('mobile/register'); await page.getByLabel('营业执照', { exact: true }).setInputFiles(upload); await button('查看营业执照').click(); assert.ok(await page.locator('.m-attachment-file').isVisible()); assert.ok(await page.locator('.m-file-icon img').evaluate(n => n.complete && n.naturalWidth === 24)); assert.equal(await page.locator('.m-attachment-full').count(), 0); await shot('workbench-attachment-list'); await button('打开附件').click(); assert.ok(await page.locator('.m-attachment-full').isVisible()); await button('返回附件列表').click(); assert.ok(await page.locator('.m-attachment-file').isVisible()); await button('返回').last().click();
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/approval'); const nodes = page.locator('.m-approval > .m-section:first-of-type .m-approval-timeline > li'); assert.equal(await nodes.count(), 4); for (const node of await nodes.all()) { assert.equal(await node.locator(':scope > .m-approval-heading .m-status').count(), 1); assert.equal(await node.locator('.m-approval-node time').count(), 1); assert.equal(await node.locator('.m-approval-node h3').count(), 0); assert.equal(await node.locator('.m-approval-node .m-row').filter({ hasText: '审批意见' }).count(), 1); assert.equal(await node.locator('details').count(), 0); assert.equal(await node.evaluate(n => getComputedStyle(n, '::before').width), '8px'); } assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot('workbench-approval-' + width); } await page.setViewportSize({ width: 390, height: 845 });
  });
  await check('单选统一即时回填，取消保留及清空即关闭', async () => {
    await goto('mobile/register'); const control = page.getByRole('combobox', { name: '企业类型', exact: true }); await control.click(); const picker = page.getByRole('dialog'); assert.equal(await picker.getByRole('button', { name: '确认', exact: true }).count(), 0); const option = picker.locator('.m-sheet-options button').first(); const value = await option.innerText(); await option.click(); assert.equal(await picker.count(), 0); assert.ok((await control.innerText()).includes(value)); await control.click(); await picker.getByRole('button', { name: '取消', exact: true }).click(); assert.ok((await control.innerText()).includes(value)); await control.click(); await picker.getByRole('button', { name: '清空选择', exact: true }).click(); assert.equal(await picker.count(), 0); assert.ok((await control.innerText()).includes('请选择'));
  });
  await check('邀请字段不重叠、运维无常驻工程说明、须知页面确认进入表单', async () => {
    for (const width of [320, 390, 430]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/mine'); for (const row of await page.locator('.m-supplier-card-mine dl > div').all()) { const dt = row.locator('dt'), dd = row.locator('dd'); const label = await dt.evaluate(n => { const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().right; }); const value = await dd.boundingBox(); assert.ok(label <= value.x + 1, await dt.innerText()); assert.ok(await dd.evaluate(n => n.scrollWidth <= n.clientWidth + 1)); } await shot('mine-no-overlap-' + width); }
    await page.setViewportSize({ width: 390, height: 845 }); await goto('mobile/rating-ops'); assert.equal(await page.getByText('当前为演示记录，查询与导出仅处理本页演示数据；批量发起评分暂未接通真实服务。', { exact: true }).count(), 0); assert.ok(await button('批量发起评分').isDisabled()); await goto('mobile/bank-application'); assert.equal(await page.getByRole('dialog', { name: '申请须知', exact: true }).count(), 0); assert.ok(await page.getByRole('heading', { name: '申请须知', exact: true }).isVisible()); await shot('bank-notice-page'); await button('确认申请').click(); assert.ok(await field('银行名称').isVisible());
  });
  await check('查询评分末行、批量删除确认与注册基本信息拆分', async () => {
    await goto('mobile'); for (const record of await page.locator('.m-supplier-card').all()) assert.equal(await record.locator('dl > div:last-child dt').innerText(), '评分'); const before = await page.locator('.m-supplier-card').count(); await button('批量选择').click(); const disabled = page.locator('.m-supplier-card input[type=checkbox]:disabled'); assert.ok(await disabled.count() > 0); await page.getByRole('checkbox', { name: '全选当前结果', exact: true }).check(); const count = await page.locator('.m-supplier-card input:checked').count(); assert.ok(count > 0); await button('删除').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.locator('.m-supplier-card').count(), before); await button('删除').click(); await page.getByRole('dialog').getByRole('button', { name: '确认', exact: true }).click(); assert.equal(await page.locator('.m-supplier-card').count(), before - count); await button('退出批量选择').click(); await shot('query-score-last');
    await goto('mobile/detail'); assert.equal(await page.locator('.m-detail .m-tabs button').count(), 9); assert.equal(await page.locator('.m-detail .m-section .m-label').allTextContents().then(x => x.join('|')), '供应商账号|邀请人|邀请时间|注册方式|曾用名|注册邮箱'); await shot('detail-registration'); await button('基本信息').click(); assert.ok(await page.getByText('统一社会信用代码', { exact: true }).isVisible()); assert.ok(await page.getByText('经营优势及业务优势', { exact: true }).isVisible()); assert.equal(await page.locator('.m-section .m-label').filter({ hasText: '注册邮箱' }).count(), 0); await shot('detail-basic'); for (const [route, active] of [['mobile/detail-bank','银行信息'], ['mobile/detail-approval-empty','审批记录'], ['mobile/detail-ratings','合作信息及评分']]) { await goto(route); assert.equal(await page.locator('.m-detail .m-tabs [aria-current=page]').innerText(), active); }
  });
  await check('审批历史按单号卡片折叠，当前进度保持展开', async () => {
    for (const width of [320, 390]) { await page.setViewportSize({ width, height: 845 }); await goto('mobile/approval-history'); const cards = page.locator('.m-approval-history-card'); assert.equal(await cards.count(), 2); assert.ok((await page.locator('.m-approval > .m-section:first-of-type').innerText()).includes('资料变更')); const first = cards.nth(0), second = cards.nth(1); assert.equal(await first.getAttribute('open'), null); await first.locator('summary').click(); assert.ok(await first.getByText('账户资料与开户证明一致，同意变更。', { exact: true }).isVisible()); await second.locator('summary').click(); assert.notEqual(await first.getAttribute('open'), null); assert.notEqual(await second.getAttribute('open'), null); assert.ok(await second.getByText('注册资料完整，经营范围符合合作需求，同意。', { exact: true }).isVisible()); await shot('approval-history-' + width); await first.locator('summary').focus(); await page.keyboard.press('Enter'); assert.equal(await first.getAttribute('open'), null); assert.notEqual(await second.getAttribute('open'), null); assert.equal(await page.locator('.m-approval > .m-section:first-of-type .m-approval-timeline > li').count(), 4); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); } await page.setViewportSize({ width: 390, height: 845 }); await goto('mobile'); await card('快速创建').getByRole('button', { name: '详情', exact: true }).click(); await button('审批记录').click(); assert.equal(await page.locator('.m-approval-history-card').count(), 0);
  });
  await check('我的邀请底部双批量操作及状态限制', async () => {
    await goto('mobile/mine'); const before = await page.locator('.m-supplier-card').count(); await button('批量选择').click(); assert.equal(await page.locator('.m-batch-mode').count(), 0);
    await page.getByRole('checkbox', { name: '选择代注册草稿', exact: true }).check(); assert.ok(await button('删除').isEnabled()); assert.ok(await button('批量变更邀请人').isDisabled()); await button('删除').click(); await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click(); assert.equal(await page.locator('.m-supplier-card').count(), before);
    await page.getByRole('checkbox', { name: '选择快速创建557348', exact: true }).check(); assert.ok(await button('删除').isDisabled()); assert.ok(await button('批量变更邀请人').isDisabled()); await page.getByRole('checkbox', { name: '选择代注册草稿', exact: true }).uncheck(); await button('批量变更邀请人').click(); await button('新邀请人').click(); await page.getByRole('searchbox', { name: '请输入人员姓名', exact: true }).fill('周辉'); await page.getByRole('radio', { name: /^周辉 / }).click(); await button('确认变更').click(); await page.getByRole('dialog', { name: '提示', exact: true }).getByRole('button', { name: '确认', exact: true }).click(); await button('供应商查询').click(); assert.ok((await card('快速创建').innerText()).includes('周辉')); assert.ok((await card('北京初然').innerText()).includes('陈才慧'));
  });
  await check('门户报价待处理已处理搜索详情及账单草稿', async () => {
    await goto('mobile/workspace-home'); await shot('portal-home-new'); await page.getByText('待处理报价', { exact: true }).click(); await button('查看询价详情').click(); assert.ok(await page.getByText('MOCK-INQ-001', { exact: true }).isVisible()); assert.ok(await page.getByText('平台运维服务', { exact: true }).isVisible()); await shot('portal-quote-new'); await button('返回报价列表').click(); await button('报价管理已处理').click(); await button('查看询价详情').click(); assert.ok(await page.getByText('MOCK-INQ-002', { exact: true }).isVisible()); await button('返回报价列表').click(); await page.getByRole('searchbox').fill('不存在'); assert.ok(await page.getByText('暂无匹配的询价单', { exact: true }).isVisible()); await goto('mobile/workspace-travel'); await field('账期').fill('2026-11'); await button('返回业务任务').click(); await button('继续编辑').click(); assert.equal(await field('账期').inputValue(), '2026-11'); await page.getByLabel('账单文件', { exact: true }).setInputFiles(upload); await button('保存草稿').click(); await button('返回业务任务').click(); await button('首页').click(); await button('差旅账单').click(); assert.equal(await field('账期').inputValue(), '2026-11'); assert.ok((await page.locator('.m-attachment-name').innerText()).includes('测试证明.png'));
  });
  for (const width of [320, 390, 430, 768]) await check('代表页面宽度 ' + width, async () => {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 845 });
    for (const route of ['mobile', 'mobile/bank-form-selected', 'mobile/register-contacts', 'mobile/permissions', 'mobile/my-ratings', 'mobile/rating-ops', 'mobile/bank-application-form', 'mobile/rating-edit', 'mobile/portal', 'mobile/workspace-home', 'mobile/workspace-info', 'mobile/workspace-tasks', 'mobile/workspace-tax-detail', 'mobile/workspace-account', 'mobile/mine-batch']) {
      await goto(route); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + '横向溢出');
      if (width === 390) await shot('layout-' + route.split('/').at(-1));
    }
  });
  await check('电脑与移动入口切换样式隔离', async () => { await goto('login'); await page.locator('body').waitFor(); await goto('mobile'); assert.equal(await page.locator('.mobile-page').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(244, 247, 250)'); });
  const passed = results.filter(x => x.passed).length, failed = results.length - passed;
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ passed, failed, results }, null, 2));
  console.log(JSON.stringify({ passed, failed, failures: results.filter(x => !x.passed) }, null, 2));
  if (failed) process.exitCode = 1;
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }


