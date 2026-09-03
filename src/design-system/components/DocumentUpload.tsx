import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Check, UploadCloud, X, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

export interface UploadedFile {
  name: string;
  size?: number;
  url?: string;
}

export interface DocumentUploadProps {
  label: string;
  description?: string;
  accept?: string;
  file?: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  onRemove: () => void;
  error?: string;
  required?: boolean;
  sampleFileName?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * KYC document upload component supporting native file selection,
 * drag-and-drop, preview badge, and quick sample attachment for prototype testing.
 */
export function DocumentUpload({
  label,
  description,
  accept = '.pdf,.png,.jpg,.jpeg',
  file,
  onFileSelect,
  onRemove,
  error,
  required = false,
  sampleFileName = 'document_sample.pdf',
  className,
  disabled = false,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) {
      onFileSelect({
        name: selected.name,
        size: selected.size,
        url: URL.createObjectURL(selected),
      });
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      onFileSelect({
        name: dropped.name,
        size: dropped.size,
        url: URL.createObjectURL(dropped),
      });
    }
  }

  function handleSampleAttach() {
    onFileSelect({
      name: sampleFileName,
      size: 482000,
    });
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <label className="text-caption font-semibold tracking-wide text-ink uppercase">
          {label} {required && <span className="text-danger-600">*</span>}
        </label>
        {description && <span className="text-caption text-ink-muted">{description}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {file ? (
        <div className="flex items-center justify-between rounded-lg border border-success-300 bg-success-50/70 p-3.5 transition-colors">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-success-100 text-success-700">
              <Check size={18} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium text-ink">{file.name}</p>
              <p className="text-caption text-ink-muted">
                {file.size ? formatFileSize(file.size) + ' · ' : ''}Attached & Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded px-2 py-1 text-caption font-medium text-primary-700 hover:bg-primary-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove document"
              className="rounded p-1 text-ink-muted hover:bg-neutral-200 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors',
            isDragging
              ? 'border-primary-500 bg-primary-50/50'
              : error
                ? 'border-danger-400 bg-danger-50/30'
                : 'border-line-strong bg-surface hover:border-primary-400 hover:bg-primary-50/20',
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <UploadCloud size={20} />
          </div>
          <p className="mt-2 text-body-sm font-medium text-ink">
            Tap to upload or drag and drop
          </p>
          <p className="mt-0.5 text-caption text-ink-muted">
            PDF, PNG or JPG (up to 5 MB)
          </p>

          <div className="mt-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSampleAttach();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-surface px-3 py-1 text-caption font-medium text-primary-700 shadow-xs hover:bg-primary-50"
            >
              <Sparkles size={12} className="text-primary-600" />
              Use demo sample
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-caption text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
