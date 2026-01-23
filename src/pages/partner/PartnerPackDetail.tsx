/** Partner Pack Detail - Review and approve pack */

import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Package, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  Clock,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfig } from '@/contexts/ConfigContext';

function buildSuggestedSchedule(input: {
  week_of: string;
  items: { id: string; type: string }[];
}): { id: string; label: string; date: string }[] {
  const base = new Date(`${input.week_of}T00:00:00`);
  if (Number.isNaN(base.getTime())) return [];

  const toDate = (days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const items = Array.isArray(input.items) ? input.items : [];
  const scheduled: { id: string; label: string; date: string }[] = [];

  // Hero: Monday
  const heroItem = items.find((i) => i.type === 'hero');
  if (heroItem) scheduled.push({ id: heroItem.id, label: 'Hero', date: toDate(0) });

  // Shorts: Tue/Thu/Sat
  const shortItems = items.filter((i) => i.type === 'short');
  const shortOffsets = [1, 3, 5];
  shortItems.forEach((item, idx) => {
    const day = shortOffsets[Math.min(idx, shortOffsets.length - 1)];
    scheduled.push({ id: item.id, label: `Short ${idx + 1}`, date: toDate(day) });
  });

  // Newsletter/Community: Wed/Fri
  const newsletter = items.find((i) => i.type === 'newsletter');
  if (newsletter) scheduled.push({ id: newsletter.id, label: 'Newsletter', date: toDate(2) });
  const community = items.find((i) => i.type === 'community');
  if (community) scheduled.push({ id: community.id, label: 'Community', date: toDate(4) });

  const order: Record<string, number> = { Hero: 0, 'Short 1': 1, 'Short 2': 2, 'Short 3': 3, Newsletter: 4, Community: 5 };
  return scheduled.sort((a, b) => (order[a.label] ?? 99) - (order[b.label] ?? 99));
}

export default function PartnerPackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { config } = useConfig();

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [skippedItems, setSkippedItems] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [channelTimes, setChannelTimes] = useState<Record<string, string>>({});

  const { data: pack, isLoading } = useQuery({
    queryKey: ['partner', 'pack', id],
    queryFn: () => marketaApi.getPackDetail(id!),
    enabled: !!id,
  });

  const { data: receipts } = useQuery({
    queryKey: ['partner', 'packStatus', id],
    queryFn: () => marketaApi.getPublishStatus(id!),
    enabled: !!id && pack?.status !== 'pending',
  });

  const approveMutation = useMutation({
    mutationFn: () => marketaApi.approvePack_partner({
      packId: id!,
      selectedChannels: selectedChannels.length > 0 ? selectedChannels : pack?.channels || [],
      scheduleWindows: Object.entries(channelTimes)
        .filter(([channel, time]) => (selectedChannels.length > 0 ? selectedChannels.includes(channel) : true) && Boolean(time))
        .map(([channel, time]) => ({ channel, time })),
    }),
    onSuccess: () => {
      toast.success('Pack approved and scheduled for publishing!');
      queryClient.invalidateQueries({ queryKey: ['partner'] });
      navigate('/p/packs');
    },
    onError: () => {
      toast.error('Failed to approve pack');
    },
  });

  const requestEditsMutation = useMutation({
    mutationFn: () => marketaApi.requestPackEdits(id!, feedback),
    onSuccess: () => {
      toast.success('Edit request sent');
      queryClient.invalidateQueries({ queryKey: ['partner'] });
      navigate('/p/packs');
    },
  });

  useEffect(() => {
    const channels = Array.isArray(pack?.channels) ? pack!.channels : [];
    if (channels.length === 0) return;
    setSelectedChannels((prev) => (prev.length > 0 ? prev : channels));
    setChannelTimes((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const init: Record<string, string> = {};
      for (const channel of channels) init[channel] = '10:00';
      return init;
    });
  }, [pack?.channels]);

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  if (!pack) {
    return (
      <PartnerLayout>
        <div className="p-6 lg:p-8">
          <Button variant="ghost" onClick={() => navigate('/p/packs')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Packs
          </Button>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">Pack not found</p>
          </div>
        </div>
      </PartnerLayout>
    );
  }

  const packChannels = Array.isArray(pack.channels) ? pack.channels : [];
  const packItems = Array.isArray(pack.items) ? pack.items : [];

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleSkipItem = (itemId: string) => {
    setSkippedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(i => i !== itemId)
        : [...prev, itemId]
    );
  };

  const isPending = pack.status === 'pending';
  const hero = packItems.find((i) => i.type === 'hero');
  const shorts = packItems.filter((i) => i.type === 'short');
  const includedChannels = selectedChannels.length > 0 ? selectedChannels : packChannels;
  const schedule = buildSuggestedSchedule({ week_of: pack.week_of, items: packItems });

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/p/packs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Week of {pack.week_of}
            </h1>
            <p className="text-muted-foreground">
              Review content and approve for publishing
            </p>
          </div>
          <Badge variant={isPending ? 'outline' : 'default'}>
            {pack.status}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Review Content</TabsTrigger>
            <TabsTrigger value="schedule">Delivery Schedule</TabsTrigger>
            <TabsTrigger value="delivery" disabled={isPending}>
              Delivery Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign & Purpose</CardTitle>
                <CardDescription>
                  This weekly pack helps MetaProof communicate a consistent narrative and helps you publish with confidence.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="font-medium">For MetaProof</p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Reinforce the core message: identity, proof, and trust.</li>
                      <li>Maintain steady weekly reach across partner channels.</li>
                      <li>Drive action via a single strong CTA in the hero.</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">For you ({config.partner_name || 'Partner'})</p>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Publish without drafting from scratch.</li>
                      <li>Get a balanced mix: one hero + supporting shorts.</li>
                      <li>See delivery status once publishing begins.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="font-medium">What the Hero and Shorts do</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Hero</p>
                      <p className="text-sm text-muted-foreground">
                        The flagship post for the week. It sets context, communicates the main value, and includes the clearest CTA.
                      </p>
                      {hero?.content && (
                        <p className="mt-2 rounded-md bg-background/60 p-2 text-xs text-muted-foreground line-clamp-3">
                          {hero.content}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Shorts</p>
                      <p className="text-sm text-muted-foreground">
                        Supporting micro-posts that reinforce the theme and keep momentum between hero moments.
                      </p>
                      {shorts[0]?.content && (
                        <p className="mt-2 rounded-md bg-background/60 p-2 text-xs text-muted-foreground line-clamp-3">
                          {shorts[0].content}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">1 Hero</Badge>
                    <Badge variant="outline">{shorts.length} Shorts</Badge>
                    <Badge variant="outline">{includedChannels.length} Channels</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Channel Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing Channels</CardTitle>
                <CardDescription>
                  Select which channels to publish to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {packChannels.map(channel => (
                    <label
                      key={channel}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors ${
                        selectedChannels.includes(channel) || selectedChannels.length === 0
                          ? 'border-primary bg-primary/5'
                          : 'border-muted opacity-50'
                      }`}
                    >
                      <Switch
                        checked={selectedChannels.includes(channel) || selectedChannels.length === 0}
                        onCheckedChange={() => toggleChannel(channel)}
                        disabled={!isPending}
                      />
                      <span className="font-medium capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Items */}
            <Card>
              <CardHeader>
                <CardTitle>Content Preview</CardTitle>
                <CardDescription>
                  Review each content item. Toggle to skip items you don't want to publish.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {packItems.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 transition-opacity ${
                      skippedItems.includes(item.id) ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="uppercase">
                        {item.type}
                      </Badge>
                      {isPending && (
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {skippedItems.includes(item.id) ? 'Skipped' : 'Include'}
                          </span>
                          <Switch
                            checked={!skippedItems.includes(item.id)}
                            onCheckedChange={() => toggleSkipItem(item.id)}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{item.content}</p>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.cta && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs text-muted-foreground">CTA: </span>
                        <span className="text-xs font-medium">{item.cta}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            {isPending && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex-1 max-w-md">
                      <Label htmlFor="feedback" className="mb-2 block">
                        Request changes (optional)
                      </Label>
                      <Textarea
                        id="feedback"
                        placeholder="Describe any changes you'd like..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      {feedback && (
                        <Button
                          variant="outline"
                          onClick={() => requestEditsMutation.mutate()}
                          disabled={requestEditsMutation.isPending}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Request Edits
                        </Button>
                      )}
                      <Button
                        size="lg"
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Approve & Publish
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Schedule</CardTitle>
                <CardDescription>
                  Pick a preferred publish time per channel and review the suggested weekly cadence.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {includedChannels.map((channel) => (
                    <div key={channel} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium capitalize">{channel}</p>
                        <Badge variant="outline">Local time</Badge>
                      </div>
                      <div className="mt-2">
                        <Label htmlFor={`time-${channel}`} className="text-xs text-muted-foreground">
                          Preferred publish time
                        </Label>
                        <Input
                          id={`time-${channel}`}
                          type="time"
                          value={channelTimes[channel] || ''}
                          onChange={(e) => setChannelTimes((prev) => ({ ...prev, [channel]: e.target.value }))}
                          className="mt-1"
                          disabled={!isPending}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border">
                  <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                    <div className="col-span-4">Date</div>
                    <div className="col-span-3">Slot</div>
                    <div className="col-span-5">Content</div>
                  </div>
                  <div className="divide-y">
                    {schedule.map((row) => {
                      const item = packItems.find((i) => i.id === row.id);
                      return (
                        <div key={row.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                          <div className="col-span-4 text-muted-foreground">{row.date}</div>
                          <div className="col-span-3">
                            <Badge variant="secondary" className="capitalize">{row.label}</Badge>
                          </div>
                          <div className="col-span-5">
                            <p className="line-clamp-2">{item?.content || ''}</p>
                          </div>
                        </div>
                      );
                    })}
                    {schedule.length === 0 && (
                      <div className="px-4 py-6 text-sm text-muted-foreground">
                        Schedule unavailable for this pack.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Receipts</CardTitle>
                <CardDescription>
                  Track the publishing status for each channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {receipts && receipts.length > 0 ? (
                  <div className="space-y-3">
                    {receipts.map(receipt => (
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
                          {receipt.status === 'failed' && (
                            <X className="h-5 w-5 text-destructive" />
                          )}
                          <div>
                            <p className="font-medium capitalize">{receipt.channel}</p>
                            {receipt.delivered_at && (
                              <p className="text-xs text-muted-foreground">
                                Delivered {new Date(receipt.delivered_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {receipt.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={receipt.url} target="_blank" rel="noopener noreferrer">
                              View Post <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Delivery status will appear here after publishing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}
