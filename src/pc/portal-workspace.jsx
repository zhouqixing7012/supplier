import React, { useEffect, useRef, useState } from 'react';
import { Alert, App, Avatar, Breadcrumb, Button, Card, Form, Input, Menu, Space, Tabs, Typography } from 'antd-pc';
import { Building2, Calculator, ChevronRight, ClipboardList, Plane, UserRound } from 'lucide-react';
import { EmptyContent, StatusTag } from '../erp/components.jsx';
import { createPortalInquiries, createPortalOrders } from '../pages/mobile-portal-records.js';
import { filledBasic } from '../pages/mobile-forms.jsx';
import { exampleBank } from '../pages/mobile-data.js';
import { PortalPricing, PortalTasks } from './portal-pricing.jsx';
import { SupplierProfileEditor, SupplierSnapshot } from './record-editor.jsx';

const sections = [
  { key: 'profile', label: '供应商信息管理', icon: <Building2 size={16} /> },
  { key: 'quotes', label: '采购报价管理', icon: <ClipboardList size={16} /> },
  { key: 'tax', label: '采购价税拆分', icon: <Calculator size={16} /> },
  { key: 'travel', label: '差旅账单录入', icon: <Plane size={16} /> },
  { key: 'account', label: '账户设置', icon: <UserRound size={16} />, children: [
    { key: 'password', label: '修改密码' }, { key: 'register-email', label: '修改注册邮箱' },
  ] },
];
const sectionLabels = Object.fromEntries(sections.flatMap(({ key, label, children }) => [[key, label], ...(children || []).map((item) => [item.key, item.label])]));
const travelTypes = [['train', '火车账单'], ['hotel', '酒店账单'], ['flight', '飞机账单'], ['rental', '租车账单']];
const initialProfile = () => ({
  type: filledBasic.type,
  basic: { ...filledBasic, supplierName: '协同门户演示供应商', address: '北京市 / 北京市 / 朝阳区 演示地址', businessScope: '技术与电子产品服务', cooperation: '演示项目合作', businessAdvantage: '演示技术支持' },
  contacts: [{ id: 'portal-contact', name: '演示联系人', phone: '13800000000', email: 'supplier@example.com' }],
  banks: [{ ...exampleBank, name: '协同门户演示供应商' }],
});

function TravelEntry({ type, label }) {
  const input = useRef(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const upload = async (event) => {
    const files = Array.from(event.currentTarget.files);
    event.currentTarget.value = '';
    if (!files.length) return;
    const send = window.__PORTAL_TRAVEL_UPLOAD__;
    if (typeof send !== 'function') return setResult({ type: 'info', text: '已选择 ' + files.length + ' 个附件。差旅上传服务尚未接入。' });
    setLoading(true);
    setResult(null);
    let timeout;
    try {
      const response = await Promise.race([
        send({ type, files, timeoutMs: 180000 }),
        new Promise((_, reject) => { timeout = window.setTimeout(() => reject(new Error('上传超时，请核对差旅系统处理结果')), 180000); }),
      ]);
      if (response === false || response?.success === false || response == null) throw new Error(response?.message || '差旅系统未确认上传成功');
      setResult({ type: 'success', text: '上传成功，共 ' + files.length + ' 个附件' });
    } catch (error) {
      setResult({ type: 'error', text: error?.message || '上传失败，请重试' });
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };
  return <Card size="small" title={label}>
    <Space orientation="vertical" size={8}>
      <input ref={input} hidden type="file" multiple aria-label={label + '附件'} onChange={upload} />
      <Button loading={loading} onClick={() => input.current?.click()}>上传附件</Button>
      {result && <Alert type={result.type} title={result.text} showIcon />}
    </Space>
  </Card>;
}

function TravelPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const download = async () => {
    if (typeof window.__PORTAL_TRAVEL_TEMPLATE__ !== 'function') return message.warning('模板暂不可用，请联系管理员');
    setLoading(true);
    try {
      const file = await window.__PORTAL_TRAVEL_TEMPLATE__();
      if (!(file?.blob instanceof Blob) || !file.blob.size || !file.name) throw new Error('模板文件获取失败');
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      message.error(error?.message || '模板下载失败');
    } finally {
      setLoading(false);
    }
  };
  return <div className="pc-page-stack">
    <Card size="small" title="模板下载"><Button loading={loading} onClick={download}>下载模板</Button></Card>
    <div className="pc-workflow-grid">{travelTypes.map(([type, label]) => <TravelEntry key={type} type={type} label={label} />)}</div>
  </div>;
}

function SecurityPage({ email, initialEmail, onEmailChange }) {
  const { message } = App.useApp();
  const [sentTo, setSentTo] = useState('');
  const [form] = Form.useForm();
  return <Card size="small" title={email ? '修改注册邮箱' : '修改密码'} className="pc-auth-card">
    <Form form={form} layout="vertical" onFinish={(values) => {
      const target = email ? values.email : initialEmail;
      if (target !== sentTo || values.code !== '1234') return message.error('请先获取演示验证码，并输入 1234');
      if (email) onEmailChange(target);
      message.success(email ? '演示注册邮箱已更新' : '演示密码校验通过');
      form.resetFields();
      setSentTo('');
    }}>
      <Form.Item name="email" label={email ? '新注册邮箱' : '注册邮箱'} initialValue={email ? undefined : initialEmail} rules={[{ required: true, type: 'email' }]}><Input readOnly={!email} /></Form.Item>
      <Form.Item label="邮箱验证码" required>
        <Space.Compact block><Form.Item noStyle name="code" rules={[{ required: true }]}><Input /></Form.Item>
          <Button onClick={async () => {
            try {
              const { email: target } = await form.validateFields(['email']);
              setSentTo(target);
              message.info('原型演示验证码为 1234');
            } catch { /* 字段错误由表单展示。 */ }
          }}>获取验证码</Button></Space.Compact>
      </Form.Item>
      {!email && <>
        <Form.Item label="新密码" name="password" rules={[{ required: true }]}><Input.Password /></Form.Item>
        <Form.Item label="确认密码" name="confirm" dependencies={['password']} rules={[{ required: true }, ({ getFieldValue }) => ({
          validator: (_, value) => !value || value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')),
        })]}><Input.Password /></Form.Item>
      </>}
      <Button htmlType="submit" type="primary">保存</Button>
    </Form>
  </Card>;
}

export function PortalWorkspace({ screen, recordNumber, go, account, onLogout }) {
  const [profile, setProfile] = useState(initialProfile);
  const [pending, setPending] = useState(null);
  const [profileTab, setProfileTab] = useState('basic');
  const [inquiries, setInquiries] = useState(createPortalInquiries);
  const [orders, setOrders] = useState(createPortalOrders);
  const [views, setViews] = useState({});
  const scroll = useRef(null);
  const profileLeave = useRef(null);
  const pricingLeave = useRef(null);
  const { modal } = App.useApp();
  const editingProfile = screen === 'profile-edit';
  const reviewingProfile = screen === 'profile-approval';
  const section = editingProfile || reviewingProfile ? 'profile' : screen;
  const quote = section === 'quotes';
  const tasks = quote || section === 'tax';
  const records = quote ? inquiries : orders;
  const setRecords = quote ? setInquiries : setOrders;
  const selected = records.find((item) => item.number === recordNumber);
  const workspacePath = (key) => 'portal/' + key;
  const leavePage = (action) => {
    const guard = editingProfile ? profileLeave.current : pricingLeave.current;
    if (guard) guard.leave(action);
    else action();
  };
  const switchSection = (key) => leavePage(() => go(workspacePath(key)));

  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [screen, recordNumber]);

  return <div className="pc-app">
    <div className="pc-workspace">
      <aside className="pc-sidebar">
        <a className="pc-sidebar-brand" href="#/portal/profile" onClick={(event) => { event.preventDefault(); switchSection('profile'); }}>
          <img className="pc-sidebar-logo" src={import.meta.env.BASE_URL + 'sohu-logo.png'} alt="搜狐" />
          <span className="pc-sidebar-brand-label">供应商协同门户</span>
        </a>
        <nav className="pc-sidebar-nav" aria-label="协同门户导航"><Menu mode="inline" items={sections} selectedKeys={[section]} defaultOpenKeys={['account']} onClick={({ key }) => switchSection(key)} /></nav>
      </aside>
      <main className="pc-main">
        <header className="pc-topbar">
          <div className="pc-topbar-context"><Breadcrumb separator={<ChevronRight size={14} />} items={[
            { title: '协同门户' },
            { title: recordNumber ? <Button type="link" size="small" onClick={() => switchSection(section)}>{sectionLabels[section]}</Button> : sectionLabels[section] },
            ...(recordNumber ? [{ title: recordNumber }] : editingProfile || reviewingProfile ? [{ title: editingProfile ? '修改资料' : '审批记录' }] : []),
          ]} /></div>
          <div className="pc-topbar-actions"><Avatar size={28} className="pc-avatar">{account?.slice(0, 1) || '供'}</Avatar><Button type="text" onClick={() => leavePage(() => modal.confirm({
            centered: true, className: 'pc-confirm', title: '确认退出协同门户？', okText: '退出登录', cancelText: '取消', onOk: onLogout,
          }))}>退出登录</Button></div>
        </header>
        <div className="pc-main-scroll" ref={scroll}><div className="pc-main-content pc-register">
          {section === 'profile' && !editingProfile && !reviewingProfile && <div className="pc-page-stack">
            <Card size="small" title={profile.basic.supplierName} extra={<StatusTag value={pending ? '变更中' : '已审批'} />}>
              <Space><Typography.Text type="secondary">注册邮箱</Typography.Text><Typography.Text>{profile.basic.registerEmail}</Typography.Text></Space>
            </Card>
            <Card size="small" className="pc-detail-tabs-card">
              <Tabs activeKey={profileTab} onChange={setProfileTab} className="pc-detail-tabs" items={[
                { key: 'basic', label: '基本信息' }, { key: 'contacts', label: '联系人信息' }, { key: 'banks', label: '银行信息' },
              ]} tabBarExtraContent={pending
                ? <Button onClick={() => go('portal/profile-approval')}>查看审批</Button>
                : <Button type="primary" onClick={() => go('portal/profile-edit')}>修改</Button>} />
              <SupplierSnapshot profile={profile} section={profileTab} />
            </Card>
          </div>}
          {editingProfile && (pending ? <EmptyContent description="资料变更正在审批" /> : <SupplierProfileEditor profile={profile} leaveRef={profileLeave}
            initialStep={{ basic: 0, contacts: 1, banks: 2 }[profileTab]} onCancel={() => go('portal/profile')}
            onSubmit={(draft) => { setPending(draft); go('portal/profile-approval'); }} />)}
          {reviewingProfile && <div className="pc-page-stack">
            <Card size="small" title="资料变更审批" extra={pending && <StatusTag value="审批中" />}>
              {pending ? <Typography.Text>原型演示 · 待审批资料</Typography.Text> : <EmptyContent description="暂无审批记录" />}
            </Card>
            {pending && <SupplierSnapshot profile={pending} />}
            <div className="pc-workflow-actions"><Button onClick={() => go('portal/profile')}>返回</Button></div>
          </div>}
          {tasks && (recordNumber ? <PortalPricing leaveRef={pricingLeave} key={screen + recordNumber} quote={quote} record={selected} onBack={() => go(workspacePath(section))}
            onSubmit={(draft) => {
              setRecords((current) => current.map((item) => item.number === draft.number ? draft : item));
              setViews({ ...views, [section]: { ...views[section], status: '已处理' } });
              go(workspacePath(section));
            }} /> : <PortalTasks key={section} quote={quote} records={records} view={views[section] || {}}
            setView={(view) => setViews({ ...views, [section]: view })} onOpen={(number) => go(workspacePath(section) + '/' + encodeURIComponent(number))} />)}
          {section === 'travel' && <TravelPage />}
          {['password', 'register-email'].includes(section) && <SecurityPage key={section} email={section === 'register-email'} initialEmail={profile.basic.registerEmail}
            onEmailChange={(email) => {
              const sync = (record) => record && { ...record, basic: { ...record.basic, registerEmail: email } };
              setProfile(sync);
              setPending(sync);
            }} />}
        </div></div>
      </main>
    </div>
  </div>;
}
