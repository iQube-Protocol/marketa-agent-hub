/** QubeTalk Page - Agent communication interface */

import { MainLayout } from '@/components/layout/MainLayout';
import { QubeTalkClient } from '@/components/qubetalk/QubeTalkClient';

export default function QubeTalk() {
  return (
    <MainLayout>
      <div className="h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">QubeTalk</h1>
          <p className="text-muted-foreground">
            Real-time communication with AgentiQ ecosystem agents
          </p>
        </div>
        <div className="h-[calc(100%-4rem)]">
          <QubeTalkClient />
        </div>
      </div>
    </MainLayout>
  );
}
