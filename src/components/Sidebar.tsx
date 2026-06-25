'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, FlaskConical, Calculator, Presentation, BarChart2 } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminHref: string;
  engineerHref: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Engineering Assessment',
    icon: ClipboardCheck,
    adminHref: '/admin',
    engineerHref: '/dashboard',
  },
  {
    label: 'Group Testing',
    icon: FlaskConical,
    adminHref: '/group-testing',
    engineerHref: '/group-testing',
  },
  {
    label: 'Grooming / Estimation',
    icon: Calculator,
    adminHref: '/estimation',
    engineerHref: '/estimation',
  },
  {
    label: 'FE Huddle Knowledge Share',
    icon: Presentation,
    adminHref: '/fe-huddle',
    engineerHref: '/fe-huddle',
  },
  {
    label: 'Workload',
    icon: BarChart2,
    adminHref: '/admin/workload',
    engineerHref: '',
    adminOnly: true,
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
        'flex flex-col border-r border-white/10 bg-[#141414] transition-all duration-200 overflow-hidden shrink-0',
        open ? 'w-60' : 'w-16',
      ].join(' ')}
    >
      <nav className="flex-1 py-3">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(({ label, icon: Icon, adminHref, engineerHref }) => {
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
                  ? 'text-[#e03030] bg-[#e03030]/10 after:absolute after:right-0 after:top-0 after:h-full after:w-0.5 after:bg-[#e03030]'
                  : 'text-white/70 hover:bg-white/5 hover:text-[#e03030]',
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
