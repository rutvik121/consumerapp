import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ListGroup, ListRow } from '@/design-system';
import { ROUTES } from '@/navigation/routes';
import { useOrganizationContextStore, useSessionStore } from '@/state';
import { copy } from '@/content';
import { PERSONAS } from './personas';

/**
 * PROTOTYPE ONLY — the temporary entry point.
 *
 * Increment 1 replaces this route with Splash → Login → OTP. Everything
 * downstream of it (session store, guards, role-driven navigation) is already
 * final and will not change when real authentication arrives.
 */
export function PersonaPickerScreen() {
  const signIn = useSessionStore((state) => state.signIn);
  const clearContext = useOrganizationContextStore((state) => state.clear);
  const navigate = useNavigate();

  function selectPersona(personaId: string) {
    const persona = PERSONAS.find((candidate) => candidate.id === personaId);
    if (!persona) return;

    clearContext();
    signIn(persona.user, persona.organization);
    navigate(ROUTES.home, { replace: true });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="px-6 pt-12 pb-8">
        <p className="text-overline text-primary-600 uppercase">{copy.app.name}</p>
        <h1 className="mt-2 text-display text-ink">{copy.prototype.choosePersona}</h1>
        <p className="mt-2 text-body text-ink-secondary">{copy.prototype.personaIntro}</p>
      </div>

      <ListGroup className="border-y border-line">
        {PERSONAS.map((persona) => (
          <ListRow
            key={persona.id}
            title={persona.label}
            subtitle={persona.description}
            trailing={<ChevronRight size={18} className="mt-0.5 shrink-0 text-neutral-400" />}
            onClick={() => selectPersona(persona.id)}
          />
        ))}
      </ListGroup>

      <p className="px-6 py-6 text-caption text-ink-muted">
        Increment 1 replaces this screen with mobile number and OTP verification.
      </p>
    </div>
  );
}
