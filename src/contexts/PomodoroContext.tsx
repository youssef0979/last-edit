import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PomodoroPreset {
  name: string;
  work: number;
  break: number;
  label: string;
}

interface PomodoroContextType {
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
  isWork: boolean;
  sessionName: string;
  sessionActive: boolean;
  showMiniWidget: boolean;
  setShowMiniWidget: (show: boolean) => void;
  startSession: (
    name: string,
    preset: PomodoroPreset,
    coverUrl: string | null,
    habitId: string | null
  ) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error("usePomodoroContext must be used within PomodoroProvider");
  }
  return context;
};

export const PomodoroProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPreset, setSelectedPreset] = useState<PomodoroPreset>({ 
    name: "25+5", work: 25, break: 5, label: "Classic" 
  });
  const [sessionName, setSessionName] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [linkedHabitId, setLinkedHabitId] = useState<string | null>(null);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(selectedPreset.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [autoStart, setAutoStart] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [workSegments, setWorkSegments] = useState(0);
  const [breakSegments, setBreakSegments] = useState(0);
  const [showMiniWidget, setShowMiniWidget] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>();

  // Load persisted state on mount
  useEffect(() => {
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    
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
          setAutoStart(state.autoStart);
          setShowMiniWidget(true);
          
          const preset = { name: state.presetName, work: state.work, break: state.break, label: state.label };
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
        autoStart,
        presetName: selectedPreset.name,
        work: selectedPreset.work,
        break: selectedPreset.break,
        label: selectedPreset.label,
        lastUpdate: Date.now(),
      };
      localStorage.setItem('pomodoroState', JSON.stringify(state));
    }
  }, [timeLeft, isRunning, sessionName, coverImageUrl, isWork, sessionActive, autoStart, selectedPreset]);

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
    
    if (isWork) {
      setWorkSegments(prev => prev + 1);
    } else {
      setBreakSegments(prev => prev + 1);
    }
    
    audioRef.current?.play().catch(console.error);

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
          timer_mode: "normal",
          work_segments: isWork ? workSegments + 1 : workSegments,
          break_segments: !isWork ? breakSegments + 1 : breakSegments,
          linked_performance_habit_id: linkedHabitId,
        });

        if (linkedHabitId && isWork) {
          const today = new Date().toISOString().split('T')[0];
          await supabase.from("performance_scores").upsert({
            user_id: user.id,
            performance_habit_id: linkedHabitId,
            date: today,
            score: 10,
          }, {
            onConflict: 'user_id,performance_habit_id,date'
          });
        }
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

    if (isWork) {
      setIsWork(false);
      setTimeLeft(selectedPreset.break * 60);
      if (autoStart) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      setIsWork(true);
      setTimeLeft(selectedPreset.work * 60);
      setShowMiniWidget(false);
    }
  };

  const startSession = (
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
    setWorkSegments(0);
    setBreakSegments(0);
    setIsRunning(true);
    setShowMiniWidget(true);
    
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsWork(true);
    setTimeLeft(selectedPreset.work * 60);
    setSessionActive(false);
    setSessionName("");
    setCoverImageUrl(null);
    setLinkedHabitId(null);
    setWorkSegments(0);
    setBreakSegments(0);
    setShowMiniWidget(false);
    localStorage.removeItem('pomodoroState');
  };

  const totalTime = isWork ? selectedPreset.work * 60 : selectedPreset.break * 60;

  return (
    <PomodoroContext.Provider
      value={{
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
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};
