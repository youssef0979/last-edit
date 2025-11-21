import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { NoteCard } from "./NoteCard";

interface Note {
  id: string;
  date: string;
  title: string;
  content?: string;
  color: string;
  reminder_time?: string;
}

export function PreviousNotesDialog() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPreviousNotes = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("calendar_notes")
        .select("*")
        .eq("user_id", user.id)
        .lt("date", today)
        .order("date", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotes(data || []);
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

  useEffect(() => {
    if (open) {
      loadPreviousNotes();
    }
  }, [open]);

  const groupNotesByMonth = (notes: Note[]) => {
    const grouped: Record<string, Note[]> = {};
    
    notes.forEach(note => {
      const monthKey = format(new Date(note.date), "MMMM yyyy");
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(note);
    });
    
    return grouped;
  };

  const groupedNotes = groupNotesByMonth(notes);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Previous Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Previous Notes</DialogTitle>
          <DialogDescription>
            View your past calendar notes
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No previous notes found
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotes).map(([month, monthNotes]) => (
              <div key={month}>
                <h3 className="text-lg font-semibold mb-3">{month}</h3>
                <div className="space-y-2">
                  {monthNotes.map(note => (
                    <div key={note.id} className="flex items-start gap-2">
                      <div className="text-sm text-muted-foreground min-w-16">
                        {format(new Date(note.date), "MMM d")}
                      </div>
                      <div className="flex-1">
                        <NoteCard note={note} onDelete={loadPreviousNotes} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
