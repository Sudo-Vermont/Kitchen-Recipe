import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { installDemoApi } from '@/demo/api';

import './index.css';

// The static GitHub Pages build has no API server, so answer recipe requests
// from bundled sample data. VITE_DEMO is inlined at build time, so normal
// builds drop this branch and tree-shake the demo module out.
if (import.meta.env.VITE_DEMO === 'true') {
  installDemoApi();
}

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
