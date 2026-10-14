import React from 'react';

const suppliers = [
  { name: '北京搜狐新媒体信息技术有限公司', type: '企业供应商', status: '已审批', inviter: '张三' },
  { name: '上海某科技有限公司', type: '企业供应商', status: '审批中', inviter: '李四' },
];

export default function MobileSupplier() {
  return (
    <div className="mobile-app-shell">
      <header className="mobile-header">
        <h1>供应商管理</h1>
      </header>

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

      <nav className="mobile-bottom-nav">
        <span>供应商查询</span>
        <span>我的邀请</span>
        <span>审批任务</span>
      </nav>
    </div>
  );
}
