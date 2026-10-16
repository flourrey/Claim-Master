import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Intercept cross-origin third-party script errors (e.g. Disqus tracker blocks, ad-blockers)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const msg = event?.message || '';
      const file = event?.filename || '';
      if (
        msg === 'Script error.' ||
        msg.includes('Script error') ||
        file.includes('disqus') ||
        file.includes('doubleclick')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        return true;
      }
    },
    true
  );

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = String(event?.reason?.message || event?.reason || '');
    if (reasonMsg.includes('Script error') || reasonMsg.includes('disqus')) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
