import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, OtpInput } from '@/design-system';
import { ROUTES } from '@/navigation';
import { OTP_LENGTH, OTP_RESEND_SECONDS, formatMobileWithCode } from '@/rules';
import { authRepository } from '@/data';
import { useAuthFlowStore, useOrganizationContextStore, useSessionStore } from '@/state';
import { useCopy } from '@/content';
import { AuthLayout } from './AuthLayout';

/**
 * OTP verification — the step that actually establishes the session.
 *
 * ONE SCREEN SERVES BOTH INTENTS. Verifying a mobile number is identical
 * whether the user is signing in or registering; only what happens after
 * verification differs. Building two near-identical screens would guarantee
 * they drift apart.
 *
 * The code auto-submits on the sixth digit. Asking someone to type six digits
 * and then reach for a button is a step that earns nothing.
 */
export function OtpScreen() {
  const { intent, mobileNumber, registrationDraft, reset } = useAuthFlowStore();
  const signIn = useSessionStore((state) => state.signIn);
  const clearContext = useOrganizationContextStore((state) => state.clear);
  const navigate = useNavigate();
  const t = useCopy();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_SECONDS);

  // Countdown for the resend affordance.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const latestCode = useRef(code);
  latestCode.current = code;

  const handleVerify = useCallback(
    async (value: string) => {
      if (!mobileNumber || verifying) return;

      setVerifying(true);
      setError(null);
      setNotice(null);

      try {
        const result =
          intent === 'REGISTER' && registrationDraft
            ? await authRepository.registerAndVerify(registrationDraft, value)
            : await authRepository.verifyOtp(mobileNumber, value);

        if (result.status === 'SIGNED_IN') {
          // A new session must never inherit a previous user's scope.
          clearContext();
          signIn(result.user, result.organization);
          reset();
          navigate(ROUTES.home, { replace: true });
          return;
        }

        setCode('');
        if (result.status === 'INVALID_OTP') setError(t.auth.otpInvalid);
        else if (result.status === 'NO_ACCOUNT') setError(t.auth.noAccount);
        else setError(t.auth.alreadyRegistered);
      } finally {
        setVerifying(false);
      }
    },
    [
      clearContext,
      intent,
      mobileNumber,
      navigate,
      registrationDraft,
      reset,
      signIn,
      t.auth.alreadyRegistered,
      t.auth.noAccount,
      t.auth.otpInvalid,
      verifying,
    ],
  );

  async function handleResend() {
    if (!mobileNumber) return;
    await authRepository.requestOtp(mobileNumber);
    setSecondsLeft(OTP_RESEND_SECONDS);
    setCode('');
    setError(null);
    setNotice(t.auth.resent);
  }

  if (!mobileNumber) return null;

  return (
    <AuthLayout
      title={t.auth.verifyTitle}
      onBack={true}
      footer={
        secondsLeft > 0 ? (
          <p className="text-center text-body-sm text-ink-muted tabular">
            {t.auth.resendIn} {formatCountdown(secondsLeft)}
          </p>
        ) : (
          <Button variant="ghost" fullWidth onClick={handleResend}>
            {t.auth.resend}
          </Button>
        )
      }
    >
      <p className="mt-2 text-body text-ink-secondary">{t.auth.verifySentTo}</p>

      <div className="mt-1.5 flex items-center gap-3">
        <span className="tabular text-title text-ink">{formatMobileWithCode(mobileNumber)}</span>
        <button
          type="button"
          onClick={() => navigate(intent === 'REGISTER' ? ROUTES.register : ROUTES.login)}
          className="rounded-sm px-1 py-0.5 text-label font-medium text-primary-700 underline underline-offset-2 hover:bg-primary-50"
        >
          {t.auth.changeNumber}
        </button>
      </div>

      <div className="mt-8">
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
          onComplete={handleVerify}
          length={OTP_LENGTH}
          disabled={verifying}
          autoFocus
          {...(error ? { error } : {})}
        />
      </div>

      {verifying && (
        <p role="status" className="mt-3 text-body-sm text-ink-muted">
          Verifying…
        </p>
      )}

      {notice && !error && (
        <p role="status" className="mt-3 text-body-sm text-success-600">
          {notice}
        </p>
      )}

      {/* ==== PROTOTYPE ONLY — remove with src/prototype ==== */}
      <p className="mt-8 rounded-md border border-dashed border-line-strong bg-surface px-3 py-2 text-caption text-ink-muted">
        {t.prototype.otpHint}
      </p>
      {/* ==== end prototype block ==== */}
    </AuthLayout>
  );
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
