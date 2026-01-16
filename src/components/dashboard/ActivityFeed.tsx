import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeliveryLog, CRMEvent } from '@/services/types';

interface ActivityFeedProps {
  logs?: DeliveryLog[];
  events?: CRMEvent[];
  isLoading?: boolean;
}

const statusConfig = {
  success: { icon: CheckCircle, className: 'text-success' },
  failed: { icon: XCircle, className: 'text-destructive' },
  pending: { icon: Clock, className: 'text-warning' },
};

export function ActivityFeed({ logs = [], events = [], isLoading }: ActivityFeedProps) {
  const allItems = [
    ...logs.map((log) => ({
      id: log.id,
      type: 'delivery' as const,
      title: `Pack delivered to ${log.channel}`,
      status: log.status,
      time: log.deliveredAt,
      meta: log.url || log.error,
    })),
    ...events.map((event) => ({
      id: event.id,
      type: 'crm' as const,
      title: `${event.type} event`,
      status: 'success' as const,
      time: event.createdAt,
      meta: event.profileId,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  if (isLoading) {
    return (
      <Card className="card-elevated h-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-6">
          <div className="space-y-4 pb-6">
            {allItems.slice(0, 10).map((item) => {
              const StatusIcon = statusConfig[item.status]?.icon || CheckCircle;
              const statusClass = statusConfig[item.status]?.className || 'text-muted-foreground';

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 animate-fade-in"
                >
                  <div className="mt-0.5">
                    <StatusIcon className={`h-5 w-5 ${statusClass}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <Badge
                        variant={item.type === 'delivery' ? 'default' : 'secondary'}
                        className="shrink-0 text-xs"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      {item.meta && ` • ${item.meta}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
