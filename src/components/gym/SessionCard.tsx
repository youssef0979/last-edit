import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  session: any;
  onSelect: (session: any) => void;
  onComplete: (sessionId: string, sessionIndex: number) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

export function SessionCard({ session, onSelect, onComplete, getStatusBadge }: SessionCardProps) {
  const { data: sessionSets } = useQuery({
    queryKey: ['session-summary', session.id],
    enabled: session.status !== 'skipped',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('set_entries')
        .select('exercise_id')
        .eq('session_id', session.id);
      
      if (error) throw error;
      
      const exerciseIds = new Set(data.map(s => s.exercise_id));
      return {
        totalSets: data.length,
        uniqueExercises: exerciseIds.size
      };
    }
  });

  return (
    <Card 
      className={cn(
        "p-4 transition-shadow",
        session.status === 'skipped' 
          ? "opacity-60 cursor-not-allowed bg-muted/30" 
          : "hover:shadow-md cursor-pointer"
      )}
      onClick={() => session.status !== 'skipped' && onSelect(session)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {session.status === 'skipped' ? (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Calendar className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-semibold">
                Session {session.session_index}
                {session.status === 'skipped' && (
                  <span className="text-muted-foreground font-normal"> - Skipped</span>
                )}
              </h3>
              {session.scheduled_date && session.status !== 'skipped' && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.scheduled_date), 'PPP')}
                </p>
              )}
              {session.status === 'skipped' && (
                <p className="text-xs text-muted-foreground">
                  Session maintained in numbering sequence
                </p>
              )}
              {sessionSets && session.status !== 'skipped' && (
                <p className="text-xs text-muted-foreground">
                  {sessionSets.totalSets} sets • {sessionSets.uniqueExercises} exercises
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
                onComplete(session.id, session.session_index);
              }}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
