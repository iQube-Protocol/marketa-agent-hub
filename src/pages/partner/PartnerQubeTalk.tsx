/** Partner QubeTalk Page - QubeTalk inside PartnerLayout */

import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { QubeTalkClient } from '@/components/qubetalk/QubeTalkClient';

export default function PartnerQubeTalk() {
  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-0rem)]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">QubeTalk</h1>
          <p className="text-muted-foreground">Real-time communication with AgentiQ ecosystem agents</p>
        </div>
        <div className="h-[calc(100%-4rem)]">
          <QubeTalkClient />
        </div>
      </div>
    </PartnerLayout>
  );
}
