'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
  type SignInOutput,
} from 'aws-amplify/auth';

type Step = 'credentials' | 'new-password';

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Redirect helper ────────────────────────────────────────────────────────
  async function redirectAfterLogin() {
    const session = await fetchAuthSession();
    const groups =
      (session.tokens?.accessToken?.payload['cognito:groups'] as
        | string[]
        | undefined) ?? [];
    router.replace(groups.includes('Admins') ? '/admin' : '/dashboard');
  }

  // ── Step 1: email + password ───────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result: SignInOutput = await signIn({
        username: email.trim(),
        password,
      });

      if (result.isSignedIn) {
        await redirectAfterLogin();
        return;
      }

      if (
        result.nextStep.signInStep ===
        'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
      ) {
        setStep('new-password');
      } else {
        setError('Unexpected sign-in step. Please contact your administrator.');
      }
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: set new password (first login) ─────────────────────────────────
  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });
      if (result.isSignedIn) {
        await redirectAfterLogin();
      } else {
        setError('Could not complete sign-in. Please try again.');
      }
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="border-b-4 border-brand-red px-8 pt-8 pb-6 flex flex-col items-center gap-3">
          <Image
            src="/INV_CircleLogo.svg"
            alt="Invaluable"
            width={48}
            height={48}
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-brand-grey-dark">
              Engineering Assessment
            </h1>
            <p className="text-sm text-brand-grey mt-1">
              {step === 'credentials'
                ? 'Sign in to continue'
                : 'Set a new password to continue'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          {step === 'credentials' ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-brand-grey-dark mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                  placeholder="you@invaluable.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-brand-grey-dark mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-rating-red bg-rating-red-light rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-red hover:bg-brand-red-hover text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleNewPassword} className="flex flex-col gap-4">
              <p className="text-sm text-brand-grey">
                Your administrator has set a temporary password. Please choose a
                permanent password to continue.
              </p>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-brand-grey-dark mb-1"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-brand-grey-dark mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-rating-red bg-rating-red-light rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-brand-red hover:bg-brand-red-hover text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting password…' : 'Set Password & Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Error message helper ───────────────────────────────────────────────────────
function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotAuthorizedException') return 'Incorrect email or password.';
    if (err.name === 'UserNotFoundException') return 'No account found for that email.';
    if (err.name === 'InvalidPasswordException') return err.message;
    if (err.name === 'LimitExceededException')
      return 'Too many attempts. Please wait a moment and try again.';
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
