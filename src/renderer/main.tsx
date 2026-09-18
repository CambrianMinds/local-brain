import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global resilience handlers for desktop shell
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
  });
  window.addEventListener('error', (event) => {
    if (event.error) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
