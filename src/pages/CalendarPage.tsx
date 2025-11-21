import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarView } from "@/components/calendar/CalendarView";
import { AddNoteDialog } from "@/components/calendar/AddNoteDialog";
import { NoteCard } from "@/components/calendar/NoteCard";
import { PreviousNotesDialog } from "@/components/calendar/PreviousNotesDialog";

interface CalendarNote {
  id: string;
  date: string;
  title: string;
  content?: string;
  color: string;
  reminder_time?: string;
}

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calendar_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading notes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const getNotesForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return notes.filter(note => note.date === dateStr);
  };

  const selectedDateNotes = getNotesForDate(selectedDate);
  const totalNotes = notes.length;
  const upcomingReminders = notes.filter(n => 
    n.reminder_time && new Date(n.reminder_time) > new Date()
  ).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary p-2">
            <CalendarIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Organize your notes and reminders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PreviousNotesDialog />
          {selectedDate && (
            <AddNoteDialog date={selectedDate} onNoteAdded={loadNotes} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <StickyNote className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalNotes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Notes</CardTitle>
            <CalendarIcon className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{selectedDateNotes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "No date selected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
            <CalendarIcon className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingReminders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      <CalendarView
        currentMonth={currentMonth}
        notes={notes}
        selectedDate={selectedDate}
        onMonthChange={setCurrentMonth}
        onDateSelect={setSelectedDate}
      />

      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notes for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                <CardDescription>
                  {selectedDateNotes.length === 0 ? "No notes for this day" : `${selectedDateNotes.length} note${selectedDateNotes.length !== 1 ? 's' : ''}`}
                </CardDescription>
              </div>
              <AddNoteDialog date={selectedDate} onNoteAdded={loadNotes} />
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notes for this day yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateNotes.map(note => (
                  <NoteCard key={note.id} note={note} onDelete={loadNotes} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarPage;
