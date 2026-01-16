import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSegmentPreview, usePartners } from '@/hooks/useMarketaApi';
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
import {
  UsersRound,
  Eye,
  Save,
  Loader2,
  Users,
} from 'lucide-react';
import type { ValueTier, EngagementTier } from '@/services/types';

const valueTiers: { value: ValueTier; label: string }[] = [
  { value: 0, label: 'Tier 0' },
  { value: 1, label: 'Tier 1' },
  { value: 2, label: 'Tier 2' },
  { value: 3, label: 'Tier 3' },
  { value: 4, label: 'Tier 4' },
];

const engagementTiers: { value: EngagementTier; label: string }[] = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'active', label: 'Active' },
  { value: 'advocate', label: 'Advocate' },
];

export default function Segments() {
  const [selectedValueTiers, setSelectedValueTiers] = useState<ValueTier[]>([]);
  const [selectedEngagementTiers, setSelectedEngagementTiers] = useState<EngagementTier[]>([]);
  const [mythosBias, setMythosBias] = useState(false);
  const [logosBias, setLogosBias] = useState(false);
  const [builderFlag, setBuilderFlag] = useState(false);
  const [partnerAffinity, setPartnerAffinity] = useState<string>('');
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ count: number; sampleIds: string[] } | null>(null);

  const { data: partners } = usePartners();
  const segmentPreview = useSegmentPreview();

  const toggleValueTier = (tier: ValueTier) => {
    setSelectedValueTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const toggleEngagementTier = (tier: EngagementTier) => {
    setSelectedEngagementTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handlePreview = async () => {
    const result = await segmentPreview.mutateAsync({
      valueTiers: selectedValueTiers,
      engagementTiers: selectedEngagementTiers,
      mythosBias,
      logosBias,
      builderFlag,
      partnerAffinity: partnerAffinity || undefined,
      emailOptIn,
      smsOptIn,
      whatsappOptIn,
    });
    setPreviewResult(result);
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Segments
            </h1>
            <p className="mt-1 text-muted-foreground">
              Build and preview audience segments
            </p>
          </div>
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Save Segment
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Segment Builder */}
          <div className="space-y-6 lg:col-span-2">
            {/* Value Tiers */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Value Tiers</CardTitle>
                <CardDescription>
                  Select customer value tiers to include
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {valueTiers.map((tier) => (
                    <Label
                      key={tier.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedValueTiers.includes(tier.value)}
                        onCheckedChange={() => toggleValueTier(tier.value)}
                      />
                      <span className="text-sm font-medium">{tier.label}</span>
                    </Label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Tiers */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Engagement Tiers</CardTitle>
                <CardDescription>
                  Select engagement levels to target
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {engagementTiers.map((tier) => (
                    <Label
                      key={tier.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedEngagementTiers.includes(tier.value)}
                        onCheckedChange={() => toggleEngagementTier(tier.value)}
                      />
                      <span className="text-sm font-medium">{tier.label}</span>
                    </Label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Flags & Biases */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Flags & Biases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mythos" className="text-sm font-medium">
                    Mythos Bias
                  </Label>
                  <Switch
                    id="mythos"
                    checked={mythosBias}
                    onCheckedChange={setMythosBias}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="logos" className="text-sm font-medium">
                    Logos Bias
                  </Label>
                  <Switch
                    id="logos"
                    checked={logosBias}
                    onCheckedChange={setLogosBias}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="builder" className="text-sm font-medium">
                    Builder Flag
                  </Label>
                  <Switch
                    id="builder"
                    checked={builderFlag}
                    onCheckedChange={setBuilderFlag}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Partner Affinity */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Partner Affinity</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={partnerAffinity} onValueChange={setPartnerAffinity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any partner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any partner</SelectItem>
                    {partners?.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Consent Filters */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Consent Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Opt-In
                  </Label>
                  <Switch
                    id="email"
                    checked={emailOptIn}
                    onCheckedChange={setEmailOptIn}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms" className="text-sm font-medium">
                    SMS Opt-In
                  </Label>
                  <Switch
                    id="sms"
                    checked={smsOptIn}
                    onCheckedChange={setSmsOptIn}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsapp" className="text-sm font-medium">
                    WhatsApp Opt-In
                  </Label>
                  <Switch
                    id="whatsapp"
                    checked={whatsappOptIn}
                    onCheckedChange={setWhatsappOptIn}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card className="card-elevated sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UsersRound className="h-5 w-5 text-primary" />
                  Segment Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="mb-6 w-full"
                  onClick={handlePreview}
                  disabled={segmentPreview.isPending}
                >
                  {segmentPreview.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Segment
                    </>
                  )}
                </Button>

                {previewResult ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="rounded-lg bg-primary/10 p-6 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="text-3xl font-bold text-foreground">
                        {previewResult.count.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        profiles match
                      </p>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-foreground">
                        Sample Profile IDs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {previewResult.sampleIds.map((id) => (
                          <Badge key={id} variant="secondary">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">
                      Configure filters and click preview
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
