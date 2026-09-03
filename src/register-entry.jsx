import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { SupplierRegisterPage } from '@/pages/supplier-register';
import './styles.css';
import './register-nav.css';

const registerTypes = ['company', 'personal', 'government', 'foreign'];

const registerTypeOptions = [
  ['company', '企业供应商'],
  ['personal', '个人供应商'],
  ['government', '政府机构或社团'],
  ['foreign', '国外供应商'],
];

function readType() {
  const value = window.location.hash.replace('#/register/', '').trim();
  return registerTypes.includes(value) ? value : 'company';
}

function RegisterApp() {
  const [type, setType] = useState(readType);

  useEffect(() => {
    const onHashChange = () => setType(readType());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goType = (nextType) => {
    window.location.hash = `/register/${nextType}`;
  };

  return (
    <div className="register-app-shell">
      <Toaster />

      <nav className="register-type-nav" aria-label="供应商类型切换">
        <div className="register-type-nav-inner">
          <span className="register-nav-title">代注册</span>
          <div className="register-type-tabs">
            {registerTypeOptions.map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                className={`register-type-tab ${type === value ? 'is-active' : ''}`}
                onClick={() => goType(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      <SupplierRegisterPage type={type} onTypeChange={goType} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<RegisterApp />);
