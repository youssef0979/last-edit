import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddHabitDialog } from "@/components/performance/AddHabitDialog";
import { ScoreInputDialog } from "@/components/performance/ScoreInputDialog";
import { PerformanceChart } from "@/components/performance/PerformanceChart";
import { PreviousTracksDialog } from "@/components/performance/PreviousTracksDialog";
import { PerformanceHabitCard } from "@/components/performance/PerformanceHabitCard";
import { format, startOfDay, endOfDay, subDays, addDays, isBefore, isAfter, isSameDay, eachDayOfInterval } from "date-fns";

interface Habit {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
}

interface Score {
  performance_habit_id: string;
  date: string;
  score: number;
}

const Performance = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [currentCycleStart, setCurrentCycleStart] = useState<Date>(new Date());
  const [currentCycleEnd, setCurrentCycleEnd] = useState<Date>(addDays(new Date(), 13));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Load performance habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("performance_habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      // Check for current cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from("performance_cycles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .single();

      if (cycleError && cycleError.code !== "PGRST116") {
        throw cycleError;
      }

      if (cycleData) {
        setCurrentCycleStart(new Date(cycleData.start_date));
        setCurrentCycleEnd(new Date(cycleData.end_date));
      } else {
        // Create new cycle
        const start = startOfDay(new Date());
        const end = endOfDay(addDays(start, 13));
        
        const { error: insertError } = await supabase
          .from("performance_cycles")
          .insert({
            user_id: user.id,
            start_date: format(start, "yyyy-MM-dd"),
            end_date: format(end, "yyyy-MM-dd"),
            is_current: true,
          });

        if (insertError) throw insertError;

        setCurrentCycleStart(start);
        setCurrentCycleEnd(end);
      }

      // Load scores for current cycle
      const { data: scoresData, error: scoresError } = await supabase
        .from("performance_scores")
        .select("performance_habit_id, date, score")
        .eq("user_id", user.id)
        .gte("date", format(currentCycleStart, "yyyy-MM-dd"))
        .lte("date", format(currentCycleEnd, "yyyy-MM-dd"));

      if (scoresError) throw scoresError;
      setScores(scoresData || []);

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate stats
  const todayScores = scores.filter(s => s.date === format(new Date(), "yyyy-MM-dd"));
  const todayAverage = todayScores.length > 0
    ? Math.round(todayScores.reduce((sum, s) => sum + s.score, 0) / todayScores.length)
    : 0;

  const allCycleScores = scores.map(s => s.score);
  const cycleAverage = allCycleScores.length > 0
    ? Math.round(allCycleScores.reduce((sum, s) => sum + s, 0) / allCycleScores.length)
    : 0;

  // Get dates with scores for each day
  const dates = eachDayOfInterval({ start: currentCycleStart, end: currentCycleEnd });
  const today = startOfDay(new Date());
  
  // Find the latest date with all habits scored
  let latestCompleteDate = null;
  for (const date of dates) {
    if (isAfter(date, today)) break;
    
    const dateStr = format(date, "yyyy-MM-dd");
    const dateScores = scores.filter(s => s.date === dateStr);
    
    if (dateScores.length === habits.length) {
      latestCompleteDate = date;
    }
  }

  const getExistingScores = (date: Date): Record<string, number> => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dateScores = scores.filter(s => s.date === dateStr);
    const result: Record<string, number> = {};
    dateScores.forEach(s => {
      result[s.performance_habit_id] = s.score;
    });
    return result;
  };

  const canEditDate = (date: Date): boolean => {
    // Can edit today
    if (isSameDay(date, today)) return true;
    
    // Can edit past dates
    if (isBefore(date, today)) return true;
    
    // Can only edit future dates if today is complete
    if (latestCompleteDate && isSameDay(latestCompleteDate, today)) {
      return true;
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary p-2">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Performance Tracker</h1>
            <p className="text-muted-foreground">2-week cycle tracking system</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PreviousTracksDialog habits={habits} />
          <AddHabitDialog onHabitAdded={loadData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Average</CardTitle>
            <Target className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {todayAverage > 0 ? `${todayAverage}/10` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayScores.length}/{habits.length} habits scored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cycle Average</CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {cycleAverage > 0 ? `${cycleAverage}/10` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {scores.length} total scores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Activity className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{habits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tracking daily
            </p>
          </CardContent>
        </Card>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Habits Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first habit to start tracking your performance
            </p>
            <AddHabitDialog onHabitAdded={loadData} />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Performance Habits</CardTitle>
              <CardDescription>
                Manage your performance tracking habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {habits.map((habit) => {
                  const habitScores = scores.filter(s => s.performance_habit_id === habit.id);
                  const avgScore = habitScores.length > 0
                    ? Math.round(habitScores.reduce((sum, s) => sum + s.score, 0) / habitScores.length)
                    : 0;
                  
                  return (
                    <PerformanceHabitCard
                      key={habit.id}
                      habit={habit}
                      avgScore={avgScore}
                      totalScores={habitScores.length}
                      onDelete={loadData}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <PerformanceChart
            habits={habits}
            scores={scores}
            startDate={currentCycleStart}
            endDate={currentCycleEnd}
          />

          <Card>
            <CardHeader>
              <CardTitle>Daily Score Input</CardTitle>
              <CardDescription>
                Input scores for each day (locked until today is complete)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-7">
                {dates.slice(0, 14).map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const dateScores = scores.filter(s => s.date === dateStr);
                  const isComplete = dateScores.length === habits.length;
                  const canEdit = canEditDate(date);
                  const isToday = isSameDay(date, today);
                  const isFuture = isAfter(date, today);

                  return (
                    <div
                      key={dateStr}
                      className={`p-4 rounded-lg border ${
                        isToday
                          ? "border-primary bg-primary/5"
                          : isComplete
                          ? "border-chart-1 bg-chart-1/5"
                          : isFuture
                          ? "border-muted bg-muted/50"
                          : "border-border"
                      }`}
                    >
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">
                          {format(date, "EEE")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(date, "MMM d")}
                        </p>
                        <ScoreInputDialog
                          date={date}
                          habits={habits}
                          existingScores={getExistingScores(date)}
                          onScoreUpdated={loadData}
                          canEdit={canEdit}
                        />
                        {isComplete && (
                          <p className="text-xs text-chart-1 font-medium">✓ Complete</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Performance;
