'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { AppLogo } from './AppLogo';

interface NavBarProps {
  username: string;
  homeHref: string;
}

function formatUsername(raw: string): string {
  return raw
    .split('.')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function NavBar({ username, homeHref }: NavBarProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <header className="bg-white border-b-4 border-brand-red sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href={homeHref} className="flex items-center gap-2.5 group">
            <AppLogo size={30} />
            <span className="font-semibold text-brand-grey-dark text-sm hidden sm:block group-hover:text-brand-red transition-colors">
              Engineering Assessment
            </span>
          </Link>

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
