import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PomodoroPresetSelector } from "./PomodoroPresetSelector";
import { SessionHistory } from "./SessionHistory";

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
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset>(PRESETS[0]);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [autoStart, setAutoStart] = useState(true);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    // Initialize notification audio
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Play audio notification
    audioRef.current?.play().catch(console.error);

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(
        isWork ? "Work session complete!" : "Break session complete!",
        {
          body: isWork 
            ? "Time for a break! Great work!" 
            : "Break's over! Ready to focus again?",
          icon: "/favicon.ico",
        }
      );
    }

    // Save session to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("pomodoro_sessions").insert({
          user_id: user.id,
          session_type: isWork ? "work" : "break",
          preset_name: selectedPreset.name,
          duration_minutes: isWork ? selectedPreset.work : selectedPreset.break,
        });
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }

    toast({
      title: isWork ? "Work session complete!" : "Break complete!",
      description: isWork 
        ? `Time for a ${selectedPreset.break} minute break` 
        : "Ready for another work session?",
    });

    // Handle sequence progression
    if (isWork) {
      // Switch to break
      setIsWork(false);
      setTimeLeft(selectedPreset.break * 60);
      if (autoStart) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      // Sequence complete - both work and break done
      setSequenceComplete(true);
      setIsWork(true);
      setTimeLeft(selectedPreset.work * 60);
    }
  };

  const handleStart = () => {
    if (sequenceComplete) {
      setSequenceComplete(false);
    }
    setIsRunning(true);
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsWork(true);
    setSequenceComplete(false);
    setTimeLeft(selectedPreset.work * 60);
  };

  const handlePresetChange = (preset: PomodoroPreset) => {
    handleReset();
    setSelectedPreset(preset);
    setTimeLeft(preset.work * 60);
  };

  const handleRestartSequence = () => {
    setSequenceComplete(false);
    setIsWork(true);
    setTimeLeft(selectedPreset.work * 60);
    setIsRunning(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = isWork ? selectedPreset.work * 60 : selectedPreset.break * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-card border-border shadow-lg">
        <div className="space-y-6">
          {/* Preset Selector */}
          <PomodoroPresetSelector
            presets={PRESETS}
            selectedPreset={selectedPreset}
            onPresetChange={handlePresetChange}
            disabled={isRunning}
          />

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-accent/20 border border-accent">
              <p className="text-sm font-medium text-muted-foreground">
                {isWork ? "Work Session" : "Break Time"} • {selectedPreset.label}
              </p>
            </div>
            
            <div className="text-8xl font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            <Progress value={progress} className="h-3" />
          </div>

          {/* Sequence Complete UI */}
          {sequenceComplete && !isRunning && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent space-y-3">
              <p className="text-center text-sm font-medium">Sequence Complete! What's next?</p>
              <div className="flex gap-2">
                <Button onClick={handleRestartSequence} className="flex-1">
                  Restart Same Preset
                </Button>
                <Button onClick={() => setSequenceComplete(false)} variant="outline" className="flex-1">
                  Choose Different Preset
                </Button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button size="lg" onClick={handleStart} className="gap-2">
                <Play className="w-5 h-5" />
                Start
              </Button>
            ) : (
              <Button size="lg" onClick={handlePause} variant="secondary" className="gap-2">
                <Pause className="w-5 h-5" />
                Pause
              </Button>
            )}
            <Button size="lg" onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-5 h-5" />
              Reset
            </Button>
          </div>

          {/* Auto-continue Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="auto-start" className="cursor-pointer">
              Auto-continue to next session
            </Label>
            <Switch
              id="auto-start"
              checked={autoStart}
              onCheckedChange={setAutoStart}
            />
          </div>
        </div>
      </Card>

      {/* Session History */}
      <SessionHistory />
    </div>
  );
};
