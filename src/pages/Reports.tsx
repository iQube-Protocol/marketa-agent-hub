import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  useReportSummary,
  useCampaignPerformance,
  useChannelPerformance,
} from '@/hooks/useMarketaApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Send,
  Target,
  Coins,
  Download,
} from 'lucide-react';
import { format, subDays } from 'date-fns';

const COLORS = ['hsl(346, 77%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(270, 70%, 50%)', 'hsl(180, 70%, 45%)'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('30');
  
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd');

  const { data: summary, isLoading: summaryLoading } = useReportSummary(startDate, endDate);
  const { data: performance, isLoading: performanceLoading } = useCampaignPerformance(startDate, endDate);
  const { data: channels, isLoading: channelsLoading } = useChannelPerformance();

  const kpis = [
    { label: 'Total Campaigns', value: summary?.totalCampaigns || 0, icon: Target, trend: '+12%' },
    { label: 'Active Partners', value: summary?.activePartners || 0, icon: Users, trend: '+3' },
    { label: 'Total Deliveries', value: summary?.totalDeliveries || 0, icon: Send, trend: '+156' },
    { label: 'Rewards Issued', value: summary?.rewardsIssued || 0, icon: Coins, format: true, trend: '+$2.4k' },
  ];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Reports
            </h1>
            <p className="mt-1 text-muted-foreground">
              Analytics and performance insights
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="card-elevated card-hover">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs text-success">
                      {kpi.trend}
                    </Badge>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-foreground">
                    {summaryLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : kpi.format ? (
                      `$${kpi.value.toLocaleString()}`
                    ) : (
                      kpi.value.toLocaleString()
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Campaign Performance Over Time */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => format(new Date(v), 'MMM d')}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(346, 77%, 50%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Channel Performance */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Channel Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {channelsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channels} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="channel"
                      tick={{ fontSize: 12 }}
                      width={80}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="deliveries" fill="hsl(346, 77%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Engagement Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {channelsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channels}
                      dataKey="clicks"
                      nameKey="channel"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}
                    >
                      {channels?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rates */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Rate</span>
                    <span className="text-2xl font-bold text-primary">
                      {summaryLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        `${((summary?.engagementRate || 0) * 100).toFixed(1)}%`
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(summary?.engagementRate || 0) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-2xl font-bold text-success">
                      {summaryLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        `${((summary?.conversionRate || 0) * 100).toFixed(1)}%`
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${(summary?.conversionRate || 0) * 100 * 5}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Based on {summary?.totalDeliveries?.toLocaleString() || 0} deliveries across{' '}
                    {summary?.activePartners || 0} active partners
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
