import { LoadingVisual } from '@/components/loading/loading-visual';

/**
 * Route-level loading UI shown by Next.js during navigation.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9998]">
      <LoadingVisual />
    </div>
  );
}