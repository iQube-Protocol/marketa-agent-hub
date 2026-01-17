/** Analyst Layout - Read-only shell for analysts */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AnalystLayoutProps {
  children: ReactNode;
}

export function AnalystLayout({ children }: AnalystLayoutProps) {
  const location = useLocation();
  const isActive = location.pathname === '/reports';

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal sidebar for analyst */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to="/reports"
                className={cn(
                  'flex items-center justify-center rounded-lg px-3 py-2.5 transition-all',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <BarChart3 className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Reports
            </TooltipContent>
          </Tooltip>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-center rounded-lg bg-sidebar-accent px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              AN
            </div>
          </div>
        </div>
      </aside>

      <main className="pl-16">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
