import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Plus, Smile, Meh, Frown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AddSleepEntryDialogProps {
  date: Date;
  existingEntry?: {
    hours_slept: number;
    mood: string;
    sleep_quality?: number;
    bedtime?: string;
    wake_time?: string;
    notes?: string;
  };
  onEntryAdded: () => void;
  canEdit: boolean;
}

export function AddSleepEntryDialog({ date, existingEntry, onEntryAdded, canEdit }: AddSleepEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [hoursSlept, setHoursSlept] = useState(existingEntry?.hours_slept || 8);
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad'>(existingEntry?.mood as any || 'neutral');
  const [sleepQuality, setSleepQuality] = useState(existingEntry?.sleep_quality || 7);
  const [bedtime, setBedtime] = useState(existingEntry?.bedtime || "");
  const [wakeTime, setWakeTime] = useState(existingEntry?.wake_time || "");
  const [notes, setNotes] = useState(existingEntry?.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Cannot edit future dates",
        description: "Please complete today's entry first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("sleep_entries")
        .upsert({
          user_id: user.id,
          date: format(date, "yyyy-MM-dd"),
          hours_slept: hoursSlept,
          mood: mood,
          sleep_quality: sleepQuality,
          bedtime: bedtime || null,
          wake_time: wakeTime || null,
          notes: notes || null,
        }, {
          onConflict: "user_id,date"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sleep entry saved successfully",
      });

      setOpen(false);
      onEntryAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={!canEdit}
        >
          <Plus className="h-4 w-4" />
          {existingEntry ? "Edit" : "Log"} Sleep
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sleep Entry for {format(date, "MMM d, yyyy")}</DialogTitle>
          <DialogDescription>
            Track your sleep hours, mood, and quality
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Hours Slept</Label>
              <span className="text-2xl font-bold text-primary">{hoursSlept.toFixed(1)}h</span>
            </div>
            <Slider
              value={[hoursSlept]}
              onValueChange={(value) => setHoursSlept(value[0])}
              min={0}
              max={24}
              step={0.5}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>24h</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Mood Upon Waking</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={mood === 'happy' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMood('happy')}
                disabled={isLoading}
              >
                <Smile className="h-8 w-8" />
                <span className="text-xs">Happy</span>
              </Button>
              <Button
                type="button"
                variant={mood === 'neutral' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMood('neutral')}
                disabled={isLoading}
              >
                <Meh className="h-8 w-8" />
                <span className="text-xs">Neutral</span>
              </Button>
              <Button
                type="button"
                variant={mood === 'sad' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setMood('sad')}
                disabled={isLoading}
              >
                <Frown className="h-8 w-8" />
                <span className="text-xs">Tired</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sleep Quality</Label>
              <span className="text-xl font-bold text-primary">{sleepQuality}/10</span>
            </div>
            <Slider
              value={[sleepQuality]}
              onValueChange={(value) => setSleepQuality(value[0])}
              min={1}
              max={10}
              step={1}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 (Poor)</span>
              <span>10 (Excellent)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedtime">Bedtime (Optional)</Label>
              <Input
                id="bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wake-time">Wake Time (Optional)</Label>
              <Input
                id="wake-time"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="How did you sleep? Any dreams or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Sleep Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
