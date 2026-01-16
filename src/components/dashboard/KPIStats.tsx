import { Package, CheckCircle, Send, Coins, CircleDollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { KPIStats as KPIStatsType } from '@/services/types';

interface KPIStatsProps {
  stats?: KPIStatsType;
  isLoading?: boolean;
}

const kpiConfig = [
  {
    key: 'packsPendingApproval' as const,
    label: 'Pending Approval',
    icon: Package,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    key: 'packsApproved' as const,
    label: 'Packs Approved',
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    key: 'packsSent' as const,
    label: 'Packs Sent',
    icon: Send,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    key: 'rewardsKnyt' as const,
    label: '$KNYT Issued',
    icon: Coins,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'rewardsQc' as const,
    label: 'Q¢ Issued',
    icon: CircleDollarSign,
    color: 'text-accent-foreground',
    bgColor: 'bg-accent',
    format: (v: number) => v.toLocaleString(),
  },
];

export function KPIStats({ stats, isLoading }: KPIStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="card-elevated">
            <CardContent className="p-5">
              <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = stats?.[kpi.key] ?? 0;
        const displayValue = kpi.format ? kpi.format(value) : value;

        return (
          <Card key={kpi.key} className="card-elevated card-hover">
            <CardContent className="p-5">
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${kpi.bgColor}`}>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{displayValue}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
