'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  Compass,
  LayoutDashboard,
  Radar,
  Settings,
  WifiOff,
  Workflow,
} from 'lucide-react';
import { flushOfflineSyncQueue } from '@/lib/offline-db';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/applications', label: 'Applications', icon: Briefcase },
  { href: '/automation', label: 'Automation', icon: Workflow },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const updateStatus = () => {
      const isOffline = !navigator.onLine;
      setOffline(isOffline);
      if (!isOffline) {
        flushOfflineSyncQueue().catch(() => {});
      }
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-slate-800 bg-slate-900/70 p-4 gap-6">
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
          <Radar className="w-6 h-6 text-sky-400" />
          <div>
            <div className="font-semibold text-sm tracking-tight">JobOps Radar</div>
            <div className="text-[11px] text-slate-400">Asia/Manila · Personal MVP</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? 'bg-sky-500/15 text-sky-300 font-medium border border-sky-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
          <div className="font-medium text-slate-200 mb-1">Approval Gate</div>
          Proposals never auto-submit. Explicit user approval required.
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {offline && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            Offline mode — viewing cached content. Changes will sync on reconnect.
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around py-2 z-50">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                active ? 'text-sky-400 font-medium' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
