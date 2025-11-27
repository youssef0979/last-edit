import { X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "./ProgressRing";
import { useNavigate } from "react-router-dom";

interface MiniTimerWidgetProps {
  timeLeft: number;
  totalTime: number;
  isWork: boolean;
  sessionName: string;
  onClose: () => void;
}

export const MiniTimerWidget = ({
  timeLeft,
  totalTime,
  isWork,
  sessionName,
  onClose
}: MiniTimerWidgetProps) => {
  const navigate = useNavigate();
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <Card className="fixed bottom-6 right-6 p-4 shadow-2xl border-2 z-50 bg-card/95 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <ProgressRing progress={progress} size={80} strokeWidth={6} />
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {sessionName || "Pomodoro"}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <p className="text-xs text-muted-foreground">
            {isWork ? "Work Session" : "Break Time"}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6"
            onClick={() => navigate("/pomodoro")}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
