import { cn } from '@/lib/utils';

/** Pulsing placeholder block — sized by the caller via className, used in place of abrupt "Chargement…" text swaps. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-angaly-warm-ivory', className)} />;
}
