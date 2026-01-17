/** Partner Layout - Shell for partner view */

import { ReactNode } from 'react';
import { PartnerSidebar } from './PartnerSidebar';

interface PartnerLayoutProps {
  children: ReactNode;
}

export function PartnerLayout({ children }: PartnerLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PartnerSidebar />
      <main className="pl-16 transition-all duration-300 lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
