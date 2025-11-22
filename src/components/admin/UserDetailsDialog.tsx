import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserDetailsDialogProps {
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    roles?: string[];
  };
  open: boolean;
  onClose: () => void;
}

export function UserDetailsDialog({ user, open, onClose }: UserDetailsDialogProps) {
  const { toast } = useToast();
  const [habits, setHabits] = useState<any[]>([]);
  const [performanceHabits, setPerformanceHabits] = useState<any[]>([]);
  const [sleepEntries, setSleepEntries] = useState<any[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open, user.id]);

  const loadUserData = async () => {
    try {
      const [habitsRes, perfRes, sleepRes, calendarRes] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("performance_habits").select("*").eq("user_id", user.id),
        supabase.from("sleep_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(10),
        supabase.from("calendar_notes").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(10)
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (perfRes.error) throw perfRes.error;
      if (sleepRes.error) throw sleepRes.error;
      if (calendarRes.error) throw calendarRes.error;

      setHabits(habitsRes.data || []);
      setPerformanceHabits(perfRes.data || []);
      setSleepEntries(sleepRes.data || []);
      setCalendarNotes(calendarRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading user data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTrackerData = async (tracker: string) => {
    try {
      const { data: { user: admin } } = await supabase.auth.getUser();

      await supabase.from("admin_actions").insert({
        admin_id: admin?.id,
        action_type: "reset_tracker",
        target_user_id: user.id,
        target_table: tracker,
        details: { timestamp: new Date().toISOString() }
      });

      switch (tracker) {
        case "habits":
          await supabase.from("habits").delete().eq("user_id", user.id);
          await supabase.from("habit_completions").delete().eq("user_id", user.id);
          await supabase.from("habit_notes").delete().eq("user_id", user.id);
          break;
        case "performance":
          await supabase.from("performance_habits").delete().eq("user_id", user.id);
          await supabase.from("performance_scores").delete().eq("user_id", user.id);
          break;
        case "sleep":
          await supabase.from("sleep_entries").delete().eq("user_id", user.id);
          break;
        case "calendar":
          await supabase.from("calendar_notes").delete().eq("user_id", user.id);
          break;
      }

      toast({
        title: "Data reset",
        description: `${tracker} data has been cleared.`
      });

      loadUserData();
    } catch (error: any) {
      toast({
        title: "Error resetting data",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{user.full_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{user.full_name || "No name"}</h3>
              <p className="text-muted-foreground">
                {user.username ? `@${user.username}` : "No username"}
              </p>
              <div className="flex gap-2 mt-2">
                {user.roles?.map(role => (
                  <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{user.bio}</p>
            </div>
          )}

          {/* Data Tabs */}
          <Tabs defaultValue="habits" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="habits">Habits</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="sleep">Sleep</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="habits" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Habit Tracker Data</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => resetTrackerData("habits")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Habits
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border p-4">
                {habits.length === 0 ? (
                  <p className="text-muted-foreground">No habits found</p>
                ) : (
                  <div className="space-y-2">
                    {habits.map(habit => (
                      <div key={habit.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span>{habit.name}</span>
                        {!habit.is_active && <Badge variant="outline">Inactive</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Performance Tracker Data</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => resetTrackerData("performance")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Performance
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border p-4">
                {performanceHabits.length === 0 ? (
                  <p className="text-muted-foreground">No performance habits found</p>
                ) : (
                  <div className="space-y-2">
                    {performanceHabits.map(habit => (
                      <div key={habit.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span>{habit.name}</span>
                        {!habit.is_active && <Badge variant="outline">Inactive</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sleep" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Sleep Tracker Data</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => resetTrackerData("sleep")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Sleep
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border p-4">
                {sleepEntries.length === 0 ? (
                  <p className="text-muted-foreground">No sleep entries found</p>
                ) : (
                  <div className="space-y-2">
                    {sleepEntries.map(entry => (
                      <div key={entry.id} className="p-2 bg-muted rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                          <span>{entry.hours_slept}h</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Mood: {entry.mood}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Calendar Notes</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => resetTrackerData("calendar")}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset Calendar
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border p-4">
                {calendarNotes.length === 0 ? (
                  <p className="text-muted-foreground">No calendar notes found</p>
                ) : (
                  <div className="space-y-2">
                    {calendarNotes.map(note => (
                      <div key={note.id} className="p-2 bg-muted rounded">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{note.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                        {note.content && (
                          <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
