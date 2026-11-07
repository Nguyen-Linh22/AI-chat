import React from 'react';
import ReactDOM from 'react-dom/client';
import { ZyriconPreview } from './theme/zyricon/preview/ZyriconPreview';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ZyriconPreview />
    </React.StrictMode>
  );
}

