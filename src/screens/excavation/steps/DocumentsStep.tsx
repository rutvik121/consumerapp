import { AlertCircle, Info } from 'lucide-react';
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
 * STEP 4 · DOCUMENTS & CLEARANCES
 *
 * Mandatory documents marked with (*) must be attached before proceeding.
 * Optional clearances or NOCs can be uploaded now or provided later if requested.
 */
export function DocumentsStep({
  documents,
  errors,
  onAttach,
  onRemove,
}: DocumentsStepProps) {
  return (
    <div className="space-y-4">
      {/* Validation error banner */}
      {errors.documents && (
        <div className="rounded-xl border border-danger-200 bg-danger-50/80 p-3.5 text-body-sm text-danger-900 shadow-xs flex items-start gap-2.5">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger-600" />
          <div>
            <p className="font-semibold text-danger-800">Mandatory Uploads Required</p>
            <p className="mt-0.5 text-caption text-danger-700 leading-relaxed">
              {errors.documents}
            </p>
          </div>
        </div>
      )}

      {/* Informational banner about mandatory uploads */}
      <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3.5 text-body-sm text-primary-900 shadow-xs">
        <div className="flex items-start gap-2.5">
          <Info size={18} className="mt-0.5 shrink-0 text-primary-600" />
          <div>
            <p className="font-semibold">Mandatory Documents Required (*)</p>
            <p className="mt-0.5 text-caption text-primary-800 leading-relaxed">
              Documents marked with an asterisk (<span className="text-danger-500 font-bold">*</span>) are mandatory to submit the application. Optional documents can be uploaded now or provided later during scrutiny.
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
