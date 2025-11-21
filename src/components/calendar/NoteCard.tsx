import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AddNoteDialog } from "./AddNoteDialog";

interface NoteCardProps {
  note: {
    id: string;
    date: string;
    title: string;
    content?: string;
    color: string;
    reminder_time?: string;
  };
  onDelete: () => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("calendar_notes")
        .delete()
        .eq("id", note.id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Note deleted",
        description: `"${note.title}" has been removed permanently.`
      });
      
      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors" style={{ borderLeftWidth: '4px', borderLeftColor: note.color }}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{note.title}</h3>
            {note.content && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {note.reminder_time && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Bell className="h-3 w-3" />
                  {format(new Date(note.reminder_time), "MMM d, h:mm a")}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AddNoteDialog
              date={new Date(note.date)}
              existingNote={note}
              onNoteAdded={onDelete}
              triggerButton={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
