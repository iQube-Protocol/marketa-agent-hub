/** Partner Pack Detail - Review and approve pack */

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

export default function PartnerPackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [skippedItems, setSkippedItems] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

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

  // Initialize selected channels
  useState(() => {
    if (pack?.channels) {
      setSelectedChannels(pack.channels);
    }
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

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="delivery" disabled={isPending}>
              Delivery Status
            </TabsTrigger>
          </TabsList>

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
                  {pack.channels.map(channel => (
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
                {pack.items.map(item => (
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
