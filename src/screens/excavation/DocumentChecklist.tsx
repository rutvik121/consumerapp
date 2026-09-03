import { useState } from 'react';
import { Check, FileText, Upload, X } from 'lucide-react';
import type { ApplicationDocumentKind } from '@/domain';
import {
  APPLICATION_DOCUMENT_DEFINITIONS,
  type DocumentCategory,
  type DocumentDefinition,
} from '@/rules';
import { Button, cn } from '@/design-system';

export interface AttachedDocument {
  kind: ApplicationDocumentKind;
  documentType: string;
  fileName: string;
  documentNumber?: string;
}

export interface DocumentChecklistProps {
  attached: AttachedDocument[];
  onAttach: (kind: ApplicationDocumentKind, label: string, docNumber?: string) => void;
  onRemove: (kind: ApplicationDocumentKind) => void;
}

const CATEGORIES: { id: DocumentCategory; label: string }[] = [
  { id: 'IDENTITY_LAND', label: 'Identity & Land' },
  { id: 'NOC', label: 'NOC Documents' },
  { id: 'PERMISSION', label: 'Excavation Permission' },
  { id: 'OTHER', label: 'Other Documents' },
];

/**
 * Categorized Document Checklist matching desktop portal:
 * - Identity & Land records
 * - NOC Documents with document number inputs
 * - Excavation Permission Clearances
 * - Other documents
 *
 * Differentiates Important vs Optional documents, allowing freedom of uploading.
 */
export function DocumentChecklist({ attached, onAttach, onRemove }: DocumentChecklistProps) {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>('IDENTITY_LAND');
  const [docNumbers, setDocNumbers] = useState<Record<string, string>>({});

  const filteredDocs = APPLICATION_DOCUMENT_DEFINITIONS.filter(
    (doc) => doc.category === activeCategory,
  );

  function handleDocNumberChange(kind: string, value: string) {
    setDocNumbers((prev) => ({ ...prev, [kind]: value }));
  }

  function handleAttach(doc: DocumentDefinition) {
    const docNum = docNumbers[doc.kind];
    onAttach(doc.kind, doc.label, docNum);
  }

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const count = APPLICATION_DOCUMENT_DEFINITIONS.filter((d) => d.category === cat.id).length;
          const attachedCount = attached.filter(
            (a) => APPLICATION_DOCUMENT_DEFINITIONS.find((d) => d.kind === a.kind)?.category === cat.id,
          ).length;

          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-caption font-semibold transition-all',
                isSelected
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'border border-line bg-surface text-ink-muted hover:border-neutral-300 hover:text-ink',
              )}
            >
              {cat.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px]',
                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600',
                )}
              >
                {attachedCount > 0 ? `${attachedCount}/${count}` : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents List for Selected Category */}
      <ul className="space-y-3">
        {filteredDocs.map((doc) => {
          const file = attached.find((a) => a.kind === doc.kind);
          const isMandatory = doc.importance === 'MANDATORY';

          return (
            <li
              key={doc.kind}
              className={cn(
                'rounded-xl border p-3.5 transition-all',
                file
                  ? 'border-success-300 bg-success-50/40 shadow-xs'
                  : isMandatory
                  ? 'border-line bg-surface hover:border-neutral-300'
                  : 'border-line/70 bg-surface/80 hover:border-neutral-300',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                      file ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-ink-muted',
                    )}
                  >
                    {file ? <Check size={16} strokeWidth={2.5} /> : <FileText size={16} />}
                  </span>

                  <div>
                    <p className="text-body-sm font-semibold text-ink">
                      {doc.label}
                      {isMandatory && <span className="text-danger-500 font-bold ml-1">*</span>}
                    </p>

                    <p className="mt-0.5 text-caption text-ink-muted">
                      {file ? (
                        <span className="font-medium text-success-800">
                          {file.fileName} {file.documentNumber ? `· Ref: ${file.documentNumber}` : ''}
                        </span>
                      ) : isMandatory ? (
                        'Mandatory document required to proceed'
                      ) : (
                        'Optional — can be furnished during scrutiny if required'
                      )}
                    </p>
                  </div>
                </div>

                {file ? (
                  <button
                    type="button"
                    aria-label={`Remove ${doc.label}`}
                    onClick={() => onRemove(doc.kind)}
                    className="flex size-7 items-center justify-center rounded-full text-ink-muted hover:bg-neutral-200/60 transition-colors"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload size={13} />}
                    onClick={() => handleAttach(doc)}
                  >
                    Upload
                  </Button>
                )}
              </div>

              {/* Document Number Input for NOCs */}
              {doc.requiresDocumentNumber && !file && (
                <div className="mt-3 border-t border-line/60 pt-2.5">
                  <label className="block text-[11px] font-medium text-ink-secondary mb-1">
                    Document / Sanction Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NOC/2026/PWD/042"
                    value={docNumbers[doc.kind] || ''}
                    onChange={(e) => handleDocNumberChange(doc.kind, e.target.value)}
                    className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-caption text-ink focus:border-primary-500 focus:outline-none"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
