import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  endAdornment?: ReactNode;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onClear, endAdornment, placeholder = 'Search', className, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-surface-sunken px-3',
        'h-[var(--control-h-md)] transition-colors',
        'focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary-100',
        className,
      )}
    >
      <Search size={17} className="shrink-0 text-ink-muted" aria-hidden />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-body text-ink outline-none',
          'placeholder:text-ink-muted',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
        {...rest}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-neutral-200"
        >
          <X size={15} aria-hidden />
        </button>
      )}
      {endAdornment}
    </div>
  );
});
