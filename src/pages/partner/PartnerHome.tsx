/** Partner Home - Dashboard for partner view */

import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { useQuery } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Megaphone, TrendingUp, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PartnerHome() {
  const { config } = useConfig();

  const { data: packQueue } = useQuery({
    queryKey: ['partner', 'packQueue'],
    queryFn: () => marketaApi.getPackQueue(),
  });

  const { data: campaigns } = useQuery({
    queryKey: ['partner', 'campaignCatalog'],
    queryFn: () => marketaApi.getCampaignCatalog(),
  });

  const { data: performance } = useQuery({
    queryKey: ['partner', 'performance'],
    queryFn: () => marketaApi.getTenantPerformance(),
  });

  const pendingPacks = packQueue?.filter(p => p.status === 'pending') || [];
  const activeCampaigns = campaigns?.filter(c => c.is_joined || c.status === 'active') || [];
  const availableCampaigns = campaigns?.filter(c => !c.is_joined && c.status === 'available') || [];

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {config.partner_name || 'Partner'}</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your campaigns and content
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Packs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPacks.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting your approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns.length}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance?.metrics.clicks?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance?.metrics.rewards_knyt?.toLocaleString() || '0'} <span className="text-sm font-normal text-muted-foreground">KNYT</span></div>
              <p className="text-xs text-muted-foreground">+ {performance?.metrics.rewards_qc || 0} Qc</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Packs */}
        {pendingPacks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Packs Awaiting Approval
                  </CardTitle>
                  <CardDescription>Review and approve content for publishing</CardDescription>
                </div>
                <Button asChild variant="outline">
                  <Link to="/p/packs">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingPacks.slice(0, 3).map(pack => (
                  <div
                    key={pack.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">Week of {pack.week_of}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {pack.channels.slice(0, 3).map(channel => (
                          <Badge key={channel} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                        {pack.channels.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{pack.channels.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/p/packs/${pack.id}`}>
                        Review <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Campaigns */}
        {availableCampaigns.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Available Campaigns</CardTitle>
                  <CardDescription>Join coordinated campaigns for maximum impact</CardDescription>
                </div>
                <Button asChild variant="outline">
                  <Link to="/p/campaigns">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {availableCampaigns.slice(0, 2).map(campaign => (
                  <div
                    key={campaign.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.description}
                        </p>
                      </div>
                      <Badge variant={campaign.type === 'sequence' ? 'default' : 'secondary'}>
                        {campaign.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {campaign.channels.slice(0, 3).map(channel => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/p/campaigns/${campaign.id}`}>
                          Learn More
                        </Link>
                      </Button>
                    </div>
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
