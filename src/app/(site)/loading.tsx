import { PageLoader } from '@/components/ui/Loader';

/** Shown instantly during client navigation while the next route's server data streams in. */
export default function Loading() {
  return <PageLoader />;
}
