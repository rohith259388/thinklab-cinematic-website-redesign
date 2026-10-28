'use client';

import { useEffect } from 'react';
import { motion, PAGE_SCENES, type PageKey } from '@/lib/motion';

/**
 * Each page assigns the organism its next identity.
 * The scene eases toward it — navigation becomes transformation.
 */
export default function StageSetter({ page }: { page: PageKey }) {
  useEffect(() => {
    motion.page = page;
    if (page !== 'home') {
      motion.target = { ...PAGE_SCENES[page] };
    }
  }, [page]);

  return null;
}
