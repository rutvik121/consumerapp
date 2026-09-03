import { Info } from 'lucide-react';
import type { ApplicationDocumentKind } from '@/domain';
import { DocumentChecklist, type AttachedDocument } from '../DocumentChecklist';

export interface DocumentsStepProps {
  documents: AttachedDocument[];
  attachedKinds: ApplicationDocumentKind[];
  errors: Record<string, string>;
  onAttach: (kind: ApplicationDocumentKind, label: string, docNumber?: string) => void;
  onRemove: (kind: ApplicationDocumentKind) => void;
}

/**
 * STEP 4 · DOCUMENTS & CLEARANCES (Positioned at the end before payment)
 *
 * Freedom of uploading:
 * Clear banner explains that documents are not strictly mandatory to submit
 * the application draft. Applicants can attach available clearances now or
 * provide them later during departmental query resolution.
 */
export function DocumentsStep({
  documents,
  onAttach,
  onRemove,
}: DocumentsStepProps) {
  return (
    <div className="space-y-4">
      {/* Informational banner about non-mandatory uploads */}
      <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3.5 text-body-sm text-primary-900 shadow-xs">
        <div className="flex items-start gap-2.5">
          <Info size={18} className="mt-0.5 shrink-0 text-primary-600" />
          <div>
            <p className="font-semibold">Documents are Optional at Filing</p>
            <p className="mt-0.5 text-caption text-primary-800 leading-relaxed">
              Upload any documents you have ready. Pending clearances or NOCs can also be uploaded
              later if requested during departmental scrutiny.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-body-sm">
        <span className="font-medium text-ink">
          {documents.length} document{documents.length === 1 ? '' : 's'} attached
        </span>
      </div>

      <DocumentChecklist attached={documents} onAttach={onAttach} onRemove={onRemove} />

      <p className="text-caption text-ink-muted text-center pt-2">
        Accepted formats: PDF, JPG, PNG up to 10 MB per file.
      </p>
    </div>
  );
}
