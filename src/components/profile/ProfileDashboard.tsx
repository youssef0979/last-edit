import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckSquare, Moon, Calendar, TrendingUp, Target, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MiniPerformanceChart } from "./MiniPerformanceChart";
import { MiniSleepChart } from "./MiniSleepChart";
import { format, subDays } from "date-fns";

interface DashboardData {
  performance: {
    activeHabits: number;
    totalScores: number;
    avgScore: number;
    chartData: { date: string; score: number | null }[];
  };
  habits: {
    activeHabits: number;
    completedToday: number;
    totalPoints: number;
    currentStreak: number;
  };
  sleep: {
    totalEntries: number;
    avgHours: number;
    lastNightHours: number;
    chartData: { date: string; hours: number | null }[];
  };
  calendar: {
    totalNotes: number;
    upcomingReminders: number;
    todayNotes: number;
  };
}

interface ProfileDashboardProps {
  data: DashboardData;
}

export function ProfileDashboard({ data }: ProfileDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Quick Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points Today</p>
                <p className="text-2xl font-bold">{data.habits.totalPoints}</p>
              </div>
              <Target className="h-8 w-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{data.habits.currentStreak} days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Sleep</p>
                <p className="text-2xl font-bold">{data.sleep.avgHours > 0 ? `${data.sleep.avgHours.toFixed(1)}h` : "—"}</p>
              </div>
              <Moon className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Habits Today</p>
                <p className="text-2xl font-bold">{data.habits.completedToday}/{data.habits.activeHabits}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tracker Summary */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/performance')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-chart-1" />
              <div>
                <CardTitle>Performance Tracker</CardTitle>
                <CardDescription>Track your daily performance scores</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              View Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Active Habits</p>
                <p className="text-xl font-bold">{data.performance.activeHabits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Scores</p>
                <p className="text-xl font-bold">{data.performance.totalScores}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-xl font-bold">{data.performance.avgScore > 0 ? `${data.performance.avgScore}/10` : "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Last 7 Days Trend</p>
              <MiniPerformanceChart data={data.performance.chartData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habit Tracker Summary */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/habits')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-6 w-6 text-chart-2" />
              <div>
                <CardTitle>Habit Tracker</CardTitle>
                <CardDescription>Build and maintain daily routines</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              View Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Habits</p>
              <p className="text-xl font-bold">{data.habits.activeHabits}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-xl font-bold">{data.habits.completedToday}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-xl font-bold">{data.habits.totalPoints}</p>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-xl font-bold">{data.habits.currentStreak}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sleep Tracker Summary */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/sleep')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-6 w-6 text-chart-3" />
              <div>
                <CardTitle>Sleep Tracker</CardTitle>
                <CardDescription>Monitor your sleep patterns</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              View Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-xl font-bold">{data.sleep.totalEntries}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours</p>
                <p className="text-xl font-bold">{data.sleep.avgHours > 0 ? `${data.sleep.avgHours.toFixed(1)}h` : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Night</p>
                <p className="text-xl font-bold">{data.sleep.lastNightHours > 0 ? `${data.sleep.lastNightHours.toFixed(1)}h` : "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Last 7 Days Trend</p>
              <MiniSleepChart data={data.sleep.chartData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Summary */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/calendar')}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-chart-4" />
              <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Organize notes and reminders</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              View Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Notes</p>
              <p className="text-xl font-bold">{data.calendar.totalNotes}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Notes</p>
              <p className="text-xl font-bold">{data.calendar.todayNotes}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reminders</p>
              <p className="text-xl font-bold">{data.calendar.upcomingReminders}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
