import React from 'react';

import './app-navigation.css';

const REGISTER_ITEMS = [
  { key: 'company', label: '企业', href: '#/register/company' },
  { key: 'personal', label: '个人', href: '#/register/personal' },
  { key: 'government', label: '政府/社团', href: '#/register/government' },
  { key: 'foreign', label: '国外', href: '#/register/foreign' },
];

function AppNavigation({ activeKey = 'portal' }) {
  return (
    <header className="system-nav-shell">
      <div className="system-nav">
        <a className="system-nav-brand" href="#/login" aria-label="返回搜狐供应商系统协同门户">
          <span className="system-nav-brand-mark">搜狐</span>
          <span className="system-nav-brand-name">供应商系统</span>
        </a>

        <nav className="system-nav-links" aria-label="供应商系统页面导航">
          <a
            className={`system-nav-link ${activeKey === 'portal' ? 'is-active' : ''}`}
            href="#/login"
          >
            协同门户
          </a>
          <span className="system-nav-group-label">代注册</span>
          {REGISTER_ITEMS.map((item) => (
            <a
              key={item.key}
              className={`system-nav-link ${activeKey === item.key ? 'is-active' : ''}`}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export { AppNavigation };
