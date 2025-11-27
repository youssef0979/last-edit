import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Volume2, Focus, Bell, BellOff, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PomodoroPresetSelector } from "./PomodoroPresetSelector";
import { SessionHistory } from "./SessionHistory";
import { SessionStartDialog } from "./SessionStartDialog";
import { ProgressRing } from "./ProgressRing";
import { MiniTimerWidget } from "./MiniTimerWidget";

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

type TimerMode = "normal" | "focus" | "silent";

export const PomodoroTimer = () => {
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset>(PRESETS[0]);
  const [sessionName, setSessionName] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [linkedHabitId, setLinkedHabitId] = useState<string | null>(null);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [autoStart, setAutoStart] = useState(true);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [timerMode, setTimerMode] = useState<TimerMode>("normal");
  const [workSegments, setWorkSegments] = useState(0);
  const [breakSegments, setBreakSegments] = useState(0);
  const [showMiniWidget, setShowMiniWidget] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  // Load persisted state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const timePassed = Math.floor((Date.now() - state.lastUpdate) / 1000);
        
        if (state.isRunning && state.timeLeft > 0) {
          const newTimeLeft = Math.max(0, state.timeLeft - timePassed);
          setTimeLeft(newTimeLeft);
          setIsRunning(newTimeLeft > 0);
          setSessionName(state.sessionName);
          setCoverImageUrl(state.coverImageUrl);
          setIsWork(state.isWork);
          setSessionActive(state.sessionActive);
          setSequenceComplete(state.sequenceComplete);
          setAutoStart(state.autoStart);
          
          const preset = PRESETS.find(p => p.name === state.presetName) || PRESETS[0];
          setSelectedPreset(preset);
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (sessionActive) {
      const state = {
        timeLeft,
        isRunning,
        sessionName,
        coverImageUrl,
        isWork,
        sessionActive,
        sequenceComplete,
        autoStart,
        presetName: selectedPreset.name,
        lastUpdate: Date.now(),
      };
      localStorage.setItem('pomodoroState', JSON.stringify(state));
    }
  }, [timeLeft, isRunning, sessionName, coverImageUrl, isWork, sessionActive, sequenceComplete, autoStart, selectedPreset]);

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
    
    // Update segment counters
    if (isWork) {
      setWorkSegments(prev => prev + 1);
    } else {
      setBreakSegments(prev => prev + 1);
    }
    
    // Play audio notification (unless silent mode)
    if (timerMode !== "silent") {
      audioRef.current?.play().catch(console.error);
    }

    // Show browser notification (unless focus mode)
    if (timerMode !== "focus" && "Notification" in window && Notification.permission === "granted") {
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
          session_name: sessionName,
          cover_image_url: coverImageUrl,
          session_type: isWork ? "work" : "break",
          preset_name: selectedPreset.name,
          duration_minutes: isWork ? selectedPreset.work : selectedPreset.break,
          status: "completed",
          timer_mode: timerMode,
          work_segments: isWork ? workSegments + 1 : workSegments,
          break_segments: !isWork ? breakSegments + 1 : breakSegments,
          linked_performance_habit_id: linkedHabitId,
        });

        // Update performance tracker if linked
        if (linkedHabitId && isWork) {
          const today = new Date().toISOString().split('T')[0];
          await supabase.from("performance_scores").upsert({
            user_id: user.id,
            performance_habit_id: linkedHabitId,
            date: today,
            score: 10, // Full score for completed Pomodoro
          }, {
            onConflict: 'user_id,performance_habit_id,date'
          });
        }
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }

    if (timerMode !== "focus") {
      toast({
        title: isWork ? "Work session complete!" : "Break complete!",
        description: isWork 
          ? `Time for a ${selectedPreset.break} minute break` 
          : "Ready for another work session?",
      });
    }

    // Handle sequence progression
    if (isWork) {
      setIsWork(false);
      setTimeLeft(selectedPreset.break * 60);
      if (autoStart) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      setSequenceComplete(true);
      setIsWork(true);
      setTimeLeft(selectedPreset.work * 60);
    }
  };

  const handleSessionStart = (
    name: string, 
    preset: PomodoroPreset, 
    coverUrl: string | null,
    habitId: string | null
  ) => {
    setSessionName(name);
    setSelectedPreset(preset);
    setCoverImageUrl(coverUrl);
    setLinkedHabitId(habitId);
    setTimeLeft(preset.work * 60);
    setSessionActive(true);
    setIsWork(true);
    setSequenceComplete(false);
    setWorkSegments(0);
    setBreakSegments(0);
    setIsRunning(true);
    
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
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
    setSessionActive(false);
    setSessionName("");
    setCoverImageUrl(null);
    setLinkedHabitId(null);
    setWorkSegments(0);
    setBreakSegments(0);
    localStorage.removeItem('pomodoroState');
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
    localStorage.removeItem('pomodoroState');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalTime = isWork ? selectedPreset.work * 60 : selectedPreset.break * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const timerModeIcons = {
    normal: <Bell className="w-4 h-4" />,
    focus: <Focus className="w-4 h-4" />,
    silent: <BellOff className="w-4 h-4" />
  };

  return (
    <div className="space-y-6">
      {/* Mini Widget */}
      {showMiniWidget && sessionActive && isRunning && (
        <MiniTimerWidget
          timeLeft={timeLeft}
          totalTime={isWork ? selectedPreset.work * 60 : selectedPreset.break * 60}
          isWork={isWork}
          sessionName={sessionName}
          onClose={() => setShowMiniWidget(false)}
        />
      )}

      {!sessionActive ? (
        <Card className="p-8 bg-card border-border shadow-lg">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Focus?</h2>
              <p className="text-muted-foreground">Start a new session to begin tracking your productivity</p>
            </div>
            <SessionStartDialog presets={PRESETS} onStart={handleSessionStart}>
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
                <p className="text-sm text-muted-foreground">{selectedPreset.label} Session</p>
              </div>
            )}

            {/* Preset Selector */}
            <PomodoroPresetSelector
              presets={PRESETS}
              selectedPreset={selectedPreset}
              onPresetChange={handlePresetChange}
              disabled={isRunning}
            />

          {/* Timer Mode Selector */}
          <div className="flex items-center justify-center gap-2">
            {(["normal", "focus", "silent"] as TimerMode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={timerMode === mode ? "default" : "outline"}
                onClick={() => setTimerMode(mode)}
                className="gap-2 capitalize"
              >
                {timerModeIcons[mode]}
                {mode}
              </Button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-accent/20 border border-accent">
              <p className="text-sm font-medium text-muted-foreground">
                {isWork ? "Work Session" : "Break Time"} • {selectedPreset.label}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-8">
              <ProgressRing progress={progress} size={150} strokeWidth={10} />
              <div className="text-7xl font-bold text-foreground tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </div>

            <Progress value={progress} className="h-3" />

            {/* Session Breakdown */}
            {(workSegments > 0 || breakSegments > 0) && (
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary">Work: {workSegments}</Badge>
                <Badge variant="outline">Break: {breakSegments}</Badge>
              </div>
            )}
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
      )}

      {/* Session History */}
      <SessionHistory />
    </div>
  );
};
