import { AlertTriangle } from 'lucide-react';
import type { ApplicationDocumentKind } from '@/domain';
import { APPLICATION_DOCUMENTS, missingRequiredDocuments } from '@/rules';
import { useCopy } from '@/content';
import { DocumentChecklist, type AttachedDocument } from '../DocumentChecklist';

export interface DocumentsStepProps {
  documents: AttachedDocument[];
  attachedKinds: ApplicationDocumentKind[];
  errors: Record<string, string>;
  onAttach: (kind: ApplicationDocumentKind) => void;
  onRemove: (kind: ApplicationDocumentKind) => void;
}

/**
 * STEP 4 · WHAT IS ATTACHED.
 *
 * A count above the list rather than only an error below it: the applicant
 * needs to know how much is left while they work, not only when they try to
 * leave.
 */
export function DocumentsStep({
  documents,
  attachedKinds,
  errors,
  onAttach,
  onRemove,
}: DocumentsStepProps) {
  const t = useCopy();
  const requiredCount = APPLICATION_DOCUMENTS.filter((document) => document.required).length;
  const missing = missingRequiredDocuments(attachedKinds);

  return (
    <div className="space-y-4">
      <p className="tabular text-body-sm text-ink-secondary">
        {requiredCount - missing.length} of {requiredCount} {t.excavation.documentsAttached}
      </p>

      <DocumentChecklist attached={documents} onAttach={onAttach} onRemove={onRemove} />

      {errors.documents && (
        <p className="flex items-start gap-2 text-caption text-danger-600">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          {t.excavation.documentsMissing}
        </p>
      )}

      {/* ==== PROTOTYPE ONLY — a real build opens the device file picker ==== */}
      <p className="text-caption text-ink-muted">{t.excavation.attachmentSimulated}</p>
      {/* ==== end prototype block ==== */}
    </div>
  );
}
