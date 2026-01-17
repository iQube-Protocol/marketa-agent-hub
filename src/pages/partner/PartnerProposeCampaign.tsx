/** Partner Propose Campaign - Submit new campaign proposal */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

const availableChannels = ['linkedin', 'x', 'instagram', 'tiktok', 'newsletter', 'discord', 'telegram'];

export default function PartnerProposeCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    duration: 7,
    channels: [] as string[],
    notes: '',
  });

  const proposeMutation = useMutation({
    mutationFn: () => marketaApi.proposeCampaign(formData),
    onSuccess: () => {
      toast.success('Campaign proposal submitted! Our team will review it shortly.');
      queryClient.invalidateQueries({ queryKey: ['partner'] });
      navigate('/p/campaigns');
    },
    onError: () => {
      toast.error('Failed to submit proposal');
    },
  });

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const isValid = formData.name && formData.objective && formData.channels.length > 0;

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/p/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Propose a Campaign</h1>
            <p className="text-muted-foreground">
              Collaborate with metaProof on a joint marketing campaign
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-info/50 bg-info/5">
          <CardContent className="flex items-start gap-3 pt-4">
            <Info className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-info">Joint Campaign Collaboration</p>
              <p className="text-muted-foreground mt-1">
                When you propose a campaign, our team will review it and work with you to create 
                co-branded content. All proposed campaigns are collaborations between you and metaProof.
              </p>
            </div>
          </CardContent>
        </Card>

        <form
          onSubmit={e => {
            e.preventDefault();
            proposeMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Describe your campaign idea</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Launch Series"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="objective">Campaign Objective</Label>
                <Textarea
                  id="objective"
                  placeholder="What do you want to achieve with this campaign?"
                  value={formData.objective}
                  onChange={e => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Select
                  value={String(formData.duration)}
                  onValueChange={value => setFormData(prev => ({ ...prev, duration: Number(value) }))}
                >
                  <SelectTrigger className="mt-2 w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 week (7 days)</SelectItem>
                    <SelectItem value="14">2 weeks (14 days)</SelectItem>
                    <SelectItem value="21">3 weeks (21 days)</SelectItem>
                    <SelectItem value="30">1 month (30 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Target Channels</CardTitle>
              <CardDescription>Select the channels you want to use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {availableChannels.map(channel => (
                  <label
                    key={channel}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors ${
                      formData.channels.includes(channel)
                        ? 'border-primary bg-primary/5'
                        : 'border-muted'
                    }`}
                  >
                    <Switch
                      checked={formData.channels.includes(channel)}
                      onCheckedChange={() => toggleChannel(channel)}
                    />
                    <span className="font-medium capitalize">{channel}</span>
                  </label>
                ))}
              </div>
              {formData.channels.length > 0 && (
                <div className="mt-4 flex gap-1.5">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  {formData.channels.map(channel => (
                    <Badge key={channel} variant="secondary" className="text-xs">
                      {channel}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>Any other details or requirements (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Share any specific ideas, assets you have, timing preferences, etc."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ready to submit?</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will review and reach out within 1-2 business days
                  </p>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isValid || proposeMutation.isPending}
                >
                  {proposeMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PartnerLayout>
  );
}
