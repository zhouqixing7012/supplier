import React from 'react';
import { createRoot } from 'react-dom/client';
import MobileComponentCatalog from './components/mobile/catalog.jsx';
import { InteractionProvider } from './pages/mobile-interaction.jsx';

createRoot(document.getElementById('root')).render(
  <InteractionProvider>
    <MobileComponentCatalog />
  </InteractionProvider>,
);
