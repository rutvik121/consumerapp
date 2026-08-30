import { cn } from '../utils/cn';

/** Hairline separator. Prefer this over wrapping content in bordered boxes. */
export function Divider({ className, inset = false }: { className?: string; inset?: boolean }) {
  return <div role="separator" className={cn('h-px bg-line', inset && 'ml-4', className)} />;
}
