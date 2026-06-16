'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminHref: string;
  engineerHref: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Engineering Assessment',
    icon: ClipboardCheck,
    adminHref: '/admin',
    engineerHref: '/dashboard',
  },
];

interface SidebarProps {
  open: boolean;
  isAdmin: boolean;
}

export function Sidebar({ open, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        'flex flex-col border-r border-gray-200 bg-white transition-all duration-200 overflow-hidden shrink-0',
        open ? 'w-60' : 'w-16',
      ].join(' ')}
    >
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(({ label, icon: Icon, adminHref, engineerHref }) => {
          const href = isAdmin ? adminHref : engineerHref;
          const isActive = pathname.startsWith(adminHref) || pathname.startsWith(engineerHref);

          return (
            <Link
              key={label}
              href={href}
              title={!open ? label : undefined}
              className={[
                'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-brand-red bg-red-50 after:absolute after:right-0 after:top-0 after:h-full after:w-0.5 after:bg-brand-red'
                  : 'text-brand-grey-dark hover:bg-gray-50 hover:text-brand-red',
              ].join(' ')}
            >
              <Icon size={20} className="shrink-0" />
              {open && (
                <span className="truncate leading-tight">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
