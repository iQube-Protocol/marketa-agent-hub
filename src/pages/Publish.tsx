import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePacks, usePartners, usePublish } from '@/hooks/useMarketaApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Rocket,
} from 'lucide-react';
import type { Channel, PublishTarget, PublishResult } from '@/services/types';

const ownedChannels: { value: Channel; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'newsletter', label: 'Newsletter (Mailjet)' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export default function Publish() {
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [dryRun, setDryRun] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);

  const { data: packs, isLoading: packsLoading } = usePacks();
  const { data: partners } = usePartners();
  const publish = usePublish();
  const { toast } = useToast();

  const approvedPacks = packs?.filter((p) => p.status === 'approved') || [];

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handlePublish = async () => {
    if (!selectedPackId || selectedChannels.length === 0) return;

    const targets: PublishTarget[] = selectedChannels.map((channel) => ({
      type: 'owned',
      channel,
    }));

    try {
      const publishResults = await publish.mutateAsync({
        packId: selectedPackId,
        targets,
        dryRun,
      });
      setResults(publishResults);
      toast({
        title: dryRun ? 'Dry run completed' : 'Published successfully',
        description: `${publishResults.filter((r) => r.status === 'success').length}/${publishResults.length} deliveries successful`,
      });
    } catch {
      toast({ title: 'Publish failed', variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Publish
          </h1>
          <p className="mt-1 text-muted-foreground">
            Send approved packs to marketing channels
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration */}
          <div className="space-y-6">
            {/* Pack Selection */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Select Pack</CardTitle>
                <CardDescription>
                  Choose an approved pack to publish
                </CardDescription>
              </CardHeader>
              <CardContent>
                {packsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedPackId} onValueChange={setSelectedPackId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a pack" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedPacks.map((pack) => (
                        <SelectItem key={pack.id} value={pack.id}>
                          {pack.type === 'owned_wpp' ? 'Owned' : pack.partnerName} -{' '}
                          {pack.phase} (v{pack.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Channel Selection */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Target Channels</CardTitle>
                <CardDescription>
                  Select channels to publish to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ownedChannels.map((channel) => (
                    <Label
                      key={channel.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedChannels.includes(channel.value)}
                        onCheckedChange={() => toggleChannel(channel.value)}
                      />
                      <span className="text-sm font-medium">{channel.label}</span>
                    </Label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dry-run" className="text-base font-medium">
                      Dry Run
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Test without actually publishing
                    </p>
                  </div>
                  <Switch
                    id="dry-run"
                    checked={dryRun}
                    onCheckedChange={setDryRun}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publish Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handlePublish}
              disabled={
                !selectedPackId ||
                selectedChannels.length === 0 ||
                publish.isPending
              }
            >
              {publish.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  {dryRun ? 'Run Dry Test' : 'Publish Now'}
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-primary" />
                Delivery Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No results yet</p>
                  <p className="text-sm text-muted-foreground">
                    Results will appear here after publishing
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border p-3 animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {result.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.target.channel}</Badge>
                          <Badge
                            variant={result.status === 'success' ? 'default' : 'destructive'}
                            className={result.status === 'success' ? 'bg-success' : ''}
                          >
                            {result.status}
                          </Badge>
                        </div>
                        {result.deliveryUrl && (
                          <a
                            href={result.deliveryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block truncate text-xs text-primary hover:underline"
                          >
                            {result.deliveryUrl}
                          </a>
                        )}
                        {result.error && (
                          <p className="mt-1 text-xs text-destructive">{result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
