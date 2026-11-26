import { useEffect, useLayoutEffect } from 'react';

/**
 * Runs before paint on the client (so GSAP "from" states are applied before the
 * first frame — no flash of un-animated content) and falls back to useEffect on the server.
 */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
