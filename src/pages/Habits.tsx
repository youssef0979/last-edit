import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, subDays, differenceInDays, addDays } from "date-fns";
import { AddHabitDialog } from "@/components/habits/AddHabitDialog";
import { HabitCard } from "@/components/habits/HabitCard";
import { PreviousCyclesDialog } from "@/components/habits/PreviousCyclesDialog";
import { DailyNotesDialog } from "@/components/habits/DailyNotesDialog";
import { WeeklyInsightCard } from "@/components/habits/WeeklyInsightCard";

const PRELOADED_HABITS = [
  { name: "no morning scroll", color: "#3b82f6", difficulty: 2, priority: "high" },
  { name: "tooth brush", color: "#06b6d4", difficulty: 1, priority: "high" },
  { name: "face brush", color: "#14b8a6", difficulty: 1, priority: "medium" },
  { name: "facial cleanse", color: "#10b981", difficulty: 1, priority: "medium" },
  { name: "no phone before 1 hour sleep", color: "#8b5cf6", difficulty: 2, priority: "high" },
  { name: "reading 10 pages of Quran daily", color: "#22c55e", difficulty: 2, priority: "high" },
  { name: "azkar al sabah", color: "#eab308", difficulty: 1, priority: "high" },
  { name: "azkar al masaa", color: "#f97316", difficulty: 1, priority: "high" },
  { name: "qeyam al layl", color: "#a855f7", difficulty: 3, priority: "high" },
];

interface Habit {
  id: string;
  name: string;
  color: string;
  difficulty_weight: number;
  priority: string;
  is_preloaded: boolean;
}

interface HabitCompletion {
  habit_id: string;
  date: string;
  completed: boolean;
}

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentCycle, setCurrentCycle] = useState<{ start: Date; end: Date } | null>(null);
  const { toast } = useToast();

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  useEffect(() => {
    initializeHabits();
  }, []);

  const initializeHabits = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has any habits
      const { data: existingHabits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      // If no habits, create preloaded ones
      if (!existingHabits || existingHabits.length === 0) {
        const preloadedHabits = PRELOADED_HABITS.map(h => ({
          user_id: user.id,
          name: h.name,
          color: h.color,
          difficulty_weight: h.difficulty,
          priority: h.priority,
          is_preloaded: true,
          is_active: true
        }));

        await supabase.from("habits").insert(preloadedHabits);
      }

      // Initialize or get current cycle
      await initializeCycle(user.id);

      // Load habits and completions
      await loadHabits();
      await loadCompletions();
      await calculateStreaks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeCycle = async (userId: string) => {
    const { data: currentCycleData } = await supabase
      .from("habit_cycles")
      .select("*")
      .eq("user_id", userId)
      .eq("is_current", true)
      .maybeSingle();

    if (!currentCycleData) {
      // Create new cycle
      const start = today;
      const end = addDays(start, 13); // 2 weeks = 14 days
      
      await supabase.from("habit_cycles").insert({
        user_id: userId,
        start_date: format(start, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        is_current: true
      });

      setCurrentCycle({ start, end });
    } else {
      const start = new Date(currentCycleData.start_date);
      const end = new Date(currentCycleData.end_date);

      // Check if cycle has ended
      if (today > end) {
        // Archive current cycle
        await supabase
          .from("habit_cycles")
          .update({ is_current: false })
          .eq("id", currentCycleData.id);

        // Create new cycle
        const newStart = addDays(end, 1);
        const newEnd = addDays(newStart, 13);

        await supabase.from("habit_cycles").insert({
          user_id: userId,
          start_date: format(newStart, "yyyy-MM-dd"),
          end_date: format(newEnd, "yyyy-MM-dd"),
          is_current: true
        });

        setCurrentCycle({ start: newStart, end: newEnd });
      } else {
        setCurrentCycle({ start, end });
      }
    }
  };

  const loadHabits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at");

    if (data) {
      setHabits(data);
      // Recalculate streaks with the new habits list
      await calculateStreaks(data);
    }
  };

  const loadCompletions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("habit_completions")
      .select("habit_id, date, completed")
      .eq("user_id", user.id)
      .eq("date", todayStr);

    if (data) setCompletions(data);
  };

  const calculateStreaks = async (currentHabits?: Habit[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const habitsToCheck = currentHabits || habits;

    const { data: allCompletions } = await supabase
      .from("habit_completions")
      .select("habit_id, date, completed")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!allCompletions) return;

    const streakMap: Record<string, number> = {};
    
    habitsToCheck.forEach(habit => {
      const habitCompletions = allCompletions
        .filter(c => c.habit_id === habit.id && c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let streak = 0;
      let checkDate = today;

      for (const completion of habitCompletions) {
        const completionDate = startOfDay(new Date(completion.date));
        const daysDiff = differenceInDays(checkDate, completionDate);

        if (daysDiff === 0) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else if (daysDiff === 1) {
          streak++;
          checkDate = completionDate;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      streakMap[habit.id] = streak;
    });

    setStreaks(streakMap);
  };

  const toggleHabitCompletion = async (habitId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = completions.find(c => c.habit_id === habitId);
    const newCompleted = !existing?.completed;

    const { error } = await supabase
      .from("habit_completions")
      .upsert({
        user_id: user.id,
        habit_id: habitId,
        date: todayStr,
        completed: newCompleted
      }, {
        onConflict: "habit_id,date"
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    await loadCompletions();
    await calculateStreaks();
  };

  const getTodayCompletion = (habitId: string) => {
    const completion = completions.find(c => c.habit_id === habitId);
    return completion?.completed || false;
  };

  const calculateTotalPoints = () => {
    return habits.reduce((total, habit) => {
      const completed = getTodayCompletion(habit.id);
      return total + (completed ? habit.difficulty_weight : 0);
    }, 0);
  };

  const calculateWeeklyStats = () => {
    const weekStart = subDays(today, 6);
    const totalDays = 7;
    let totalPoints = 0;
    let completedTasks = 0;
    let totalTasks = habits.length * totalDays;
    
    // This is simplified - in a real implementation, you'd query all completions for the week
    totalPoints = calculateTotalPoints();
    
    return {
      totalPoints,
      completionRate: Math.round((completedTasks / totalTasks) * 100) || 0,
      bestDay: format(today, "EEE"),
      avgPoints: totalPoints / totalDays
    };
  };

  const allHabitsCompletedToday = habits.every(habit => getTodayCompletion(habit.id));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary p-2">
            <CheckSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Habit Tracker</h1>
            <p className="text-muted-foreground">Build and maintain your daily routines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DailyNotesDialog date={today} />
          <PreviousCyclesDialog />
          <AddHabitDialog onHabitAdded={loadHabits} />
        </div>
      </div>

      {currentCycle && (
        <Card>
          <CardHeader>
            <CardTitle>Current Cycle Progress</CardTitle>
            <CardDescription>
              {format(currentCycle.start, "MMM d")} - {format(currentCycle.end, "MMM d, yyyy")} 
              {" • "}Day {differenceInDays(today, currentCycle.start) + 1} of 14
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-3xl font-bold text-primary">{calculateTotalPoints()}</div>
                <div className="text-sm text-muted-foreground">Today's Points</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {habits.filter(h => getTodayCompletion(h.id)).length}/{habits.length}
                </div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {Math.max(...Object.values(streaks), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {differenceInDays(currentCycle.end, today) + 1}
                </div>
                <div className="text-sm text-muted-foreground">Days Left</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {habits.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CheckSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Habits</h3>
              <p className="text-muted-foreground mb-4">
                Add your first habit to start tracking
              </p>
              <AddHabitDialog onHabitAdded={loadHabits} />
            </CardContent>
          </Card>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completed={getTodayCompletion(habit.id)}
              streak={streaks[habit.id] || 0}
              isLocked={false}
              onToggle={() => toggleHabitCompletion(habit.id)}
              onDelete={loadHabits}
            />
          ))
        )}
      </div>

      <WeeklyInsightCard weeklyStats={calculateWeeklyStats()} />
    </div>
  );
};

export default Habits;
