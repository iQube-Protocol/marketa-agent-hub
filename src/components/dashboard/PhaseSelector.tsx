import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Phase } from '@/services/types';

interface PhaseSelectorProps {
  value: Phase;
  onChange: (value: Phase) => void;
}

const phases: { value: Phase; label: string }[] = [
  { value: 'codex1', label: 'Codex 1' },
  { value: 'regcf', label: 'Reg CF' },
  { value: 'pre_fairlaunch', label: 'Pre-Fairlaunch' },
  { value: 'fairlaunch', label: 'Fairlaunch' },
];

export function PhaseSelector({ value, onChange }: PhaseSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select phase" />
      </SelectTrigger>
      <SelectContent>
        {phases.map((phase) => (
          <SelectItem key={phase.value} value={phase.value}>
            {phase.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
