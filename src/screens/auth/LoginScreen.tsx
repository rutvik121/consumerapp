import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/design-system';
import { ROUTES } from '@/navigation';
import { MOBILE_LENGTH, isValidMobile, normalizeMobile } from '@/rules';
import { useAuthFlowStore } from '@/state';
import { useCopy } from '@/content';
import { AuthLayout } from './AuthLayout';

/**
 * Mobile number entry.
 *
 * One field, one action. Validation is deferred until submit rather than
 * firing on every keystroke — telling someone their number is invalid while
 * they are still typing it is noise, not help.
 */
export function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const startSignIn = useAuthFlowStore((state) => state.startSignIn);
  const navigate = useNavigate();
  const t = useCopy();

  function handleSubmit() {
    if (!isValidMobile(mobile)) {
      setError(t.auth.mobileInvalid);
      return;
    }

    startSignIn(normalizeMobile(mobile));
    navigate(ROUTES.verify);
  }

  return (
    <AuthLayout
      title={t.auth.signIn}
      description={t.auth.mobileHint}
      onBack={true}
      footer={
        <Button size="lg" fullWidth onClick={handleSubmit} disabled={mobile.length === 0}>
          {t.actions.continue}
        </Button>
      }
    >
      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Input
          label={t.auth.mobileLabel}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          autoFocus
          maxLength={MOBILE_LENGTH}
          placeholder={t.auth.mobilePlaceholder}
          value={mobile}
          leftIcon={<span className="text-body text-ink-secondary tabular">+91</span>}
          {...(error ? { error } : {})}
          onChange={(event) => {
            setMobile(event.target.value.replace(/\D/g, '').slice(0, MOBILE_LENGTH));
            setError(null);
          }}
        />
      </form>

      <p className="mt-6 text-body-sm text-ink-secondary">
        {t.auth.noAccountYet}{' '}
        <button
          type="button"
          onClick={() => navigate(ROUTES.register)}
          className="font-medium text-primary-700 underline underline-offset-2"
        >
          {t.auth.createAccount}
        </button>
      </p>

      {/* ==== PROTOTYPE ONLY — remove with src/prototype ==== */}
      <p className="mt-8 rounded-md border border-dashed border-line-strong bg-surface px-3 py-2 text-caption text-ink-muted">
        {t.prototype.seededAccounts}
      </p>
      {/* ==== end prototype block ==== */}
    </AuthLayout>
  );
}
