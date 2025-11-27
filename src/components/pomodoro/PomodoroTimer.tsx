import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Minimize2 } from "lucide-react";
import { PomodoroPresetSelector } from "./PomodoroPresetSelector";
import { SessionHistory } from "./SessionHistory";
import { SessionStartDialog } from "./SessionStartDialog";
import { ProgressRing } from "./ProgressRing";
import { usePomodoroContext } from "@/contexts/PomodoroContext";

interface PomodoroPreset {
  name: string;
  work: number;
  break: number;
  label: string;
}

const PRESETS: PomodoroPreset[] = [
  { name: "25+5", work: 25, break: 5, label: "Classic" },
  { name: "50+10", work: 50, break: 10, label: "Extended" },
  { name: "15+3", work: 15, break: 3, label: "Quick" },
  { name: "90+15", work: 90, break: 15, label: "Deep Work" },
];

export const PomodoroTimer = () => {
  const {
    isRunning,
    timeLeft,
    totalTime,
    isWork,
    sessionName,
    sessionActive,
    showMiniWidget,
    setShowMiniWidget,
    startSession,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = usePomodoroContext();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="space-y-6">
      {!sessionActive ? (
        <Card className="p-8 bg-card border-border shadow-lg">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Focus?</h2>
              <p className="text-muted-foreground">Start a new session to begin tracking your productivity</p>
            </div>
            <SessionStartDialog presets={PRESETS} onStart={startSession}>
              <Button size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Start New Session
              </Button>
            </SessionStartDialog>
          </div>
        </Card>
      ) : (
        <Card className="p-8 bg-card border-border shadow-lg">
          <div className="space-y-6">
            {/* Session Info */}
            {sessionName && (
              <div className="text-center pb-4 border-b border-border">
                <h3 className="text-lg font-semibold">{sessionName}</h3>
              </div>
            )}

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-accent/20 border border-accent">
              <p className="text-sm font-medium text-muted-foreground">
                {isWork ? "Work Session" : "Break Time"}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-8">
              <ProgressRing progress={progress} size={150} strokeWidth={10} showPercentage />
              <div className="text-7xl font-bold text-foreground tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </div>

            <Progress value={progress} className="h-3" />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button size="lg" onClick={resumeTimer} className="gap-2">
                <Play className="w-5 h-5" />
                Start
              </Button>
            ) : (
              <Button size="lg" onClick={pauseTimer} variant="secondary" className="gap-2">
                <Pause className="w-5 h-5" />
                Pause
              </Button>
            )}
            <Button size="lg" onClick={resetTimer} variant="outline" className="gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset
            </Button>
            {isRunning && !showMiniWidget && (
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowMiniWidget(true)}
              >
                <Minimize2 className="w-5 h-5" />
                Minimize
              </Button>
            )}
          </div>
        </div>
      </Card>
      )}

      {/* Session History */}
      <SessionHistory />
    </div>
  );
};
