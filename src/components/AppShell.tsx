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
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white relative">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(224,48,48,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(224,48,48,0.03) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <NavBar
        username={username}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
      <div className="flex flex-1 min-h-0 relative z-10">
        <Sidebar open={sidebarOpen} isAdmin={isAdmin} />
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#0a0a0a]">
          {children}
        </main>
      </div>
    </div>
  );
}
