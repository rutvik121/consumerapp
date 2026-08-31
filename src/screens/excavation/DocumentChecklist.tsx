import { Check, FileText, Paperclip, X } from 'lucide-react';
import type { ApplicationDocumentKind } from '@/domain';
import { APPLICATION_DOCUMENTS } from '@/rules';
import { Button, cn } from '@/design-system';
import { useCopy } from '@/content';

export interface AttachedDocument {
  kind: ApplicationDocumentKind;
  documentType: string;
  fileName: string;
}

export interface DocumentChecklistProps {
  attached: AttachedDocument[];
  onAttach: (kind: ApplicationDocumentKind) => void;
  onRemove: (kind: ApplicationDocumentKind) => void;
}

/**
 * THE DOCUMENT STEP, AS A CHECKLIST.
 *
 * The web form shows every expected document as a row with its own upload
 * control, and that is the right shape for a phone too: an applicant who is
 * shown a single "attach files" button has to already know what is expected.
 * Here the expectation is the interface — each row states what it wants,
 * whether it is required, and whether it has been satisfied.
 *
 * Required rows are listed first and never hidden once satisfied: the point of
 * a checklist is to show the whole list, including what is done.
 */
export function DocumentChecklist({ attached, onAttach, onRemove }: DocumentChecklistProps) {
  const t = useCopy();

  return (
    <ul className="space-y-2">
      {APPLICATION_DOCUMENTS.map((requirement) => {
        const file = attached.find((document) => document.kind === requirement.kind);
        const label = t.excavation.docTypes[requirement.kind];

        return (
          <li
            key={requirement.kind}
            className={cn(
              'rounded-lg border p-3',
              file ? 'border-success-200 bg-success-50/50' : 'border-line-strong bg-surface',
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-md',
                  file ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-ink-muted',
                )}
                aria-hidden
              >
                {file ? <Check size={15} strokeWidth={3} /> : <FileText size={15} />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-ink">{label}</p>
                <p className="mt-0.5 text-caption text-ink-muted">
                  {file ? (
                    <span className="truncate">{file.fileName}</span>
                  ) : requirement.required ? (
                    t.excavation.required
                  ) : (
                    t.excavation.optional
                  )}
                </p>
              </div>

              {file ? (
                <button
                  type="button"
                  aria-label={`${t.excavation.remove} ${label}`}
                  onClick={() => onRemove(requirement.kind)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-neutral-100"
                >
                  <X size={15} aria-hidden />
                </button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Paperclip size={13} />}
                  onClick={() => onAttach(requirement.kind)}
                >
                  {t.excavation.attach}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
