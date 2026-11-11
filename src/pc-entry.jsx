import React from 'react';
import { createRoot } from 'react-dom/client';

import 'antd-pc/dist/reset.css';
import { PcAdminApp } from './pc-admin.jsx';
import './erp/presentation.css';
import './pc-admin.css';
import './pc/workflows.css';

createRoot(document.getElementById('root')).render(<PcAdminApp />);
