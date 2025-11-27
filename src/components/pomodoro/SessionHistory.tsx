import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, Coffee } from "lucide-react";

interface Session {
  id: string;
  session_type: string;
  preset_name: string;
  duration_minutes: number;
  completed_at: string;
}

export const SessionHistory = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
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
        .limit(10);

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
        <p className="text-sm text-muted-foreground text-center">Loading history...</p>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">
          No sessions yet. Complete your first Pomodoro to see history!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-border"
          >
            <div className="flex items-center gap-3">
              {session.session_type === "work" ? (
                <Clock className="w-5 h-5 text-primary" />
              ) : (
                <Coffee className="w-5 h-5 text-secondary" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {session.session_type === "work" ? "Work" : "Break"} • {session.preset_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.duration_minutes} minutes
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(session.completed_at), "MMM d, h:mm a")}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};
