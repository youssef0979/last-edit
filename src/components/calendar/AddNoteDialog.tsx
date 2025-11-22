import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { calendarNoteSchema } from "@/lib/validations";
import { handleError } from "@/lib/error-handler";

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

interface AddNoteDialogProps {
  date: Date;
  existingNote?: {
    id: string;
    title: string;
    content?: string;
    color: string;
    reminder_time?: string;
  };
  onNoteAdded: () => void;
  triggerButton?: React.ReactNode;
}

export function AddNoteDialog({ date, existingNote, onNoteAdded, triggerButton }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(existingNote?.title || "");
  const [content, setContent] = useState(existingNote?.content || "");
  const [color, setColor] = useState(existingNote?.color || PRESET_COLORS[0]);
  const [reminderTime, setReminderTime] = useState(
    existingNote?.reminder_time ? format(new Date(existingNote.reminder_time), "yyyy-MM-dd'T'HH:mm") : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs with zod
    const validationResult = calendarNoteSchema.safeParse({
      title: title,
      content: content || undefined,
      color: color,
      reminder_time: reminderTime ? new Date(reminderTime).toISOString() : null,
    });

    if (!validationResult.success) {
      toast({
        title: "Validation error",
        description: validationResult.error.errors[0].message,
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

      const noteData = {
        user_id: user.id,
        date: format(date, "yyyy-MM-dd"),
        title: validationResult.data.title,
        content: validationResult.data.content || null,
        color: validationResult.data.color,
        reminder_time: validationResult.data.reminder_time,
      };

      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from("calendar_notes")
          .update(noteData)
          .eq("id", existingNote.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Note updated successfully",
        });
      } else {
        // Create new note
        const { error } = await supabase
          .from("calendar_notes")
          .insert(noteData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Note added successfully",
        });
      }

      setTitle("");
      setContent("");
      setColor(PRESET_COLORS[0]);
      setReminderTime("");
      setOpen(false);
      onNoteAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: handleError(error, "database"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingNote ? "Edit" : "Add"} Note for {format(date, "MMM d, yyyy")}</DialogTitle>
          <DialogDescription>
            Add a note or reminder for this day
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Doctor's appointment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Description (Optional)</Label>
            <Textarea
              id="content"
              placeholder="Add more details about this note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={`h-12 rounded-lg transition-all ${
                    color === presetColor
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder">Reminder Time (Optional)</Label>
            <Input
              id="reminder"
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : existingNote ? "Update Note" : "Add Note"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
