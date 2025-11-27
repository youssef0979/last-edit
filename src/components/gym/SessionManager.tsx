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

  const handleSkipSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('gym_sessions')
        .update({ status: 'skipped' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session skipped",
        description: "This session has been marked as skipped.",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'skipped':
        return <XCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />;
    }
  };

  const nextSessionIndex = sessions && sessions.length > 0 
    ? Math.max(...sessions.map(s => s.session_index)) + 1 
    : 1;

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Training Sessions</h2>
          <p className="text-muted-foreground">Next session: Day {nextSessionIndex}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      <div className="grid gap-4">
        {sessions?.map((session) => (
          <Card 
            key={session.id} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedSession(session)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(session.status)}
                <div>
                  <h3 className="font-semibold">Day {session.session_index}</h3>
                  {session.scheduled_date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.scheduled_date), 'PPP')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={session.status === 'completed' ? 'default' : session.status === 'skipped' ? 'secondary' : 'outline'}>
                  {session.status}
                </Badge>
                {session.status === 'planned' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkipSession(session.id);
                    }}
                  >
                    Skip
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sessions yet. Create your first training session.</p>
          </div>
        )}
      </div>

      <CreateSessionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        exercises={exercises}
        nextSessionIndex={nextSessionIndex}
        onSuccess={refetch}
      />

      <SessionDetailDialog
        session={selectedSession}
        exercises={exercises}
        open={!!selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
        onUpdate={refetch}
      />
    </>
  );
}
