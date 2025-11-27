import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, Settings2 } from "lucide-react";
import { format } from "date-fns";

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

interface SessionCardProps {
  session: Session;
  onRestart?: (session: Session) => void;
  onDuplicate?: (session: Session) => void;
  onModify?: (session: Session) => void;
}

export const SessionCard = ({ 
  session, 
  onRestart, 
  onDuplicate, 
  onModify 
}: SessionCardProps) => {
  const totalSegments = session.work_segments + session.break_segments;
  const workPercentage = totalSegments > 0 
    ? Math.round((session.work_segments / totalSegments) * 100) 
    : 0;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
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
              <h3 className="font-semibold truncate">
                {session.session_name || "Untitled Session"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {session.preset_name} • {session.duration_minutes} min
              </p>
            </div>
            
            <Badge variant={session.status === "completed" ? "default" : "secondary"}>
              {session.status}
            </Badge>
          </div>

          {/* Session Breakdown */}
          {totalSegments > 0 && (
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Work: {session.work_segments}</span>
                <span>•</span>
                <span>Break: {session.break_segments}</span>
                <span>•</span>
                <span>{workPercentage}% productive</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${workPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {session.timer_mode}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(session.completed_at), "MMM d, h:mm a")}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1">
              {onRestart && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onRestart(session)}
                  title="Restart this session"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              {onDuplicate && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onDuplicate(session)}
                  title="Duplicate this session"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {onModify && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onModify(session)}
                  title="Modify preset"
                >
                  <Settings2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
