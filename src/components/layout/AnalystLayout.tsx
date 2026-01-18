/** Analyst Layout - Read-only shell for analysts */

import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Sparkles, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfig } from '@/contexts/ConfigContext';

interface AnalystLayoutProps {
  children: ReactNode;
}

export function AnalystLayout({ children }: AnalystLayoutProps) {
  const location = useLocation();
  const { config } = useConfig();
  
  // Redirect analysts to /reports if they're on root
  if (config.role === 'analyst' && location.pathname === '/') {
    return <Navigate to="/reports" replace />;
  }

  const isActive = location.pathname === '/reports';

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal sidebar for analyst */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col bg-sidebar">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Marketa - Read Only
            </TooltipContent>
          </Tooltip>
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
              Reports (Read Only)
            </TooltipContent>
          </Tooltip>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center rounded-lg bg-sidebar-accent px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                  AN
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">Analyst</p>
              <p className="text-xs text-muted-foreground">Read-only access</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <main className="pl-16">
        <div className="min-h-screen">
          {/* Read-only banner */}
          <div className="border-b bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Read-only mode — You can view reports but cannot make changes
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
