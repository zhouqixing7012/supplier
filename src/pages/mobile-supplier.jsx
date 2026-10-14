import React, { useState } from 'react';
import './mobile-supplier.css';

const supplierInfo = {
  name: '北京初然文化传媒有限公司',
  type: '企业供应商',
};

export default function MobileSupplier() {
  const [tab, setTab] = useState('info');

  return (
    <div className="mobile-page">
      <header className="mobile-title">
        <button>‹</button>
        <h1>供应商管理平台</h1>
      </header>

      {tab === 'info' && (
        <>
          <section className="section">
            <h2>供应商信息</h2>
            <p><span>*</span>供应商名称　{supplierInfo.name}</p>
            <p><span>*</span>供应商类型　{supplierInfo.type}</p>
          </section>

          <section className="section">
            <h2>银行信息</h2>
            <div className="bank-card">
              <h3>112297879</h3>
              <p>账户类型　基本账户</p>
              <p>开户银行　中国农业发展银行</p>
              <p>银行分行　中国农业发展银行北京市分行</p>
              <p>开户所在省　北京市</p>
              <p>开户所在市　北京市</p>
              <p>账户名称　牛利来拉</p>
              <p>银行账号　6214589503254174</p>
              <p>币种　人民币</p>
              <p>开户证明　📎</p>
              <p>备注</p>
              <p>状态</p>
            </div>
          </section>

          <footer className="actions">
            <button>取消</button>
            <button>提交</button>
          </footer>
        </>
      )}

      <nav className="mobile-tabs">
        <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>供应商信息</button>
      </nav>
    </div>
  );
}
