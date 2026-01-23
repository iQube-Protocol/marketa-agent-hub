/** Partner Settings - Webhook and publishing configuration */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { useConfig } from '@/contexts/ConfigContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, Webhook, CheckCircle2, XCircle, Loader2, ChevronDown, ExternalLink, Info, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerSettings() {
  const { hasFeature } = useConfig();
  const queryClient = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [method, setMethod] = useState<'make' | 'manual' | 'community'>('manual');

  const { data: settings } = useQuery({
    queryKey: ['partner', 'settings'],
    queryFn: () => marketaApi.getPartnerSettings(),
  });

  useEffect(() => {
    if (!settings) return;
    if (settings.make_webhook_url) setWebhookUrl(settings.make_webhook_url);
    if (settings.publishing_method) setMethod(settings.publishing_method);
  }, [settings]);

  const { data: guide } = useQuery({
    queryKey: ['partner', 'makeGuide'],
    queryFn: () => marketaApi.getMakeSetupGuide(),
    enabled: hasFeature('make_enabled'),
  });

  const testMutation = useMutation({
    mutationFn: () => marketaApi.testWebhook_partner(webhookUrl),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Webhook test successful! (${result.latency_ms}ms)`);
      } else {
        toast.error(result.message);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => marketaApi.updatePartnerSettings({ publishing_method: method, make_webhook_url: webhookUrl }),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['partner', 'settings'] });
    },
  });

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" /> Settings
          </h1>
          <p className="text-muted-foreground">Configure your publishing workflow</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Publishing Method</CardTitle>
            <CardDescription>How should content be published to your channels?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as typeof method)} className="space-y-3">
              {hasFeature('make_enabled') && (
                <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="make" className="mt-1" />
                  <div>
                    <p className="font-medium">Make Automation</p>
                    <p className="text-sm text-muted-foreground">Automatically publish via Make.com webhook</p>
                  </div>
                </label>
              )}
              <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="manual" className="mt-1" />
                <div>
                  <p className="font-medium">Manual</p>
                  <p className="text-sm text-muted-foreground">Download content and publish yourself</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="community" className="mt-1" />
                <div>
                  <p className="font-medium">Community Mode</p>
                  <p className="text-sm text-muted-foreground">Share with your community to post on your behalf</p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {method === 'make' && hasFeature('make_enabled') && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" /> Make Setup Wizard
                </CardTitle>
                <CardDescription>Guided setup to connect Make and your publishing channels.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/p/settings/make">Open wizard</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" /> Make Webhook
                </CardTitle>
                <CardDescription>Enter your Make.com webhook URL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhook">Webhook URL</Label>
                  <Input
                    id="webhook"
                    placeholder="https://hook.make.com/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => testMutation.mutate()} disabled={!webhookUrl || testMutation.isPending}>
                    {testMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Test Webhook
                  </Button>
                </div>
                {settings?.webhook_health && (
                  <div className="flex items-center gap-2 text-sm">
                    {settings.webhook_health.status === 'healthy' ? (
                      <><CheckCircle2 className="h-4 w-4 text-success" /> Healthy</>
                    ) : (
                      <><XCircle className="h-4 w-4 text-muted-foreground" /> Not configured</>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {guide && (
              <Collapsible>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-info" />
                          <CardTitle className="text-base">I don't have Make yet</CardTitle>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {guide.steps.map((step) => (
                          <div key={step.step} className="flex gap-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {step.step}
                            </div>
                            <div>
                              <p className="font-medium">{step.title}</p>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                              {step.action_url && (
                                <a href={step.action_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                                  Open <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </>
        )}

        {/* Phase 2 Partner Rewards Placeholder */}
        {hasFeature('partner_rewards_phase2_enabled') ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                API/Webhook Reward Integration
              </CardTitle>
              <CardDescription>Connect your reward system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure API endpoints to automatically issue rewards to participants.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed opacity-75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-5 w-5" />
                API/Webhook Reward Integration
                <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">Coming Soon</span>
              </CardTitle>
              <CardDescription>
                Advanced reward API integration will be available in Phase 2
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
