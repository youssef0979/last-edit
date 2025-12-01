import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  currentLessonCount: number;
  onLessonCreated: () => void;
}

export function AddLessonDialog({
  open,
  onOpenChange,
  subjectId,
  currentLessonCount,
  onLessonCreated,
}: AddLessonDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const lessonNumber = currentLessonCount + 1;
    const lessonTitle = title.trim() || `Lesson ${lessonNumber}`;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("study_lessons").insert({
        subject_id: subjectId,
        user_id: user.id,
        title: lessonTitle,
        lesson_number: lessonNumber,
        status: "pending",
        released_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update pending_lessons count
      await supabase
        .from("study_subjects")
        .update({ pending_lessons: lessonNumber })
        .eq("id", subjectId);

      toast({ title: "Lesson added!" });
      setTitle("");
      onOpenChange(false);
      onLessonCreated();
    } catch (error: any) {
      toast({
        title: "Error adding lesson",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Lesson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={`Lesson ${currentLessonCount + 1}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default title
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Lesson
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
