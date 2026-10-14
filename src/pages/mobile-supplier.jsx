import React, { useState } from 'react';
import './mobile-supplier.css';

const supplierList = [
  { name: '北京搜狐新媒体信息技术有限公司', type: '企业供应商', status: '已审批', inviter: '张三', time: '2026-10-14' },
  { name: '上海某科技有限公司', type: '企业供应商', status: '审批中', inviter: '李四', time: '2026-10-13' },
];

const inviteList = [
  { name: '深圳某供应链有限公司', status: '邀请中', action: '重新邀请' },
  { name: '北京某软件有限公司', status: '草稿', action: '修改' },
];

function Card({ children }) {
  return <article className="mobile-card">{children}</article>;
}

export default function MobileSupplier() {
  const [tab, setTab] = useState('supplier');

  return (
    <div className="mobile-app-shell">
      <header className="mobile-header">
        <h1>供应商系统</h1>
        <span>移动端</span>
      </header>

      {tab === 'supplier' && (
        <>
          <div className="mobile-search">
            <input placeholder="请输入供应商名称或申请人" />
            <button>查询</button>
          </div>
          {supplierList.map((item) => (
            <Card key={item.name}>
              <h3>{item.name}</h3>
              <div>类型：{item.type}</div>
              <div>状态：<b>{item.status}</b></div>
              <div>邀请人：{item.inviter}</div>
              <div>邀请时间：{item.time}</div>
              <button className="primary">查看详情</button>
            </Card>
          ))}
        </>
      )}

      {tab === 'invite' && inviteList.map((item) => (
        <Card key={item.name}>
          <h3>{item.name}</h3>
          <div>状态：{item.status}</div>
          <button className="primary">{item.action}</button>
        </Card>
      ))}

      {tab === 'approval' && (
        <Card>
          <h3>审批任务</h3>
          <div>供应商注册审批</div>
          <div>当前状态：待审批</div>
          <button className="primary">进入审批</button>
        </Card>
      )}

      <nav className="mobile-bottom-nav">
        <button onClick={() => setTab('supplier')}>供应商查询</button>
        <button onClick={() => setTab('invite')}>我的邀请</button>
        <button onClick={() => setTab('approval')}>审批任务</button>
      </nav>
    </div>
  );
}
