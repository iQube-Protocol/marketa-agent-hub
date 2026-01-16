import { useState } from 'react';
import { useGeneratePack, usePartners } from '@/hooks/useMarketaApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import type { PackType, Phase, Channel } from '@/services/types';

interface PackWizardProps {
  onComplete: () => void;
}

const steps = [
  { id: 1, title: 'Pack Type' },
  { id: 2, title: 'Partner' },
  { id: 3, title: 'Phase' },
  { id: 4, title: 'Channels' },
  { id: 5, title: 'Schedule' },
  { id: 6, title: 'Tone & CTAs' },
];

const channels: { value: Channel; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
];

const phases: { value: Phase; label: string }[] = [
  { value: 'codex1', label: 'Codex 1' },
  { value: 'regcf', label: 'Reg CF' },
  { value: 'pre_fairlaunch', label: 'Pre-Fairlaunch' },
  { value: 'fairlaunch', label: 'Fairlaunch' },
];

export function PackWizard({ onComplete }: PackWizardProps) {
  const [step, setStep] = useState(1);
  const [packType, setPackType] = useState<PackType>('owned_wpp');
  const [partnerId, setPartnerId] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('regcf');
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);
  const [weekOf, setWeekOf] = useState<Date>();
  const [tone, setTone] = useState('Professional & Engaging');

  const { data: partners } = usePartners();
  const generatePack = useGeneratePack();
  const { toast } = useToast();

  const maxStep = packType === 'partner_wpp' ? 6 : 6;
  const currentSteps = packType === 'owned_wpp' 
    ? steps.filter(s => s.id !== 2) 
    : steps;

  const getStepIndex = () => {
    if (packType === 'owned_wpp' && step > 1) {
      return step - 1;
    }
    return step - 1;
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!packType;
      case 2: return packType === 'owned_wpp' || !!partnerId;
      case 3: return !!phase;
      case 4: return selectedChannels.length > 0;
      case 5: return !!weekOf;
      case 6: return !!tone;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 1 && packType === 'owned_wpp') {
      setStep(3); // Skip partner selection
    } else if (step < 6) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 3 && packType === 'owned_wpp') {
      setStep(1);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!weekOf) return;

    try {
      await generatePack.mutateAsync({
        type: packType,
        partnerId: packType === 'partner_wpp' ? partnerId : undefined,
        phase,
        channels: selectedChannels,
        weekOf: format(weekOf, 'yyyy-MM-dd'),
        tone,
      });
      toast({ title: 'Pack generated successfully!' });
      onComplete();
    } catch {
      toast({ title: 'Failed to generate pack', variant: 'destructive' });
    }
  };

  const toggleChannel = (channel: Channel) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {currentSteps.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
              getStepIndex() === i
                ? 'bg-primary text-primary-foreground'
                : getStepIndex() > i
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[250px]">
        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-base">Select Pack Type</Label>
            <RadioGroup
              value={packType}
              onValueChange={(v) => setPackType(v as PackType)}
              className="grid gap-4"
            >
              <Label
                htmlFor="owned"
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors',
                  packType === 'owned_wpp' && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value="owned_wpp" id="owned" />
                <div>
                  <p className="font-medium">Owned WPP</p>
                  <p className="text-sm text-muted-foreground">
                    Content for your own marketing channels
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="partner"
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors',
                  packType === 'partner_wpp' && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value="partner_wpp" id="partner" />
                <div>
                  <p className="font-medium">Partner WPP</p>
                  <p className="text-sm text-muted-foreground">
                    Content for partner distribution
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>
        )}

        {step === 2 && packType === 'partner_wpp' && (
          <div className="space-y-4">
            <Label className="text-base">Select Partner</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a partner" />
              </SelectTrigger>
              <SelectContent>
                {partners?.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name} ({partner.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label className="text-base">Select Phase</Label>
            <RadioGroup
              value={phase}
              onValueChange={(v) => setPhase(v as Phase)}
              className="grid grid-cols-2 gap-4"
            >
              {phases.map((p) => (
                <Label
                  key={p.value}
                  htmlFor={p.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                    phase === p.value && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value={p.value} id={p.value} />
                  <span className="font-medium">{p.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Label className="text-base">Select Channels</Label>
            <div className="grid grid-cols-3 gap-3">
              {channels.map((channel) => (
                <Label
                  key={channel.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors',
                    selectedChannels.includes(channel.value) && 'border-primary bg-primary/5'
                  )}
                >
                  <Checkbox
                    checked={selectedChannels.includes(channel.value)}
                    onCheckedChange={() => toggleChannel(channel.value)}
                  />
                  <span className="text-sm">{channel.label}</span>
                </Label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Label className="text-base">Week Of</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !weekOf && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {weekOf ? format(weekOf, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={weekOf}
                  onSelect={setWeekOf}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <Label className="text-base">Tone & Style</Label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g., Professional & Inspiring"
            />
            <p className="text-sm text-muted-foreground">
              Describe the tone and style for the generated content
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < 6 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={!canProceed() || generatePack.isPending}
          >
            {generatePack.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Pack
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
