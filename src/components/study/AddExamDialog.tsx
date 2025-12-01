import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  onExamCreated: () => void;
}

export function AddExamDialog({
  open,
  onOpenChange,
  subjectId,
  onExamCreated,
}: AddExamDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [topics, setTopics] = useState("");
  const [importance, setImportance] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examDate) {
      toast({
        title: "Date required",
        description: "Please select an exam date.",
        variant: "destructive",
      });
      return;
    }

    if (!topics.trim()) {
      toast({
        title: "Topics required",
        description: "Please enter the material/topics for the exam.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("study_exams").insert({
        subject_id: subjectId,
        user_id: user.id,
        exam_date: examDate,
        topics: topics.trim(),
        importance,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Exam added",
        description: "Your exam has been added successfully.",
      });

      // Reset form
      setExamDate("");
      setTopics("");
      setImportance("medium");
      setNotes("");
      onExamCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error adding exam",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Exam</DialogTitle>
          <DialogDescription>
            Schedule a new exam for this subject.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="examDate">Exam Date</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topics">Material / Topics</Label>
              <Textarea
                id="topics"
                placeholder="e.g. Chapters 1-5, Algebra, World War II..."
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance">Importance Level</Label>
              <Select value={importance} onValueChange={(v: "low" | "medium" | "high") => setImportance(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Preparation Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Study tips, resources, reminders..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Exam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}