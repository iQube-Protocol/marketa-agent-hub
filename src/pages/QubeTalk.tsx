/** QubeTalk Page - Agent communication interface */

import { MainLayout } from '@/components/layout/MainLayout';
import { QubeTalkClient } from '@/components/qubetalk/QubeTalkClient';
import { useConfig } from '@/contexts/ConfigContext';

export default function QubeTalk() {
  const { config } = useConfig();

  return (
    <MainLayout>
      <div className="h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">QubeTalk</h1>
          <p className="text-muted-foreground">
            Real-time communication with AgentiQ ecosystem agents
          </p>
        </div>
        {!config.persona_id && (
          <div className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Persona required</p>
            <p className="text-muted-foreground">
              Use the sidebar menu “Set Persona / Tenant…” or add `?tenant=...&persona=...` to the URL.
            </p>
          </div>
        )}
        <div className="h-[calc(100%-4rem)]">
          <QubeTalkClient />
        </div>
      </div>
    </MainLayout>
  );
}
