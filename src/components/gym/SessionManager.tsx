import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateSessionDialog } from "./CreateSessionDialog";
import { SessionDetailDialog } from "./SessionDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SessionManagerProps {
  exercises: any[];
}

export function SessionManager({ exercises }: SessionManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { toast } = useToast();

  const { data: sessions, refetch } = useQuery({
    queryKey: ['gym-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('gym_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_index', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const currentSession = sessions?.find(s => s.status === 'planned');
  const nextSessionIndex = sessions && sessions.length > 0 
    ? Math.max(...sessions.map(s => s.session_index)) + 1 
    : 1;

  const handleStartSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If there's a planned session, use it
      if (currentSession) {
        setSelectedSession(currentSession);
        setCreateOpen(false);
        return;
      }

      // Create a new session
      const { data, error } = await supabase
        .from('gym_sessions')
        .insert({
          user_id: user.id,
          session_index: nextSessionIndex,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: `Session ${nextSessionIndex} started` });
      refetch();
      setSelectedSession(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCompleteSession = async (sessionId: string, sessionIndex: number) => {
    try {
      const { error } = await supabase
        .from('gym_sessions')
        .update({ status: 'completed', scheduled_date: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session completed",
        description: `Session ${sessionIndex} marked as complete.`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSkipSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a skipped session
      const { error } = await supabase
        .from('gym_sessions')
        .insert({
          user_id: user.id,
          session_index: nextSessionIndex,
          status: 'skipped',
        });

      if (error) throw error;

      toast({
        title: "Session skipped",
        description: `Session ${nextSessionIndex} marked as skipped for continuity.`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">In Progress</Badge>;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Training Sessions</h2>
          <p className="text-muted-foreground">
            {currentSession 
              ? `Session ${currentSession.session_index} in progress`
              : `Ready for Session ${nextSessionIndex}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSkipSession} 
            variant="outline"
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Skip Day
          </Button>
          <Button 
            onClick={handleStartSession} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {currentSession ? 'Continue Session' : 'Start Training'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {sessions?.map((session) => (
          <Card 
            key={session.id} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => session.status !== 'skipped' && setSelectedSession(session)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">
                      Session {session.session_index}
                      {session.status === 'skipped' && ' (Skipped)'}
                    </h3>
                    {session.scheduled_date && session.status !== 'skipped' && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduled_date), 'PPP')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(session.status)}
                {session.status === 'planned' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteSession(session.id, session.session_index);
                    }}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No training sessions yet</p>
            <p className="text-sm">Click "Start Training" to begin Session 1</p>
          </div>
        )}
      </div>

      <SessionDetailDialog
        session={selectedSession}
        exercises={exercises}
        open={!!selectedSession && selectedSession.status !== 'skipped'}
        onOpenChange={(open) => !open && setSelectedSession(null)}
        onUpdate={refetch}
      />
    </>
  );
}
