/** Partner Reports - Tenant-scoped performance reports */

import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { useQuery } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, MousePointer, Users, Gift, Loader2 } from 'lucide-react';

export default function PartnerReports() {
  const { data: performance, isLoading } = useQuery({
    queryKey: ['partner', 'performance'],
    queryFn: () => marketaApi.getTenantPerformance(),
  });

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  const metrics = performance?.metrics;

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Performance Reports</h1>
          <p className="text-muted-foreground">Your campaign performance over the last 30 days</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.impressions?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.clicks?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.conversions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.rewards_knyt?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">KNYT</span></div>
            </CardContent>
          </Card>
        </div>

        {performance?.campaigns && performance.campaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Breakdown</CardTitle>
              <CardDescription>Performance by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.campaigns.map(camp => (
                  <div key={camp.campaign_id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{camp.campaign_name}</p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{camp.metrics.clicks} clicks</span>
                        <span>{camp.metrics.conversions} conversions</span>
                      </div>
                    </div>
                    <Badge variant="secondary">{camp.metrics.rewards_knyt} KNYT</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerLayout>
  );
}
