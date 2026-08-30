import { cn } from '../utils/cn';

export interface StepProgressProps {
  current: number;
  total: number;
  className?: string;
}

/**
 * Tells the user how much of a multi-step task is left.
 *
 * A form broken into steps without any sense of length feels endless; the
 * count is what makes it feel finite. Reused by registration now, and by the
 * receiving flow in Increment 5.
 */
export function StepProgress({ current, total, className }: StepProgressProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex flex-1 gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              index < current ? 'bg-primary-600' : 'bg-neutral-200',
            )}
          />
        ))}
      </div>
      <span className="shrink-0 text-caption text-ink-muted tabular">
        Step {current} of {total}
      </span>
    </div>
  );
}
