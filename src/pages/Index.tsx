import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { KPIStats } from '@/components/dashboard/KPIStats';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PhaseSelector } from '@/components/dashboard/PhaseSelector';
import { useKPIStats, useRecentActivity } from '@/hooks/useMarketaApi';
import type { Phase } from '@/services/types';

const Index = () => {
  const [phase, setPhase] = useState<Phase>('regcf');
  const { data: stats, isLoading: statsLoading } = useKPIStats(phase);
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back to Marketa Console
            </p>
          </div>
          <PhaseSelector value={phase} onChange={setPhase} />
        </div>

        {/* KPI Stats */}
        <div className="mb-8">
          <KPIStats stats={stats} isLoading={statsLoading} />
        </div>

        {/* Activity & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityFeed
              logs={activity?.logs}
              events={activity?.events}
              isLoading={activityLoading}
            />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
