'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { AppLogo } from './AppLogo';

interface NavBarProps {
  username: string;
  onMenuToggle: () => void;
}

function formatUsername(raw: string): string {
  return raw
    .split('.')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function NavBar({ username, onMenuToggle }: NavBarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm shrink-0">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: hamburger + logo + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="p-1.5 rounded-md text-brand-grey hover:text-brand-grey-dark hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <AppLogo size={28} />
              <span className="font-semibold text-brand-grey-dark text-sm hidden sm:block group-hover:text-brand-red transition-colors">
                Invaluable Team Management
              </span>
            </Link>
          </div>

          {/* Right: username + sign out */}
          <div className="flex items-center gap-4">
            {username && (
              <span className="text-sm text-brand-grey hidden sm:block">
                {formatUsername(username)}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-brand-grey-dark hover:text-brand-red transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
