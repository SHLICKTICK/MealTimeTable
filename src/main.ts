import './index.css';
import { App } from './app/App';

// Initialize the vanilla TypeScript application
const mountPoint = document.getElementById('app') || document.getElementById('root');

if (mountPoint) {
  new App(mountPoint);
} else {
  console.error('Target root element not found for MealWeek mounting.');
}

// Register service worker for PWA offline capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('MealWeek Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped or failed:', err);
      });
  });
}
