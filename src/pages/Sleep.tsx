import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, addDays, isBefore, isAfter, isSameDay, eachDayOfInterval, subDays } from "date-fns";
import { AddSleepEntryDialog } from "@/components/sleep/AddSleepEntryDialog";
import { SleepChart } from "@/components/sleep/SleepChart";
import { PreviousTracksDialog } from "@/components/sleep/PreviousTracksDialog";
import { WeeklySleepSummary } from "@/components/sleep/WeeklySleepSummary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SleepEntry {
  id: string;
  date: string;
  hours_slept: number;
  mood: string;
  sleep_quality?: number;
  bedtime?: string;
  wake_time?: string;
  notes?: string;
}

const Sleep = () => {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [currentCycleStart, setCurrentCycleStart] = useState<Date>(new Date());
  const [currentCycleEnd, setCurrentCycleEnd] = useState<Date>(addDays(new Date(), 13));
  const [sleepGoal, setSleepGoal] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const today = startOfDay(new Date());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Check for current cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from("sleep_cycles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .maybeSingle();

      if (cycleError && cycleError.code !== "PGRST116") {
        throw cycleError;
      }

      if (cycleData) {
        const start = new Date(cycleData.start_date);
        const end = new Date(cycleData.end_date);

        // Check if cycle has ended
        if (today > end) {
          // Archive current cycle
          await supabase
            .from("sleep_cycles")
            .update({ is_current: false })
            .eq("id", cycleData.id);

          // Create new cycle
          const newStart = startOfDay(new Date());
          const newEnd = addDays(newStart, 13);

          await supabase.from("sleep_cycles").insert({
            user_id: user.id,
            start_date: format(newStart, "yyyy-MM-dd"),
            end_date: format(newEnd, "yyyy-MM-dd"),
            is_current: true,
          });

          setCurrentCycleStart(newStart);
          setCurrentCycleEnd(newEnd);
        } else {
          setCurrentCycleStart(start);
          setCurrentCycleEnd(end);
        }
      } else {
        // Create new cycle
        const start = startOfDay(new Date());
        const end = addDays(start, 13);
        
        await supabase.from("sleep_cycles").insert({
          user_id: user.id,
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
          is_current: true,
        });

        setCurrentCycleStart(start);
        setCurrentCycleEnd(end);
      }

      // Load entries for current cycle
      const { data: entriesData, error: entriesError } = await supabase
        .from("sleep_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(currentCycleStart, "yyyy-MM-dd"))
        .lte("date", format(currentCycleEnd, "yyyy-MM-dd"))
        .order("date");

      if (entriesError) throw entriesError;
      setEntries(entriesData || []);

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

  const getEntry = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return entries.find(e => e.date === dateStr);
  };

  const canEditDate = (date: Date): boolean => {
    // Can edit today
    if (isSameDay(date, today)) return true;
    
    // Can edit past dates
    if (isBefore(date, today)) return true;
    
    // Can edit tomorrow only if today is complete
    const todayEntry = getEntry(today);
    if (todayEntry && isSameDay(date, addDays(today, 1))) {
      return true;
    }
    
    return false;
  };

  // Calculate weekly stats (last 7 days)
  const weekStart = subDays(today, 6);
  const weekEntries = entries.filter(e => {
    const entryDate = new Date(e.date);
    return entryDate >= weekStart && entryDate <= today;
  });

  const avgHours = weekEntries.length > 0
    ? weekEntries.reduce((sum, e) => sum + Number(e.hours_slept), 0) / weekEntries.length
    : 0;

  const avgQuality = weekEntries.length > 0
    ? weekEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / weekEntries.length
    : 0;

  const dates = eachDayOfInterval({ start: currentCycleStart, end: currentCycleEnd });
  const todayEntry = getEntry(today);

  if (isLoading) {
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
            <Moon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Sleep Tracker</h1>
            <p className="text-muted-foreground">Track your sleep patterns and quality</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PreviousTracksDialog />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Sleep</CardTitle>
            <Moon className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {todayEntry ? `${Number(todayEntry.hours_slept).toFixed(1)}h` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayEntry ? "Logged" : "Not logged yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgHours > 0 ? `${avgHours.toFixed(1)}h` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sleep Goal</CardTitle>
            <Target className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={sleepGoal}
                onChange={(e) => setSleepGoal(Number(e.target.value))}
                className="w-20 h-9"
              />
              <Label className="text-sm">hours</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <WeeklySleepSummary
        avgHours={avgHours}
        totalEntries={weekEntries.length}
        avgQuality={avgQuality}
        goalHours={sleepGoal}
      />

      <SleepChart
        entries={entries}
        startDate={currentCycleStart}
        endDate={currentCycleEnd}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daily Sleep Log</CardTitle>
          <CardDescription>
            Track your sleep for each day (locked until today is complete)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-7">
            {dates.slice(0, 14).map((date) => {
              const entry = getEntry(date);
              const canEdit = canEditDate(date);
              const isToday = isSameDay(date, today);
              const isFuture = isAfter(date, today);

              return (
                <div
                  key={format(date, "yyyy-MM-dd")}
                  className={`p-4 rounded-lg border ${
                    isToday
                      ? "border-primary bg-primary/5"
                      : entry
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
                    {entry && (
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-primary">{Number(entry.hours_slept).toFixed(1)}h</p>
                        {entry.sleep_quality && (
                          <p className="text-muted-foreground">Q: {entry.sleep_quality}/10</p>
                        )}
                      </div>
                    )}
                    <AddSleepEntryDialog
                      date={date}
                      existingEntry={entry}
                      onEntryAdded={loadData}
                      canEdit={canEdit}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sleep;
