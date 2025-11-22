import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Moon, CheckSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    avgPerformance: 0,
    avgSleep: 0,
    totalHabits: 0
  });
  const [habitData, setHabitData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Average performance
      const { data: perfScores } = await supabase
        .from("performance_scores")
        .select("score");
      const avgPerf = perfScores?.length 
        ? perfScores.reduce((acc, s) => acc + s.score, 0) / perfScores.length 
        : 0;

      // Average sleep
      const { data: sleepData } = await supabase
        .from("sleep_entries")
        .select("hours_slept");
      const avgSleep = sleepData?.length
        ? sleepData.reduce((acc, s) => acc + Number(s.hours_slept), 0) / sleepData.length
        : 0;

      // Most used habits
      const { data: habits } = await supabase
        .from("habits")
        .select("name, id")
        .eq("is_active", true);

      const habitCounts = await Promise.all(
        (habits || []).slice(0, 10).map(async (habit) => {
          const { count } = await supabase
            .from("habit_completions")
            .select("*", { count: "exact", head: true })
            .eq("habit_id", habit.id)
            .eq("completed", true);
          return { name: habit.name, count: count || 0 };
        })
      );

      setStats({
        totalUsers: userCount || 0,
        avgPerformance: Math.round(avgPerf * 10) / 10,
        avgSleep: Math.round(avgSleep * 10) / 10,
        totalHabits: habits?.length || 0
      });

      setHabitData(habitCounts.sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">Loading analytics...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-muted-foreground">Platform insights and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPerformance}/10</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSleep}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHabits}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Most Completed Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))"
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
