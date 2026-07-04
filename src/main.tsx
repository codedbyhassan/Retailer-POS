import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';
import './index.css';

console.log('[v0] main.tsx loaded');
const root = document.getElementById('root');
console.log('[v0] root element:', root);

if (root) {
  createRoot(root).render(
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>,
  );
} else {
  console.error('[v0] Root element not found!');
}

