import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionCard } from "./SessionCard";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: string;
  session_name: string | null;
  cover_image_url: string | null;
  session_type: string;
  preset_name: string;
  duration_minutes: number;
  status: string;
  completed_at: string;
  work_segments: number;
  break_segments: number;
  timer_mode: string;
  linked_performance_habit_id: string | null;
}

export const SessionsList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    
    // Set up real-time subscription for new sessions
    const channel = supabase
      .channel('pomodoro_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pomodoro_sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">My Focus Sessions</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-8">
        <p className="text-center text-muted-foreground">
          No sessions yet. Start your first Pomodoro session to see it here!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Session History</h2>
        <p className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
        </p>
      </div>
      
      <div className="grid gap-3">
        {sessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session}
            onDelete={fetchSessions}
          />
        ))}
      </div>
    </div>
  );
};
