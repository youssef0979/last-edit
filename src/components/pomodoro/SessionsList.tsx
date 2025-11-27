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
        .limit(20);

      if (error) throw error;

      // Group sessions by name and aggregate
      const sessionMap = new Map<string, Session>();
      
      data?.forEach((session) => {
        const key = session.session_name || `Unnamed-${session.id}`;
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            id: session.id,
            session_name: session.session_name,
            session_type: session.session_type,
            preset_name: session.preset_name,
            duration_minutes: session.duration_minutes,
            status: session.status,
            cover_image_url: session.cover_image_url,
            completed_at: session.completed_at,
            work_segments: session.work_segments || 0,
            break_segments: session.break_segments || 0,
            timer_mode: session.timer_mode || "normal",
          });
        } else {
          // Aggregate duration and segments for same session
          const existing = sessionMap.get(key)!;
          existing.duration_minutes += session.duration_minutes;
          existing.work_segments += session.work_segments || 0;
          existing.break_segments += session.break_segments || 0;
        }
      });

      setSessions(Array.from(sessionMap.values()));
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
        <h2 className="text-2xl font-bold">My Focus Sessions</h2>
        <p className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
