import { PageSkeleton } from '@/components/ui/Skeleton';

/** Shown instantly during client navigation while the next route's server data streams in. */
export default function Loading() {
  return <PageSkeleton />;
}
