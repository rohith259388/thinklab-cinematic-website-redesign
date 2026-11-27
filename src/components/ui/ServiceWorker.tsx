'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js in production so repeat visits load pages and assets from
 * the visitor's device. In development any previously registered worker is
 * removed, so local edits are never hidden behind a cache.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      return;
    }
    const register = () =>
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => navigator.serviceWorker.ready)
        // Ask the worker to keep the page the visitor landed on (loaded before it took control).
        .then((reg) => reg.active?.postMessage({ type: 'tl-cache-pages', urls: [location.pathname] }))
        .catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
