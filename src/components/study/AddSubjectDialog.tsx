import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const formatTime = (time: string) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const hour = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${hour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubjectCreated: () => void;
}

export function AddSubjectDialog({
  open,
  onOpenChange,
  onSubjectCreated,
}: AddSubjectDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [pendingLessons, setPendingLessons] = useState("0");
  const [releaseDay, setReleaseDay] = useState("");
  const [releaseTime, setReleaseTime] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a subject name.",
        variant: "destructive",
      });
      return;
    }

    const lessonsCount = parseInt(pendingLessons) || 0;
    if (lessonsCount < 0) {
      toast({
        title: "Invalid number",
        description: "Pending lessons must be 0 or greater.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate next release date if schedule is set
      let nextReleaseAt: string | null = null;
      let releaseSchedule: string | null = null;
      
      if (releaseDay && releaseTime) {
        releaseSchedule = `Every ${releaseDay} at ${formatTime(releaseTime)}`;
        nextReleaseAt = calculateNextRelease(releaseDay, releaseTime);
      }

      // Create the subject
      const { data: subject, error } = await supabase
        .from("study_subjects")
        .insert({
          user_id: user.id,
          name: name.trim(),
          color,
          pending_lessons: lessonsCount,
          release_schedule: releaseSchedule,
          release_day: releaseDay || null,
          release_time: releaseTime || null,
          next_release_at: nextReleaseAt,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate initial pending lessons if any
      if (lessonsCount > 0 && subject) {
        const lessons = Array.from({ length: lessonsCount }, (_, i) => ({
          subject_id: subject.id,
          user_id: user.id,
          title: `Lesson ${i + 1}`,
          lesson_number: i + 1,
          status: "pending",
          released_at: new Date().toISOString(),
        }));

        const { error: lessonsError } = await supabase
          .from("study_lessons")
          .insert(lessons);

        if (lessonsError) {
          console.error("Error creating lessons:", lessonsError);
        }
      }

      toast({
        title: "Subject created",
        description: `"${name}" has been added with ${lessonsCount} pending lessons.`,
      });

      // Reset form
      setName("");
      setColor(COLORS[0]);
      setPendingLessons("0");
      setReleaseDay("");
      setReleaseTime("");
      onSubjectCreated();
    } catch (error: any) {
      toast({
        title: "Error creating subject",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextRelease = (day: string, time: string): string => {
    const now = new Date();
    const targetDay = DAYS.indexOf(day);
    const [hours, minutes] = time.split(":").map(Number);
    
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = hours * 60 + minutes;
    
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && currentMinutes >= targetMinutes)) {
      daysUntilTarget += 7;
    }
    
    next.setDate(next.getDate() + daysUntilTarget);
    return next.toISOString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mathematics, Physics, History"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pendingLessons">Number of Pending Lessons</Label>
            <Input
              id="pendingLessons"
              type="number"
              min="0"
              value={pendingLessons}
              onChange={(e) => setPendingLessons(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Unfinished lessons that are already available
            </p>
          </div>

          <div className="space-y-2">
            <Label>Lesson Release Schedule</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={releaseDay} onValueChange={setReleaseDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="time"
                value={releaseTime}
                onChange={(e) => setReleaseTime(e.target.value)}
                placeholder="Select time"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              When new lessons will be automatically released
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
