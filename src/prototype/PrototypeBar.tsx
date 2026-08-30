import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { BottomSheet, ListGroup, ListRow } from '@/design-system';
import { ROUTES } from '@/navigation/routes';
import { useCurrentUser, useOrganizationContextStore, useSessionStore } from '@/state';
import { copy } from '@/content';
import { PERSONAS } from './personas';

/**
 * PROTOTYPE ONLY — see ./personas.ts for removal instructions.
 *
 * Deliberately styled to look like tooling rather than product: a dark strip
 * outside the app's own chrome. It must never be mistaken for part of the
 * experience being reviewed.
 */
export function PrototypeBar() {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const signIn = useSessionStore((state) => state.signIn);
  const clearContext = useOrganizationContextStore((state) => state.clear);
  const navigate = useNavigate();

  const activeLabel = user ? copy.userType[user.userType] : 'Signed out';

  function selectPersona(personaId: string) {
    const persona = PERSONAS.find((candidate) => candidate.id === personaId);
    if (!persona) return;

    // Switching persona must never carry one user's scope into another's.
    clearContext();
    signIn(persona.user, persona.organization);
    setOpen(false);
    navigate(ROUTES.home, { replace: true });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 bg-neutral-900 px-3 pb-1.5 pt-[calc(var(--safe-top)+0.375rem)] text-neutral-0">
        <FlaskConical size={12} className="shrink-0 text-neutral-400" aria-hidden />
        <span className="text-caption font-semibold tracking-wide text-neutral-400 uppercase">
          {copy.prototype.banner}
        </span>
        <span className="min-w-0 flex-1 truncate text-caption text-neutral-300">{activeLabel}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xs px-1.5 py-0.5 text-caption font-medium text-neutral-0 hover:bg-neutral-800"
        >
          {copy.prototype.switchPersona}
        </button>
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={copy.prototype.choosePersona}
        description={copy.prototype.personaIntro}
      >
        <ListGroup className="border-t border-line">
          {PERSONAS.map((persona) => (
            <ListRow
              key={persona.id}
              title={persona.label}
              subtitle={persona.description}
              onClick={() => selectPersona(persona.id)}
            />
          ))}
        </ListGroup>
      </BottomSheet>
    </>
  );
}
