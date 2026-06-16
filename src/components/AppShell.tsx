'use client';

import { useState } from 'react';
import { NavBar } from './NavBar';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  username: string;
  isAdmin: boolean;
  children: React.ReactNode;
}

export function AppShell({ username, isAdmin, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      <NavBar
        username={username}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar open={sidebarOpen} isAdmin={isAdmin} />
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
