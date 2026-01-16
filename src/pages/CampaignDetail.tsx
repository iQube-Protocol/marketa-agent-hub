import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePack, useApprovePack, useRegeneratePack, useRequestEdits } from '@/hooks/useMarketaApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Send,
  FileX,
  RefreshCw,
  MessageSquare,
  Loader2,
  Package,
  Hash,
  Link as LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { PackStatus } from '@/services/types';

const statusConfig: Record<PackStatus, { icon: typeof Clock; label: string; className: string }> = {
  draft: { icon: FileX, label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_approval: { icon: Clock, label: 'Pending Approval', className: 'bg-warning/10 text-warning' },
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

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: pack, isLoading } = usePack(id || '');
  const approvePack = useApprovePack();
  const regeneratePack = useRegeneratePack();
  const requestEdits = useRequestEdits();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approvePack.mutateAsync(id);
      toast({ title: 'Pack approved successfully' });
    } catch {
      toast({ title: 'Failed to approve pack', variant: 'destructive' });
    }
  };

  const handleRegenerate = async () => {
    if (!id) return;
    try {
      await regeneratePack.mutateAsync(id);
      toast({ title: 'Pack regenerated successfully' });
    } catch {
      toast({ title: 'Failed to regenerate pack', variant: 'destructive' });
    }
  };

  const handleRequestEdits = async () => {
    if (!id || !feedback.trim()) return;
    try {
      await requestEdits.mutateAsync({ id, feedback });
      toast({ title: 'Edit request submitted' });
      setFeedback('');
      setShowFeedback(false);
    } catch {
      toast({ title: 'Failed to submit request', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-8 h-4 w-96" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!pack) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Package className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Pack Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            The pack you're looking for doesn't exist.
          </p>
          <Link to="/campaigns">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const status = statusConfig[pack.status];
  const StatusIcon = status.icon;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/campaigns"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Campaigns
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  {pack.type === 'owned_wpp' ? 'Owned Pack' : pack.partnerName}
                </h1>
                <Badge className={status.className}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                {phaseLabels[pack.phase]} • Week of {format(new Date(pack.weekOf), 'MMM d, yyyy')} • v{pack.version}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={regeneratePack.isPending}
              >
                {regeneratePack.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFeedback(!showFeedback)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Request Edits
              </Button>
              {pack.status !== 'approved' && pack.status !== 'sent' && (
                <Button onClick={handleApprove} disabled={approvePack.isPending}>
                  {approvePack.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        {showFeedback && (
          <Card className="card-elevated mb-6 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-lg">Request Edits</CardTitle>
              <CardDescription>
                Provide feedback for content revisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the changes you'd like to see..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFeedback(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestEdits}
                  disabled={!feedback.trim() || requestEdits.isPending}
                >
                  {requestEdits.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Content Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hero" className="w-full">
                  <TabsList className="mb-4 w-full justify-start">
                    <TabsTrigger value="hero">Hero</TabsTrigger>
                    <TabsTrigger value="short1">Short 1</TabsTrigger>
                    <TabsTrigger value="short2">Short 2</TabsTrigger>
                    <TabsTrigger value="short3">Short 3</TabsTrigger>
                    <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
                    <TabsTrigger value="community">Community</TabsTrigger>
                  </TabsList>

                  {['hero', 'short1', 'short2', 'short3', 'newsletter', 'community'].map((tab) => {
                    const item = pack.items[tab as keyof typeof pack.items];
                    return (
                      <TabsContent key={tab} value={tab}>
                        {item ? (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{item.threadLabel}</Badge>
                              <Badge variant="secondary">{item.modeLabel}</Badge>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                Copy
                              </label>
                              <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-foreground">{item.copy}</p>
                              </div>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">
                                CTA
                              </label>
                              <Badge className="bg-primary">{item.cta}</Badge>
                            </div>
                            {item.hashtags.length > 0 && (
                              <div>
                                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-foreground">
                                  <Hash className="h-4 w-4" />
                                  Hashtags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {item.hashtags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">
                              No content for this item yet
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pack Info */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Pack Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">
                    {pack.type === 'owned_wpp' ? 'Owned' : 'Partner'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phase</span>
                  <span className="text-sm font-medium">{phaseLabels[pack.phase]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <Badge variant="secondary">v{pack.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tone</span>
                  <span className="text-sm font-medium">{pack.tone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {format(new Date(pack.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Channels */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Target Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {pack.channels.map((channel) => (
                    <Badge key={channel} variant="secondary">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {pack.status === 'approved' && (
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <Link to={`/publish?pack=${pack.id}`}>
                    <Button className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      Publish This Pack
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
