'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }

    const isAdmin = data.user?.user_metadata?.isAdmin === true;
    router.replace(isAdmin ? '/admin' : '/dashboard');
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[#141414] rounded-lg shadow-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="border-b-4 border-[#e03030] px-8 pt-8 pb-6 flex flex-col items-center gap-3">
          <Image
            src="/INV_CircleLogo.svg"
            alt="Invaluable"
            width={48}
            height={48}
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">
              Invaluable Team Management
            </h1>
            <p className="text-sm text-white/60 mt-1">Sign in to continue</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-1"
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
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/20 rounded-md text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent"
                placeholder="you@invaluable.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/80 mb-1"
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
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/20 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-[#e03030] bg-[#e03030]/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#e03030] hover:bg-[#c02525] text-white font-medium rounded-md text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.';
  if (message.includes('Email not confirmed')) return 'Account not confirmed. Contact your administrator.';
  if (message.includes('Too many requests')) return 'Too many attempts. Please wait a moment and try again.';
  return message;
}
