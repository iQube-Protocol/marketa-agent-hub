/** Partner Campaign Detail - View and join campaign */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['partner', 'campaign', id],
    queryFn: () => marketaApi.getCampaignDetail(id!),
    enabled: !!id,
  });

  const { data: status } = useQuery({
    queryKey: ['partner', 'campaignStatus', id],
    queryFn: () => marketaApi.getCampaignStatus(id!),
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      marketaApi.joinCampaign({
        campaignId: id!,
        channels: selectedChannels,
        start_date: startDate,
      }),
    onSuccess: () => {
      toast.success('Successfully joined campaign!');
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    },
    onError: () => {
      toast.error('Failed to join campaign');
    },
  });

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

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
  const is21Awakenings = campaign.name === '21 Awakenings';
  const isJoined = status?.status === 'active';

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
          <Badge variant={campaign.type === 'sequence' ? 'default' : 'secondary'}>
            {campaign.type}
          </Badge>
        </div>

        {/* 21 Awakenings special content */}
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
                      21-day journey with daily short video clips
                    </li>
                    <li className="flex items-start gap-2">
                      <Play className="h-4 w-4 mt-0.5 text-primary" />
                      Day 1 includes a special explainer video
                    </li>
                    <li className="flex items-start gap-2">
                      <Share2 className="h-4 w-4 mt-0.5 text-primary" />
                      Share-to-earn CTAs with Qriptopian Smart Actions
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <div className="rounded-lg bg-background/80 p-4 space-y-2">
                    <p className="text-sm font-medium">Preview Days 1-3</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(day => (
                        <div
                          key={day}
                          className="aspect-video rounded bg-muted flex items-center justify-center text-xs text-muted-foreground"
                        >
                          Day {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={isJoined ? 'status' : 'join'} className="space-y-4">
          <TabsList>
            {!isJoined && <TabsTrigger value="join">Join Campaign</TabsTrigger>}
            {isJoined && <TabsTrigger value="status">Campaign Status</TabsTrigger>}
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {!isJoined && (
            <TabsContent value="join" className="space-y-4">
              {/* Channel Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Channels</CardTitle>
                  <CardDescription>Choose which channels to participate with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {campaign.channels.map(channel => (
                      <label
                        key={channel}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors ${
                          selectedChannels.includes(channel)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted'
                        }`}
                      >
                        <Switch
                          checked={selectedChannels.includes(channel)}
                          onCheckedChange={() => toggleChannel(channel)}
                        />
                        <span className="font-medium capitalize">{channel}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
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

              {/* Join Button */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ready to join?</p>
                      <p className="text-sm text-muted-foreground">
                        You'll start receiving content based on your schedule
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => joinMutation.mutate()}
                      disabled={
                        joinMutation.isPending ||
                        selectedChannels.length === 0 ||
                        !startDate
                      }
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
                        <span>{Math.round(((status.current_day || 0) / (status.total_days || 21)) * 100)}%</span>
                      </div>
                      <Progress value={((status.current_day || 0) / (status.total_days || 21)) * 100} />
                    </div>
                  </CardContent>
                </Card>
              )}

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

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="mt-1 capitalize">{campaign.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1 capitalize">{campaign.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Channels</dt>
                    <dd className="mt-1 flex gap-1.5 flex-wrap">
                      {campaign.channels.map(channel => (
                        <Badge key={channel} variant="outline">
                          {channel}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                  {campaign.rewards && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Rewards</dt>
                      <dd className="mt-1">
                        <Badge variant="secondary">{campaign.rewards.reward_type}</Badge>
                        <p className="text-sm mt-1">{campaign.rewards.reward_terms}</p>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}
