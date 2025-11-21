import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckSquare, Moon, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    performanceAvg: 0,
    performanceCount: 0,
    habitsCompleted: 0,
    habitsTotal: 0,
    sleepAvg: 0,
    sleepCount: 0,
    calendarNotes: 0,
    currentStreak: 0,
  });
  const { toast } = useToast();

  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 6);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const todayStr = format(today, "yyyy-MM-dd");
      const weekAgoStr = format(weekAgo, "yyyy-MM-dd");

      // Performance data (last 7 days)
      const { data: perfScores } = await supabase
        .from("performance_scores")
        .select("score")
        .eq("user_id", user.id)
        .gte("date", weekAgoStr)
        .lte("date", todayStr);

      const performanceAvg = perfScores && perfScores.length > 0
        ? Math.round((perfScores.reduce((sum, s) => sum + s.score, 0) / perfScores.length) * 10)
        : 0;

      // Habits data (today)
      const { data: habits } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data: completions } = await supabase
        .from("habit_completions")
        .select("completed")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .eq("completed", true);

      // Sleep data (last 7 days)
      const { data: sleepEntries } = await supabase
        .from("sleep_entries")
        .select("hours_slept")
        .eq("user_id", user.id)
        .gte("date", weekAgoStr)
        .lte("date", todayStr);

      const sleepAvg = sleepEntries && sleepEntries.length > 0
        ? (sleepEntries.reduce((sum, e) => sum + Number(e.hours_slept), 0) / sleepEntries.length)
        : 0;

      // Calendar notes (upcoming)
      const { data: notes } = await supabase
        .from("calendar_notes")
        .select("id")
        .eq("user_id", user.id)
        .gte("date", todayStr);

      // Calculate current streak
      const { data: allCompletions } = await supabase
        .from("habit_completions")
        .select("date, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("date", { ascending: false });

      let streak = 0;
      let checkDate = today;
      
      if (allCompletions && habits) {
        const habitCount = habits.length;
        for (let i = 0; i < 30; i++) {
          const dateStr = format(checkDate, "yyyy-MM-dd");
          const dayCompletions = allCompletions.filter(c => c.date === dateStr).length;
          
          if (dayCompletions === habitCount) {
            streak++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }
      }

      setStats({
        performanceAvg,
        performanceCount: perfScores?.length || 0,
        habitsCompleted: completions?.length || 0,
        habitsTotal: habits?.length || 0,
        sleepAvg,
        sleepCount: sleepEntries?.length || 0,
        calendarNotes: notes?.length || 0,
        currentStreak: streak,
      });

    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const quickStats = [
    {
      title: "Performance Score",
      value: stats.performanceCount > 0 ? `${stats.performanceAvg}%` : "—",
      description: "Last 7 days average",
      icon: Activity,
      color: "text-tracker-performance",
      href: "/performance",
    },
    {
      title: "Habits Today",
      value: stats.habitsTotal > 0 ? `${stats.habitsCompleted}/${stats.habitsTotal}` : "—",
      description: "Completed today",
      icon: CheckSquare,
      color: "text-tracker-habits",
      href: "/habits",
    },
    {
      title: "Sleep Average",
      value: stats.sleepCount > 0 ? `${stats.sleepAvg.toFixed(1)}h` : "—",
      description: "Last 7 nights",
      icon: Moon,
      color: "text-tracker-sleep",
      href: "/sleep",
    },
    {
      title: "Current Streak",
      value: stats.currentStreak > 0 ? `${stats.currentStreak} days` : "—",
      description: "Keep it up!",
      icon: TrendingUp,
      color: "text-chart-4",
      href: "/habits",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Here's your wellness overview</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Jump to your trackers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Performance Tracker", href: "/performance", icon: Activity, color: "text-tracker-performance" },
                { name: "Habit Tracker", href: "/habits", icon: CheckSquare, color: "text-tracker-habits" },
                { name: "Sleep Tracker", href: "/sleep", icon: Moon, color: "text-tracker-sleep" },
                { name: "Calendar", href: "/calendar", icon: Calendar, color: "text-tracker-calendar" },
              ].map((tracker) => (
                <Link key={tracker.name} to={tracker.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer group">
                    <tracker.icon className={`h-5 w-5 ${tracker.color}`} />
                    <span className="flex-1 font-medium">{tracker.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Habits Completion</span>
                  <span className="font-medium">
                    {stats.habitsTotal > 0 ? Math.round((stats.habitsCompleted / stats.habitsTotal) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-tracker-habits transition-all duration-500" 
                    style={{ 
                      width: `${stats.habitsTotal > 0 ? (stats.habitsCompleted / stats.habitsTotal) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sleep Goal (8h target)</span>
                  <span className="font-medium">
                    {stats.sleepCount > 0 ? Math.round((stats.sleepAvg / 8) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-tracker-sleep transition-all duration-500" 
                    style={{ 
                      width: `${stats.sleepCount > 0 ? Math.min((stats.sleepAvg / 8) * 100, 100) : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Performance Score</span>
                  <span className="font-medium">{stats.performanceAvg}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-tracker-performance transition-all duration-500" 
                    style={{ width: `${stats.performanceAvg}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.calendarNotes > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>You have {stats.calendarNotes} upcoming note{stats.calendarNotes !== 1 ? 's' : ''}</CardDescription>
              </div>
              <Link to="/calendar">
                <Button variant="outline" size="sm">
                  View Calendar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
