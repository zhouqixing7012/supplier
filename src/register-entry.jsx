import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import 'antd/dist/reset.css';
import { SupplierRegisterPage } from '@/pages/supplier-register';
import './styles.css';

const registerTypes = ['company', 'personal', 'government', 'foreign'];

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

  return <SupplierRegisterPage type={type} onTypeChange={goType} />;
}

createRoot(document.getElementById('root')).render(<RegisterApp />);
