import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PomodoroPreset {
  name: string;
  work: number;
  break: number;
  label: string;
}

interface PomodoroPresetSelectorProps {
  presets: PomodoroPreset[];
  selectedPreset: PomodoroPreset;
  onPresetChange: (preset: PomodoroPreset) => void;
  disabled?: boolean;
}

export const PomodoroPresetSelector = ({
  presets,
  selectedPreset,
  onPresetChange,
  disabled = false,
}: PomodoroPresetSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {presets.map((preset) => (
        <Card
          key={preset.name}
          className={cn(
            "p-4 cursor-pointer transition-all hover:shadow-md",
            selectedPreset.name === preset.name
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-accent",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onPresetChange(preset)}
        >
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-foreground">{preset.name}</p>
            <p className="text-xs text-muted-foreground">{preset.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
