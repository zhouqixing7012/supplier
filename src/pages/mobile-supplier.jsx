import React, { useState } from 'react';

const supplierList = [
  {
    name: '北京搜狐新媒体信息技术有限公司',
    type: '企业供应商',
    status: '已审批',
    inviter: '张三',
    time: '2026-10-14',
  },
  {
    name: '上海某科技有限公司',
    type: '企业供应商',
    status: '审批中',
    inviter: '李四',
    time: '2026-10-13',
  },
];

const inviteList = [
  { name: '深圳某供应链有限公司', status: '邀请中', action: '重新邀请' },
  { name: '北京某软件有限公司', status: '草稿', action: '修改' },
];

export default function MobileSupplier() {
  const [tab, setTab] = useState('supplier');

  return (
    <div className="mobile-app-shell">
      <header className="mobile-header">
        <h1>供应商系统</h1>
      </header>

      {tab === 'supplier' && (
        <>
          <section className="mobile-search">
            <input placeholder="请输入供应商名称" />
            <button>查询</button>
          </section>

          <section className="mobile-card-list">
            {supplierList.map((item) => (
              <article className="supplier-card" key={item.name}>
                <h3>{item.name}</h3>
                <p>类型：{item.type}</p>
                <p>状态：{item.status}</p>
                <p>邀请人：{item.inviter}</p>
                <p>邀请时间：{item.time}</p>
                <button>查看详情</button>
              </article>
            ))}
          </section>
        </>
      )}

      {tab === 'invite' && (
        <section className="mobile-card-list">
          {inviteList.map((item) => (
            <article className="supplier-card" key={item.name}>
              <h3>{item.name}</h3>
              <p>状态：{item.status}</p>
              <button>{item.action}</button>
            </article>
          ))}
        </section>
      )}

      {tab === 'approval' && (
        <section className="supplier-card">
          <h3>审批任务</h3>
          <p>供应商注册审批</p>
          <p>当前状态：待审批</p>
          <button>进入审批</button>
        </section>
      )}

      <nav className="mobile-bottom-nav">
        <button onClick={() => setTab('supplier')}>供应商查询</button>
        <button onClick={() => setTab('invite')}>我的邀请</button>
        <button onClick={() => setTab('approval')}>审批任务</button>
      </nav>
    </div>
  );
}
