/** Partner Campaign Detail - View and join campaign with sequence rendering */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Clock,
  Share2,
  Sparkles,
  Play,
  Gift,
  Eye,
  Video,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCampaignDetailFull, useCampaignStatus, useJoinCampaign, useTrackEvent } from '@/hooks/usePartnerApi';
import { CAMPAIGN_21_AWAKENINGS_ID } from '@/services/marketaApi';
import type { MarketaSequenceItem } from '@/services/configTypes';

/** Sequence Day Card Component */
function SequenceDayCard({
  item,
  onView,
  onAssetClick,
  onCtaClick,
}: {
  item: MarketaSequenceItem;
  onView: () => void;
  onAssetClick: () => void;
  onCtaClick: () => void;
}) {
  const isExplainer = item.explainer;
  const isDelivered = item.status === 'delivered';
  const fallbackThumbnail = '/placeholder.svg';

  return (
    <Card 
      className={`transition-all hover:shadow-md ${
        isExplainer ? 'border-primary/50 bg-primary/5' : ''
      } ${isDelivered ? 'opacity-100' : 'opacity-75'}`}
      onMouseEnter={onView}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-muted">
            <img
              src={item.thumbnail_url || fallbackThumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackThumbnail;
              }}
            />
            {isExplainer && (
              <div className="absolute top-1 left-1">
                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                  <Info className="w-3 h-3 mr-1" />
                  Explainer
                </Badge>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Day {item.day_number}
                </p>
                <h4 className="font-semibold text-sm line-clamp-1">{item.title}</h4>
              </div>
              <Badge 
                variant={isDelivered ? 'default' : 'secondary'} 
                className="text-xs flex-shrink-0"
              >
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssetClick();
                  // Open asset in new tab
                  window.open(item.cta_url, '_blank', 'noopener,noreferrer');
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View Asset
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onCtaClick();
                  // Open CTA URL directly
                  window.open(item.cta_url, '_blank', 'noopener,noreferrer');
                }}
              >
                <Video className="w-3 h-3 mr-1" />
                Watch
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PartnerCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const campaignId = id || '';

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === '1';

  const detailQuery = useCampaignDetailFull(campaignId);
  const statusQuery = useCampaignStatus(campaignId);
  const joinMutation = useJoinCampaign();
  const trackEventMutation = useTrackEvent();

  const campaign = detailQuery.data?.campaign;
  const status = statusQuery.data;
  const isLoading = detailQuery.isLoading || statusQuery.isLoading;
  const isJoined = status?.is_joined ?? false;

  const isInJoinedOrPreviewView = isJoined || isPreview;

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const handleJoinCampaign = async () => {
    try {
      await joinMutation.mutateAsync({
        campaignId,
        channels: selectedChannels,
        start_date: startDate || undefined,
      });
      toast.success('Campaign joined successfully');
    } catch (err: any) {
      const message = err?.message || 'Failed to join campaign (check persona/tenant + authorization)';
      console.warn('[Join Campaign] failed', err);
      toast.error(message);
    }
  };

  const is21Awakenings = campaignId === CAMPAIGN_21_AWAKENINGS_ID || campaignId === 'camp_21awakenings';

  const sequenceItems = useMemo(() => {
    const raw = detailQuery.data?.marketa_sequence_items || [];
    return raw.slice().sort((a, b) => a.day_number - b.day_number);
  }, [detailQuery.data?.marketa_sequence_items]);

  const explainerDays = useMemo(() => sequenceItems.filter((i) => i.explainer), [sequenceItems]);
  const regularDays = useMemo(() => sequenceItems.filter((i) => !i.explainer), [sequenceItems]);

  const channelOptions = useMemo(() => {
    const fromCampaign = Array.isArray(campaign?.channels) ? campaign!.channels : [];
    if (fromCampaign.length > 0) return fromCampaign;
    // Fallback: common partner channels
    return ['x', 'linkedin', 'instagram', 'newsletter'];
  }, [campaign?.channels]);

  useEffect(() => {
    if (!campaign) return;
    if (selectedChannels.length === 0 && channelOptions.length > 0) {
      setSelectedChannels(channelOptions);
    }
  }, [campaign, channelOptions, selectedChannels.length]);

  useEffect(() => {
    if (!startDate) {
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [startDate]);

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  if (!campaign) {
    return (
      <PartnerLayout>
        <div className="p-6 lg:p-8">
          <Button variant="ghost" onClick={() => navigate('/p/campaigns')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">Campaign not found</p>
          </div>
        </div>
      </PartnerLayout>
    );
  }

  const isSequence = campaign.type === 'sequence';
  const joinDisabled = selectedChannels.length === 0 || !approvalConfirmed || joinMutation.isPending;

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/p/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {is21Awakenings && <Sparkles className="h-6 w-6 text-primary" />}
              <Megaphone className="h-6 w-6" />
              {campaign.name}
            </h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
          <Badge variant={isSequence ? 'default' : 'secondary'}>
            {campaign.type}
          </Badge>
          {isInJoinedOrPreviewView && (
            <Badge
              variant="outline"
              className={isJoined ? 'text-success border-success' : 'text-primary border-primary'}
            >
              {isJoined && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {isJoined ? 'Joined' : 'Not Joined'}
            </Badge>
          )}
        </div>

        {/* 21 Awakenings welcome content (when not joined) */}
        {is21Awakenings && !isJoined && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    What is 21 Awakenings?
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                      22-day journey with daily short video clips (Day 0-21)
                    </li>
                    <li className="flex items-start gap-2">
                      <Play className="h-4 w-4 mt-0.5 text-primary" />
                      Day 0 & Day 1 include special explainer videos
                    </li>
                    <li className="flex items-start gap-2">
                      <Share2 className="h-4 w-4 mt-0.5 text-primary" />
                      Share-to-earn CTAs with Qriptopian Smart Actions
                    </li>
                    <li className="flex items-start gap-2">
                      <Gift className="h-4 w-4 mt-0.5 text-primary" />
                      Earn KNYT & Qc rewards for participation
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-full max-w-md rounded-lg bg-background/80 p-4 space-y-2 md:w-80 md:max-w-none lg:w-96">
                    <p className="text-sm font-medium">Preview Days 0-2</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sequenceItems.slice(0, 3).map(item => (
                        <div
                          key={item.day_number}
                          className="aspect-video w-full rounded bg-muted overflow-hidden"
                        >
                          <img
                            src={item.thumbnail_url || '/placeholder.svg'}
                            alt={`Day ${item.day_number}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rewards Section */}
        {(detailQuery.data?.marketa_partner_rewards || []).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Partner Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {(detailQuery.data?.marketa_partner_rewards || []).map(reward => (
                  <div
                    key={reward.id}
                    className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30"
                  >
                    <Badge variant="outline" className="text-xs">
                      {reward.reward_type.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{reward.reward_value}</p>
                      <p className="text-xs text-muted-foreground">{reward.reward_terms}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={isInJoinedOrPreviewView ? 'sequence' : 'join'} className="space-y-4">
          <TabsList>
            {!isJoined && <TabsTrigger value="join">Join Campaign</TabsTrigger>}
            {(isInJoinedOrPreviewView || isPreview) && isSequence && <TabsTrigger value="sequence">Sequence</TabsTrigger>}
            {isJoined && <TabsTrigger value="status">Status</TabsTrigger>}
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Join Tab */}
          {!isJoined && (
            <TabsContent value="join" className="space-y-4">
              {/* Channel Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Channels</CardTitle>
                  <CardDescription>
                    Choose where Marketa will publish on your behalf (Make automation). You can change channels later.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {channelOptions.map(channel => (
                      <label
                        key={channel}
                        className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <Checkbox
                          checked={selectedChannels.includes(channel)}
                          onCheckedChange={() => toggleChannel(channel)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium capitalize">{channel}</p>
                          <p className="text-xs text-muted-foreground">Enable publishing to {channel}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule (Optional)</CardTitle>
                  <CardDescription>When should the campaign start for you?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-xs">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Approval */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval</CardTitle>
                  <CardDescription>
                    Confirm you’re approved to publish on the selected channels. Joining will activate automation in Make.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer">
                    <Checkbox checked={approvalConfirmed} onCheckedChange={(v) => setApprovalConfirmed(Boolean(v))} />
                    <div>
                      <p className="font-medium">I approve distribution on these channels</p>
                      <p className="text-sm text-muted-foreground">
                        This will create/activate your participant config and start the campaign workflow.
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* Join Button */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ready to join?</p>
                      <p className="text-sm text-muted-foreground">
                        You'll start receiving content and can track your progress
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleJoinCampaign}
                      disabled={joinDisabled}
                    >
                      {joinMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Join Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Sequence Tab */}
          {(isInJoinedOrPreviewView || isPreview) && isSequence && (
            <TabsContent value="sequence" className="space-y-4">
              {/* Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Campaign Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Day {isPreview ? 0 : status?.current_day || 0} of {status?.total_days || sequenceItems.length || 0}
                      </span>
                      <span>
                        {Math.round((((isPreview ? 0 : status?.current_day || 0) / (status?.total_days || sequenceItems.length || 1)) * 100))}%
                      </span>
                    </div>
                    <Progress
                      value={(((isPreview ? 0 : status?.current_day || 0) / (status?.total_days || sequenceItems.length || 1)) * 100)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Explainer Section */}
              {explainerDays.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Explainer Videos
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {explainerDays.map(item => (
                      <SequenceDayCard
                        key={item.day_number}
                        item={item}
                        onView={() =>
                          trackEventMutation.mutate({
                            campaign_id: campaignId,
                            event_type: 'sequence_view',
                            sequence_day: item.day_number,
                            asset_ref: item.asset_ref,
                          })
                        }
                        onAssetClick={() =>
                          trackEventMutation.mutate({
                            campaign_id: campaignId,
                            event_type: 'asset_click',
                            sequence_day: item.day_number,
                            asset_ref: item.asset_ref,
                          })
                        }
                        onCtaClick={() =>
                          trackEventMutation.mutate({
                            campaign_id: campaignId,
                            event_type: 'cta_click',
                            sequence_day: item.day_number,
                            asset_ref: item.asset_ref,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Sequence */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Daily Sequence ({regularDays.length} days)
                </h3>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-3">
                    {regularDays.map(item => (
                      <SequenceDayCard
                        key={item.day_number}
                        item={item}
                        onView={() =>
                          trackEventMutation.mutate({
                            campaign_id: campaignId,
                            event_type: 'sequence_view',
                            sequence_day: item.day_number,
                            asset_ref: item.asset_ref,
                          })
                        }
                        onAssetClick={() =>
                          trackEventMutation.mutate({
                            campaign_id: campaignId,
                            event_type: 'asset_click',
                            sequence_day: item.day_number,
                            asset_ref: item.asset_ref,
                          })
                        }
                        onCtaClick={() =>
                          trackEventMutation.mutate({
                            campaign_id: campaignId,
                            event_type: 'cta_click',
                            sequence_day: item.day_number,
                            asset_ref: item.asset_ref,
                          })
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          )}

          {/* Status Tab */}
          {isJoined && (
            <TabsContent value="status" className="space-y-4">
              {/* Progress */}
              {isSequence && status && (
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Day {status.current_day} of {status.total_days}</span>
                        <span>{Math.round(((status.current_day || 0) / (status.total_days || 22)) * 100)}%</span>
                      </div>
                      <Progress value={((status.current_day || 0) / (status.total_days || 22)) * 100} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Joined Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Participation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Joined At</dt>
                      <dd className="mt-1">{status?.joined_at ? new Date(status.joined_at).toLocaleDateString() : 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                      <dd className="mt-1">
                        <Badge variant="default">{status?.status || 'active'}</Badge>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Delivery Receipts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Deliveries</CardTitle>
                  <CardDescription>Content delivery status</CardDescription>
                </CardHeader>
                <CardContent>
                  {status?.receipts && status.receipts.length > 0 ? (
                    <div className="space-y-3">
                      {status.receipts.map(receipt => (
                        <div
                          key={receipt.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            {receipt.status === 'delivered' && (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            )}
                            {receipt.status === 'pending' && (
                              <Clock className="h-5 w-5 text-warning" />
                            )}
                            <span className="font-medium capitalize">{receipt.channel}</span>
                          </div>
                          {receipt.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={receipt.url} target="_blank" rel="noopener noreferrer">
                                View <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Deliveries will appear here as content is published</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Campaign ID</dt>
                    <dd className="mt-1 font-mono text-xs">{campaign.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="mt-1 capitalize">{campaign.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1 capitalize">{campaign.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Sequence Length</dt>
                    <dd className="mt-1">
                      {sequenceItems.length > 0 ? `${sequenceItems.length} days (includes Day 0)` : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Channels</dt>
                    <dd className="mt-1 flex gap-1.5 flex-wrap">
                      {channelOptions.map(channel => (
                        <Badge key={channel} variant="outline">
                          {channel}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}
