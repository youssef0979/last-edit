import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Link2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface SessionCardProps {
  session: Session;
  onDelete?: () => void;
}

export const SessionCard = ({ session, onDelete }: SessionCardProps) => {
  const { toast } = useToast();
  
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("pomodoro_sessions")
        .delete()
        .eq("id", session.id);

      if (error) throw error;

      toast({
        title: "Session deleted",
        description: "The session has been removed from your history.",
      });

      onDelete?.();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    }
  };
  const totalSegments = session.work_segments + session.break_segments;
  const workPercentage = totalSegments > 0 
    ? Math.round((session.work_segments / totalSegments) * 100) 
    : 0;
  
  const isLinkedToPerformance = !!session.linked_performance_habit_id;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow relative group">
      <div className="flex gap-4">
        {session.cover_image_url && (
          <img
            src={session.cover_image_url}
            alt={session.session_name || "Session"}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">
                  {session.session_name || "Untitled Session"}
                </h3>
                {isLinkedToPerformance && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Link2 className="h-3 w-3" />
                    Performance
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {session.preset_name} • {session.duration_minutes} min • {session.session_type}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                {session.status}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Session Breakdown */}
          {totalSegments > 0 ? (
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Work: {session.work_segments} segments</span>
                <span>•</span>
                <span>Break: {session.break_segments} segments</span>
                <span>•</span>
                <span className="font-medium text-foreground">{workPercentage}% productive</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                  style={{ width: `${workPercentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                Single {session.session_type} session
              </Badge>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {format(new Date(session.completed_at), "MMM d, h:mm a")}
          </div>
        </div>
      </div>
    </Card>
  );
};
