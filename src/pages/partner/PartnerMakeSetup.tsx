import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { useConfig } from '@/contexts/ConfigContext';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Webhook, Wand2 } from 'lucide-react';

type WizardStep = 1 | 2 | 3 | 4 | 5;

type MakeWizardState = {
  step: WizardStep;
  makeAccountCreated: boolean;
  scenarioInstalled: boolean;
  channelsConnected: boolean;
  webhookUrl: string;
  verified: boolean;
  updatedAt: number;
};

function resolveContext(): { tenant?: string; persona?: string } {
  const params = new URLSearchParams(window.location.search);
  const tenant = params.get('tenant') || window.localStorage.getItem('marketa_tenant_id') || undefined;
  const persona = params.get('persona') || window.localStorage.getItem('marketa_persona_id') || undefined;
  return { tenant, persona };
}

function makeWizardStorageKey(): string {
  const ctx = resolveContext();
  const tenant = ctx.tenant || 'unknown-tenant';
  const persona = ctx.persona || 'unknown-persona';
  return `marketa_make_wizard_v1:${tenant}:${persona}`;
}

function loadWizardState(): MakeWizardState {
  const key = makeWizardStorageKey();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {
        step: 1,
        makeAccountCreated: false,
        scenarioInstalled: false,
        channelsConnected: false,
        webhookUrl: '',
        verified: false,
        updatedAt: Date.now(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<MakeWizardState>;
    const step = (parsed.step ?? 1) as WizardStep;
    return {
      step: [1, 2, 3, 4, 5].includes(step) ? step : 1,
      makeAccountCreated: Boolean(parsed.makeAccountCreated),
      scenarioInstalled: Boolean(parsed.scenarioInstalled),
      channelsConnected: Boolean(parsed.channelsConnected),
      webhookUrl: typeof parsed.webhookUrl === 'string' ? parsed.webhookUrl : '',
      verified: Boolean(parsed.verified),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return {
      step: 1,
      makeAccountCreated: false,
      scenarioInstalled: false,
      channelsConnected: false,
      webhookUrl: '',
      verified: false,
      updatedAt: Date.now(),
    };
  }
}

function saveWizardState(next: MakeWizardState) {
  const key = makeWizardStorageKey();
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...next, updatedAt: Date.now() }));
  } catch {
    // ignore
  }
}

function stepCompletion(state: MakeWizardState) {
  return {
    1: state.makeAccountCreated,
    2: state.scenarioInstalled,
    3: state.channelsConnected,
    4: Boolean(state.webhookUrl),
    5: state.verified,
  } as const;
}

function nextStep(current: WizardStep): WizardStep {
  if (current >= 5) return 5;
  return (current + 1) as WizardStep;
}

function prevStep(current: WizardStep): WizardStep {
  if (current <= 1) return 1;
  return (current - 1) as WizardStep;
}

export default function PartnerMakeSetup() {
  const { hasFeature } = useConfig();
  const queryClient = useQueryClient();

  const [state, setState] = useState<MakeWizardState>(() => loadWizardState());

  useEffect(() => {
    saveWizardState(state);
  }, [state]);

  const { data: settings } = useQuery({
    queryKey: ['partner', 'settings'],
    queryFn: () => marketaApi.getPartnerSettings(),
  });

  useEffect(() => {
    if (!settings) return;
    if (settings.make_webhook_url && !state.webhookUrl) {
      setState((prev) => ({ ...prev, webhookUrl: settings.make_webhook_url || '' }));
    }
  }, [settings, state.webhookUrl]);

  const guideUrl = useMemo(() => {
    const envUrl = (import.meta as any).env?.VITE_MAKE_SCENARIO_TEMPLATE_URL as string | undefined;
    return envUrl || 'https://www.make.com/en/templates';
  }, []);

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      marketaApi.updatePartnerSettings({
        publishing_method: 'make',
        make_webhook_url: state.webhookUrl,
      }),
    onSuccess: () => {
      toast.success('Saved webhook');
      queryClient.invalidateQueries({ queryKey: ['partner', 'settings'] });
      setState((prev) => ({ ...prev, step: prev.step < 4 ? 4 : prev.step }));
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save webhook'),
  });

  const testWebhookMutation = useMutation({
    mutationFn: () => marketaApi.testWebhook_partner(state.webhookUrl),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Webhook test successful! (${result.latency_ms}ms)`);
        setState((prev) => ({ ...prev, verified: true }));
      } else {
        toast.error(result.message || 'Webhook test failed');
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Webhook test failed'),
  });

  const completion = stepCompletion(state);
  const completedCount = Object.values(completion).filter(Boolean).length;
  const progressValue = Math.round((completedCount / 5) * 100);

  if (!hasFeature('make_enabled')) {
    return (
      <PartnerLayout>
        <div className="p-6 lg:p-8 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Make setup is disabled</CardTitle>
              <CardDescription>This environment has `make_enabled` turned off.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/p/settings">Back to Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/p/settings">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="h-6 w-6" /> Make Setup Wizard
            </h1>
            <p className="text-muted-foreground">
              White-glove onboarding to connect your Make scenario and publishing channels.
            </p>
          </div>
          <div className="w-56 shrink-0">
            <div className="text-sm font-medium mb-2">{progressValue}% complete</div>
            <Progress value={progressValue} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Steps</CardTitle>
              <CardDescription>Finish these once per account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {([
                { step: 1 as const, title: 'Create Make account', done: completion[1] },
                { step: 2 as const, title: 'Install scenario template', done: completion[2] },
                { step: 3 as const, title: 'Connect social accounts', done: completion[3] },
                { step: 4 as const, title: 'Paste webhook URL', done: completion[4] },
                { step: 5 as const, title: 'Verify & finish', done: completion[5] },
              ] as const).map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, step: s.step }))}
                  className={[
                    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    state.step === s.step ? 'bg-muted' : 'hover:bg-muted/50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.title}</div>
                      <div className="text-xs text-muted-foreground">Step {s.step} of 5</div>
                    </div>
                    {s.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border" />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {state.step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Create your Make account</CardTitle>
                  <CardDescription>Make is where the actual publishing automation runs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild>
                    <a href="https://www.make.com/en/register" target="_blank" rel="noopener noreferrer">
                      Open Make registration <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="makeAccountCreated"
                      checked={state.makeAccountCreated}
                      onCheckedChange={(v) => setState((prev) => ({ ...prev, makeAccountCreated: Boolean(v) }))}
                    />
                    <label htmlFor="makeAccountCreated" className="text-sm leading-relaxed">
                      I have created (or already have) a Make account for publishing.
                    </label>
                  </div>
                  <div className="flex justify-between">
                    <div />
                    <Button
                      onClick={() => setState((prev) => ({ ...prev, step: nextStep(prev.step) }))}
                      disabled={!state.makeAccountCreated}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state.step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Install the Marketa scenario template</CardTitle>
                  <CardDescription>We recommend starting from a curated template.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild variant="outline">
                    <a href={guideUrl} target="_blank" rel="noopener noreferrer">
                      Open templates <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Add a Webhook trigger (Custom webhook)</li>
                    <li>Map fields: campaign id, asset url, caption, scheduled time</li>
                    <li>Add your social modules (LinkedIn/X/Instagram/TikTok as needed)</li>
                  </ul>
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="scenarioInstalled"
                      checked={state.scenarioInstalled}
                      onCheckedChange={(v) => setState((prev) => ({ ...prev, scenarioInstalled: Boolean(v) }))}
                    />
                    <label htmlFor="scenarioInstalled" className="text-sm leading-relaxed">
                      I installed a scenario and added a Webhook trigger.
                    </label>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: prevStep(prev.step) }))}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setState((prev) => ({ ...prev, step: nextStep(prev.step) }))}
                      disabled={!state.scenarioInstalled}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state.step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Connect your social accounts</CardTitle>
                  <CardDescription>Do this inside Make (OAuth) so Marketa can publish for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    In your scenario, open each social module and connect the account you want Marketa to publish to.
                    Keep the scenario turned on (or scheduled) after connecting.
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      id="channelsConnected"
                      checked={state.channelsConnected}
                      onCheckedChange={(v) => setState((prev) => ({ ...prev, channelsConnected: Boolean(v) }))}
                    />
                    <label htmlFor="channelsConnected" className="text-sm leading-relaxed">
                      I connected the social accounts I plan to use (and tested a manual run).
                    </label>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: prevStep(prev.step) }))}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setState((prev) => ({ ...prev, step: nextStep(prev.step) }))}
                      disabled={!state.channelsConnected}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state.step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" /> Paste your webhook URL
                  </CardTitle>
                  <CardDescription>We’ll use this URL to trigger publishing events from Marketa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="makeWebhook">Make webhook URL</Label>
                    <Input
                      id="makeWebhook"
                      placeholder="https://hook.make.com/..."
                      value={state.webhookUrl}
                      onChange={(e) => setState((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                      className="mt-2"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Tip: In Make, the webhook URL is shown on the webhook module after you create it.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => saveSettingsMutation.mutate()}
                      disabled={!state.webhookUrl || saveSettingsMutation.isPending}
                    >
                      {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save webhook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => testWebhookMutation.mutate()}
                      disabled={!state.webhookUrl || testWebhookMutation.isPending}
                    >
                      {testWebhookMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Test webhook
                    </Button>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: prevStep(prev.step) }))}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setState((prev) => ({ ...prev, step: nextStep(prev.step) }))}
                      disabled={!state.webhookUrl}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state.step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verify & finish</CardTitle>
                  <CardDescription>Confirm your webhook and scenario are ready.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Make account created</span>
                      {completion[1] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">Pending</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Scenario installed</span>
                      {completion[2] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">Pending</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Channels connected</span>
                      {completion[3] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">Pending</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Webhook URL saved</span>
                      {completion[4] ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">Pending</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => testWebhookMutation.mutate()}
                      disabled={!state.webhookUrl || testWebhookMutation.isPending}
                    >
                      {testWebhookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Test webhook again
                    </Button>
                    <Button
                      onClick={() => {
                        if (!completion[1] || !completion[2] || !completion[3] || !completion[4]) {
                          toast.error('Complete steps 1–4 first');
                          return;
                        }
                        setState((prev) => ({ ...prev, verified: true }));
                        toast.success('Make setup complete');
                      }}
                      disabled={!completion[1] || !completion[2] || !completion[3] || !completion[4]}
                    >
                      Mark complete
                    </Button>
                  </div>

                  {state.verified && (
                    <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
                      <div className="font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Ready to publish
                      </div>
                      <div className="text-muted-foreground mt-1">
                        Join a campaign and approve channels to activate publishing in Make.
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: prevStep(prev.step) }))}>
                      Back
                    </Button>
                    <Button asChild>
                      <Link to="/p/campaigns">Go to Campaigns</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
}

