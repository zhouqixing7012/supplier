import React from 'react';
import { createRoot } from 'react-dom/client';

import 'antd/dist/reset.css';
import { PcAdminApp } from './pc-admin.jsx';
import './pc-admin.css';

createRoot(document.getElementById('root')).render(<PcAdminApp />);
