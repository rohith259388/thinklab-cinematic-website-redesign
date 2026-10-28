'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from '@/lib/motion';

const ExperienceCanvas = dynamic(() => import('./ExperienceCanvas'), {
  ssr: false,
});

/**
 * Mounts the persistent organism once, high in the tree, so that
 * client-side navigation transforms the scene instead of restarting it.
 */
export default function ExperienceShell() {
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      motion.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      motion.pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      motion.scroll = window.scrollY / max;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <ExperienceCanvas />;
}
