/** Main Layout - Routes to correct shell based on role */

import { ReactNode } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { Sidebar } from './Sidebar';
import { PartnerLayout } from './PartnerLayout';
import { AnalystLayout } from './AnalystLayout';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { config } = useConfig();

  // Route to correct layout based on role
  if (config.role === 'partnerAdmin') {
    return <PartnerLayout>{children}</PartnerLayout>;
  }

  if (config.role === 'analyst') {
    return <AnalystLayout>{children}</AnalystLayout>;
  }

  // Default: Admin layout
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 transition-all duration-300 lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
