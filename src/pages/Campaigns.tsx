/** Campaigns Page - Admin view with Custom Campaigns support */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePacks, useApprovePack } from '@/hooks/useMarketaApi';
import { PackWizard } from '@/components/campaigns/PackWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Package,
  CheckCircle,
  Clock,
  Send,
  FileX,
  Eye,
  Zap,
  Users,
  Calendar,
  Play,
  Gift,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Pack, PackStatus } from '@/services/types';
import { CAMPAIGN_21_AWAKENINGS_ID } from '@/services/marketaApi';

const statusConfig: Record<PackStatus, { icon: typeof Clock; label: string; className: string }> = {
  draft: { icon: FileX, label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_approval: { icon: Clock, label: 'Pending', className: 'bg-warning/10 text-warning' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-success/10 text-success' },
  sent: { icon: Send, label: 'Sent', className: 'bg-info/10 text-info' },
  rejected: { icon: FileX, label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

const phaseLabels = {
  codex1: 'Codex 1',
  regcf: 'Reg CF',
  pre_fairlaunch: 'Pre-Fairlaunch',
  fairlaunch: 'Fairlaunch',
};

// Mock custom campaigns for admin view
const mockCustomCampaigns = [
  {
    id: CAMPAIGN_21_AWAKENINGS_ID,
    name: '21 Awakenings',
    type: 'sequence' as const,
    status: 'active',
    description: '21-day spiritual awakening journey through daily video content',
    duration: 21,
    participants: 12,
    startDate: '2024-01-15',
    rewards: { type: 'knyt', amount: 50 },
  },
  {
    id: 'camp_codex_launch',
    name: 'Codex Launch Week',
    type: 'custom' as const,
    status: 'draft',
    description: 'Week-long coordinated launch campaign for Codex release',
    duration: 7,
    participants: 0,
    startDate: null,
    rewards: null,
  },
];

export default function Campaigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(searchParams.get('action') === 'generate');
  const { data: packs, isLoading } = usePacks();
  const approvePack = useApprovePack();
  const { toast } = useToast();

  const activeTab = searchParams.get('type') || 'wpp';

  const handleApprove = async (pack: Pack) => {
    try {
      await approvePack.mutateAsync(pack.id);
      toast({ title: 'Pack approved successfully' });
    } catch {
      toast({ title: 'Failed to approve pack', variant: 'destructive' });
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'wpp') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Campaigns
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage weekly packs and custom campaigns
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Pack
          </Button>
        </div>

        {/* Campaign Type Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="wpp" className="gap-2">
              <Package className="h-4 w-4" />
              Weekly Packs
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Zap className="h-4 w-4" />
              Custom Campaigns
            </TabsTrigger>
            <TabsTrigger value="sequence" className="gap-2">
              <Calendar className="h-4 w-4" />
              Sequences
            </TabsTrigger>
          </TabsList>

          {/* Weekly Packs Tab */}
          <TabsContent value="wpp">
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Content Packs
                  {packs && (
                    <Badge variant="secondary" className="ml-2">
                      {packs.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Partner</TableHead>
                          <TableHead>Phase</TableHead>
                          <TableHead>Week Of</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packs?.map((pack) => {
                          const status = statusConfig[pack.status];
                          const StatusIcon = status.icon;

                          return (
                            <TableRow key={pack.id} className="animate-fade-in">
                              <TableCell>
                                <Badge className={status.className}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {pack.type === 'owned_wpp' ? 'Owned' : 'Partner'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {pack.partnerName || '—'}
                              </TableCell>
                              <TableCell>
                                {phaseLabels[pack.phase]}
                              </TableCell>
                              <TableCell>
                                {format(new Date(pack.weekOf), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">v{pack.version}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link to={`/campaigns/${pack.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  {pack.status === 'pending_approval' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-success hover:text-success"
                                      onClick={() => handleApprove(pack)}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Campaigns Tab */}
          <TabsContent value="custom">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockCustomCampaigns
                .filter((c) => c.type === 'custom')
                .map((campaign) => (
                  <Card key={campaign.id} className="card-elevated">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {campaign.duration} days
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {campaign.participants} partners
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/campaigns/${campaign.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Sequence Campaigns Tab (21 Awakenings) */}
          <TabsContent value="sequence">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockCustomCampaigns
                .filter((c) => c.type === 'sequence')
                .map((campaign) => (
                  <Card key={campaign.id} className="card-elevated border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Play className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        </div>
                        <Badge className="bg-success/10 text-success">
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {campaign.duration} days
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {campaign.participants} partners
                        </div>
                        {campaign.rewards && (
                          <div className="flex items-center gap-1 text-primary">
                            <Gift className="h-4 w-4" />
                            {campaign.rewards.amount} {campaign.rewards.type.toUpperCase()}/day
                          </div>
                        )}
                      </div>

                      {/* Partner Participation Overview */}
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                          Partner Participation
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {['TIN', 'CMG', 'DFA', 'AGQ'].map((code) => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {code}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs">
                            +8 more
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link to={`/campaigns/${campaign.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </Button>
                        <Button className="flex-1" asChild>
                          <Link to={`/p/campaigns/${campaign.id}`}>
                            <Users className="mr-2 h-4 w-4" />
                            Partner View
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Pack Wizard Dialog */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Content Pack</DialogTitle>
            </DialogHeader>
            <PackWizard onComplete={() => setWizardOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
