/** Partner Layout - Shell for partner view */

import { ReactNode } from 'react';
import { PartnerSidebar } from './PartnerSidebar';

interface PartnerLayoutProps {
  children: ReactNode;
}

export function PartnerLayout({ children }: PartnerLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <PartnerSidebar />
      <main className="flex-1 min-w-0 transition-all duration-300">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
