const node = (label, route, children = [], reuse = '') => ({ label, route: route.includes('?') ? route : route + '?map=1', children, reuse });
const link = (label, route, reuse = '') => node(label, route, [], reuse);
const target = (scene, params = {}) => scene + '?' + new URLSearchParams({ map: '1', ...params });

const registration = (scene, params = {}, reuse = '') => {
  const step = (number, panel) => target(scene, { ...params, step: number, ...(panel ? { panel } : {}) });
  return [
    node('基本信息', step(0), [
      link('编辑注册地址', step(0, 'address'), reuse),
      link('资质新增／编辑', step(0, 'qualification'), reuse),
    ], reuse),
    node('联系人信息', step(1), [link('联系人新增／编辑', step(1, 'contact'), reuse)], reuse),
    node('银行信息', step(2), [link('银行账户新增／编辑', step(2, 'bank'), reuse)], reuse),
    link('预览提交', step(3), reuse),
  ];
};

const detail = (from, reuse = '') => node('供应商详情', target('detail', { from }),
  ['注册信息', '基本信息', '联系人信息', '银行信息', '分配权限', '财务OU', '黑名单操作记录', '审批记录', '合作信息及评分']
    .map((label, tab) => link(label, target('detail', { from, tab }), '供应商详情页签')), reuse);

const supplierActions = from => {
  const page = (scene, params = {}) => target(scene, { from, ...params });
  const form = '代注册分步表单';
  return [
    link('供应商筛选', page('filter'), from === 'mine' ? '供应商查询筛选' : ''),
    detail(from, from === 'mine' ? '供应商查询详情' : ''),
    ...(from === 'query' ? [
      link('新增供应商 · 邀请注册', 'invite'),
      node('新增供应商 · 代注册', 'register', registration('register')),
    ] : []),
    ...(from === 'mine' ? [
      link('更多 · 重新邀请', page('invite-again'), '邀请注册表单'),
      node('修改草稿', page('register-edit'), registration('register-edit', { from }, form), form),
      node('修改全部信息', page('register-edit-all'), registration('register-edit-all', { from }, form), form),
    ] : []),
    node(from === 'mine' ? '更多 · 修改银行' : '修改银行', page('bank'), [
      link('银行账户新增／编辑', page('bank', { panel: 'bank' }), '银行账户表单'),
    ]),
    node('更多 · 分配权限', page('permissions'), [link('权限新增／编辑', page('permission-form'))]),
    node('更多 · 单条变更邀请人', page('inviter'), [link('新邀请人选择', page('inviter', { panel: 'people' }))]),
    link('更多 · 查看审批进度', page('detail', { tab: 7 }), '供应商详情页签'),
    ...(from === 'query' ? [link('填写评分', page('rating-edit'), '评分编辑页')] : []),
  ];
};

const accountEmail = (reuse = '') => node('修改注册邮箱', 'workspace-account-email', [
  link('原邮箱验证', 'workspace-account-email', '修改注册邮箱表单'),
  link('新邮箱验证', target('workspace-account-email', { step: 1 }), '修改注册邮箱表单'),
], reuse);

const pricing = (quote, handled) => {
  const label = quote ? '报价' : '价税拆分';
  const status = handled ? '已处理' : '待处理';
  const tab = (quote ? 0 : 2) + Number(handled);
  const task = params => target('workspace-tasks', { tab, ...params });
  const page = quote ? 'workspace-quote-detail' : 'workspace-tax-detail';
  const record = params => target(page, { tab, ...params });
  return node(label + '列表 · ' + status, task(), [
    link(label + '筛选', task({ panel: 'filter' }), !quote || handled ? '业务筛选表单' : ''),
    node(label + (handled ? '详情' : '详情／办理'), record(), handled ? [] : [
      link(label + '明细行编辑', record({ panel: 'line' }), quote ? '' : '报价明细行编辑结构'),
    ], handled ? '详情只读模式' : quote ? '' : '报价详情结构'),
  ], handled || !quote ? '采购业务列表' : '');
};

export const pageMap = [
  node('供应商管理平台', 'query', [
    node('供应商查询', target('query', { role: 'employee' }), supplierActions('query')),
    link('管理员 · 批量删除演示', target('query-batch', { role: 'admin' })),
    node('历史补账号演示（范围外）', target('detail', { record: 'mock-historical', historyDemo: 1 }), [
      link('先变更邀请人', target('inviter', { record: 'mock-historical', historyDemo: 1 })),
    ]),
    node('我的邀请', 'mine', [
      ...supplierActions('mine'),
      node('批量变更邀请人', target('inviter-batch'), [
        link('新邀请人选择', target('inviter-batch', { panel: 'people' }), '单条变更的人员选择'),
      ], '单条变更邀请人表单'),
    ]),
    node('注册审批及结果邮件演示', 'registration-approval-demo', [
      link('个人供应商', target('registration-approval-demo', { record: 'mock-person-id-card' })),
      link('企业供应商', target('registration-approval-demo', { record: 'mock-enterprise-technology' })),
      link('政府机构或社团', target('registration-approval-demo', { record: 'mock-institution-center' })),
      link('国外供应商', target('registration-approval-demo', { record: 'mock-foreign-studio' })),
    ]),
    node('我的评分', 'my-ratings', [
      link('评分筛选', target('rating-filter', { from: 'my-ratings' }), '筛选表单结构'),
      link('填写评分', target('rating-edit', { from: 'my-ratings' })),
      link('修改评分', target('rating-edit', { from: 'my-ratings', record: 'sample' }), '评分编辑页'),
      link('评分详情', target('rating-detail', { from: 'my-ratings', record: 'sample' }), '评分编辑页只读模式'),
    ]),
  ]),
  node('供应商协同门户', 'portal', [
    node('用户登录', 'portal', [
      link('注册邮箱验证', 'portal-email', '登录页外壳'),
      link('登录前修改密码', target('portal', { panel: 'password' }), '登录页外壳'),
      link('采购邮件入口演示', target('workspace-procurement', { task: 'quote', record: 'MOCK-INQ-001' })),
    ]),
    node('协同门户工作台', 'workspace-home', [
      node('信息管理', 'workspace-info', [
        node('供应商信息管理', 'workspace-info', [
          ...['基本信息', '联系人信息', '银行信息'].map((label, tab) => link(label, target('workspace-info', { tab }), '供应商信息页签')),
          node('供应商信息修改', target('workspace-info', { edit: 1, step: 0 }),
            registration('workspace-info', { edit: 1 }, '管理平台代注册'), '管理平台代注册'),
          link('资料变更审批', target('workspace-approval'), '审批记录组件'),
        ]),
        accountEmail(),
        link('修改密码', 'workspace-account-password', '账户安全表单'),
      ]),
      node('采购报价管理', target('workspace-tasks', { tab: 0 }), [pricing(true, false), pricing(true, true)]),
      node('采购价税拆分', target('workspace-tasks', { tab: 2 }), [pricing(false, false), pricing(false, true)]),
      node('差旅服务', 'workspace-travel', [
        link('差旅账单录入', 'workspace-travel'),
      ]),
      node('账户设置', 'workspace-account', [
        accountEmail('信息管理的修改注册邮箱'),
        link('修改密码', 'workspace-account-password', '信息管理的修改密码'),
        link('退出登录确认', target('workspace-home', { panel: 'logout' })),
      ]),
    ]),
    node('新供应商账号注册（邀请链接）', target('register-supplier'), [
      ...registration('register-supplier', {}, '管理平台代注册'),
      link('注册结果', target('supplier-registration-result')),
    ]),
  ]),
];

export const previewSize = { width: 390, height: 844, columns: 4, rows: 4 };

export function mapRoutes(nodes = pageMap) {
  return [...new Set(nodes.flatMap(item => [item.route, ...mapRoutes(item.children)]))];
}

function actionLabel(parent, child) {
  const [scene, query] = child.route.split('?');
  const [previousScene] = parent.route.split('?');
  const params = new URLSearchParams(query);
  if (parent.route === child.route) return '同一页面的入口';
  if (child.label.startsWith('更多 · ')) return '更多操作 → ' + child.label.split(' · ')[1];
  if (child.label.startsWith('新增供应商 · ')) return '新增供应商 → ' + child.label.split(' · ')[1];
  if (params.has('panel')) return '打开' + child.label.replace('新增／编辑', '编辑');
  if (params.has('tab') && scene === previousScene) return '切换至' + child.label;
  if (params.has('step')) return child.label === '预览提交' ? '填写完成后预览' : '进入' + child.label + '步骤';
  return '进入' + child.label;
}

export function exportGroups() {
  const groups = [];

  function walk(root, trail) {
    const pending = root.children.map(child => ({ child, trail: [...trail, child.label] }));
    while (pending.length) {
      const entries = [{ child: root, trail, action: '起始页面' }];
      for (let position = 0; position < entries.length && entries.length < 4; position += 1) {
        const source = entries[position];
        const queue = position === 0 ? pending : source.pending;
        while (queue.length && entries.length < 4) {
          const target = queue.shift();
          entries.push({
            ...target, from: position,
            action: actionLabel(source.child, target.child),
            pending: target.child.children.map(child => ({ child, trail: [...target.trail, child.label] })),
          });
        }
      }
      groups.push({ entries, trail });
      for (const entry of entries.slice(1)) {
        if (entry.pending.length) walk({ ...entry.child, children: entry.pending.map(item => item.child) }, entry.trail);
      }
    }
  }

  for (const root of pageMap) walk(root, [root.label]);
  return groups;
}
