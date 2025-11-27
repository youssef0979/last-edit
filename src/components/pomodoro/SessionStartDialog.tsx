import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Upload, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PomodoroPreset {
  name: string;
  work: number;
  break: number;
  label: string;
}

interface PerformanceHabit {
  id: string;
  name: string;
  color: string;
}

interface SessionStartDialogProps {
  presets: PomodoroPreset[];
  onStart: (
    sessionName: string, 
    preset: PomodoroPreset, 
    coverUrl: string | null,
    linkedHabitId: string | null
  ) => void;
  children: React.ReactNode;
}

export const SessionStartDialog = ({ presets, onStart, children }: SessionStartDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset>(presets[0]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [linkToPerformance, setLinkToPerformance] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [performanceHabits, setPerformanceHabits] = useState<PerformanceHabit[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (linkToPerformance) {
      fetchPerformanceHabits();
    }
  }, [linkToPerformance]);

  const fetchPerformanceHabits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("performance_habits")
        .select("id, name, color")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setPerformanceHabits(data || []);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Cover image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStart = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please enter a name for this focus session",
        variant: "destructive",
      });
      return;
    }

    let coverUrl: string | null = null;

    if (coverImage) {
      setUploading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fileExt = coverImage.name.split('.').pop();
        const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pomodoro-covers')
          .upload(filePath, coverImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pomodoro-covers')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      } catch (error: any) {
        console.error("Error uploading cover:", error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onStart(
      sessionName, 
      selectedPreset, 
      coverUrl,
      linkToPerformance ? selectedHabitId : null
    );
    setOpen(false);
    setSessionName("");
    setCoverImage(null);
    setCoverPreview(null);
    setLinkToPerformance(false);
    setSelectedHabitId(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start New Focus Session</DialogTitle>
          <DialogDescription>
            Choose a preset, name your session, and optionally add a cover image
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name *</Label>
            <Input
              id="session-name"
              placeholder="e.g., Project Review, Study Session, Deep Work..."
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Preset Selection */}
          <div className="space-y-2">
            <Label>Select Preset *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presets.map((preset) => (
                <Card
                  key={preset.name}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md",
                    selectedPreset.name === preset.name
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-accent"
                  )}
                  onClick={() => setSelectedPreset(preset)}
                >
                  <div className="text-center space-y-1">
                    <p className="text-xl font-bold">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="cover-image">Cover Image (Optional)</Label>
            <div className="flex items-center gap-4">
              {coverPreview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label htmlFor="cover-image" className="cursor-pointer">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Upload Image</p>
                  </div>
                  <input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Max size: 5MB</p>
                <p>Recommended: 800x600px</p>
              </div>
            </div>
          </div>

          {/* Performance Tracker Integration */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="link-performance" className="text-sm font-medium">
                  Link to Performance Tracker
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Track this session's completion in your Performance Tracker
                </p>
              </div>
              <Switch
                id="link-performance"
                checked={linkToPerformance}
                onCheckedChange={setLinkToPerformance}
              />
            </div>

            {linkToPerformance && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="habit-select" className="text-sm">Select Habit</Label>
                <Select value={selectedHabitId || ""} onValueChange={setSelectedHabitId}>
                  <SelectTrigger id="habit-select">
                    <SelectValue placeholder="Choose a performance habit" />
                  </SelectTrigger>
                  <SelectContent>
                    {performanceHabits.map((habit) => (
                      <SelectItem key={habit.id} value={habit.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: habit.color }}
                          />
                          {habit.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={
              uploading || 
              !sessionName.trim() || 
              (linkToPerformance && !selectedHabitId)
            }
            className="w-full gap-2"
            size="lg"
          >
            <Play className="w-5 h-5" />
            {uploading ? "Uploading..." : "Start Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
