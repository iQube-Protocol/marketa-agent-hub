import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-16 transition-all duration-300 lg:pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
