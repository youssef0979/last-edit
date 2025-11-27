import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Session {
  id: string;
  session_name: string | null;
  session_type: string;
  preset_name: string;
  duration_minutes: number;
  status: string;
  cover_image_url: string | null;
  completed_at: string;
}

export const SessionsList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

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
          });
        } else {
          // Aggregate duration for same session
          const existing = sessionMap.get(key)!;
          existing.duration_minutes += session.duration_minutes;
        }
      });

      setSessions(Array.from(sessionMap.values()));
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "ongoing":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "abandoned":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">My Focus Sessions</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">My Focus Sessions</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No sessions yet. Start your first focus session to see it here!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">My Focus Sessions</h3>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex gap-4 p-4 rounded-lg bg-accent/10 border border-border hover:border-accent transition-colors"
          >
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {session.cover_image_url ? (
                <img
                  src={session.cover_image_url}
                  alt={session.session_name || "Session"}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-sm truncate">
                  {session.session_name || "Unnamed Session"}
                </h4>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getStatusIcon(session.status)}
                  <span className="text-xs text-muted-foreground">
                    {getStatusLabel(session.status)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  {session.preset_name}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {session.duration_minutes} min
                </span>
                <span>•</span>
                <span>{format(new Date(session.completed_at), "MMM d, h:mm a")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
