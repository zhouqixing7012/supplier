import React, { useState } from 'react';

const suppliers = [
  { name: '北京搜狐新媒体信息技术有限公司', type: '企业供应商', status: '已审批', inviter: '张三' },
  { name: '上海某科技有限公司', type: '企业供应商', status: '审批中', inviter: '李四' },
];

const invites = [
  { name: '北京XX供应商', status: '邀请中', action: '重新邀请' },
  { name: '上海XX供应商', status: '草稿', action: '修改' },
];

export default function MobileSupplier() {
  const [tab, setTab] = useState('supplier');

  return (
    <div className="mobile-app-shell">
      <header className="mobile-header">
        <h1>{tab === 'supplier' ? '供应商查询' : tab === 'invite' ? '我的邀请' : '审批任务'}</h1>
      </header>

      {tab === 'supplier' && (
        <>
          <section className="mobile-search">
            <input placeholder="请输入供应商名称" />
            <button>查询</button>
          </section>
          <section className="mobile-card-list">
            {suppliers.map((item) => (
              <article className="supplier-card" key={item.name}>
                <div className="supplier-title">{item.name}</div>
                <div>类型：{item.type}</div>
                <div>状态：{item.status}</div>
                <div>邀请人：{item.inviter}</div>
                <button>查看详情</button>
              </article>
            ))}
          </section>
        </>
      )}

      {tab === 'invite' && invites.map((item) => (
        <article className="supplier-card" key={item.name}>
          <div className="supplier-title">{item.name}</div>
          <div>状态：{item.status}</div>
          <button>{item.action}</button>
        </article>
      ))}

      {tab === 'approve' && (
        <article className="supplier-card">暂无待审批任务</article>
      )}

      <nav className="mobile-bottom-nav">
        <button onClick={() => setTab('supplier')}>供应商查询</button>
        <button onClick={() => setTab('invite')}>我的邀请</button>
        <button onClick={() => setTab('approve')}>审批任务</button>
      </nav>
    </div>
  );
}
