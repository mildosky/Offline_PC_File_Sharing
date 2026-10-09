import React from 'react';
import ReactDOM from 'react-dom/client';
import { MobileConnect } from './components/MobileConnect';
import './index.css';

// Mobile-specific entry point
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MobileConnect />
  </React.StrictMode>
);
