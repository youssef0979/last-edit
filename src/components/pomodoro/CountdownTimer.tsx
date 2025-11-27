import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CountdownTimer = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
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
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play audio notification
    audioRef.current?.play().catch(console.error);

    // Show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Timer Complete!", {
        body: "Your countdown has finished!",
        icon: "/favicon.ico",
      });
    }

    toast({
      title: "Timer Complete!",
      description: "Your countdown has finished.",
    });
  };

  const handleStart = () => {
    if (timeLeft === 0) {
      const total = hours * 3600 + minutes * 60 + seconds;
      if (total === 0) {
        toast({
          title: "Invalid Time",
          description: "Please set a time greater than 0",
          variant: "destructive",
        });
        return;
      }
      setTimeLeft(total);
      setTotalTime(total);
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
    setTimeLeft(0);
    setTotalTime(0);
  };

  const displayHours = Math.floor(timeLeft / 3600);
  const displayMinutes = Math.floor((timeLeft % 3600) / 60);
  const displaySeconds = timeLeft % 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const isActive = timeLeft > 0;

  return (
    <Card className="p-8 bg-card border-border shadow-lg">
      <div className="space-y-6">
        <div className="text-center pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">Countdown Timer</h3>
          <p className="text-sm text-muted-foreground">Set a custom timer for any duration</p>
        </div>

        {/* Input Section */}
        {!isActive && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                disabled={isRunning}
              />
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center space-y-4">
          {isActive && (
            <div className="inline-block px-4 py-2 rounded-lg bg-accent/20 border border-accent">
              <p className="text-sm font-medium text-muted-foreground">
                Countdown in Progress
              </p>
            </div>
          )}
          
          <div className="text-7xl font-bold text-foreground tabular-nums">
            {displayHours > 0 && <>{String(displayHours).padStart(2, "0")}:</>}
            {String(displayMinutes).padStart(2, "0")}:{String(displaySeconds).padStart(2, "0")}
          </div>

          {isActive && <Progress value={progress} className="h-3" />}
        </div>

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
      </div>
    </Card>
  );
};
