import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { BioEditor } from "@/components/profile/BioEditor";
import { ThemeSettings } from "@/components/profile/ThemeSettings";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, differenceInDays, startOfDay } from "date-fns";

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

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

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    performance: { activeHabits: 0, totalScores: 0, avgScore: 0, chartData: [] },
    habits: { activeHabits: 0, completedToday: 0, totalPoints: 0, currentStreak: 0 },
    sleep: { totalEntries: 0, avgHours: 0, lastNightHours: 0, chartData: [] },
    calendar: { totalNotes: 0, upcomingReminders: 0, todayNotes: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Get email from auth.users (secure)
      setUserEmail(user.email || "");

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), 'yyyy-MM-dd');
      const last7Days = [...Array(7)].map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));

      // Performance Tracker
      const { data: perfHabits } = await supabase
        .from('performance_habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data: perfScores } = await supabase
        .from('performance_scores')
        .select('performance_habit_id, date, score')
        .eq('user_id', user.id);

      const avgScore = perfScores && perfScores.length > 0
        ? Math.round(perfScores.reduce((sum, s) => sum + s.score, 0) / perfScores.length)
        : 0;

      const perfChartData = last7Days.reverse().map(date => {
        const dayScores = perfScores?.filter(s => s.date === date) || [];
        const avgDayScore = dayScores.length > 0
          ? dayScores.reduce((sum, s) => sum + s.score, 0) / dayScores.length
          : null;
        return { date, score: avgDayScore };
      });

      // Habit Tracker
      const { data: habits } = await supabase
        .from('habits')
        .select('id, difficulty_weight')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data: todayCompletions } = await supabase
        .from('habit_completions')
        .select('habit_id, completed')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('completed', true);

      const totalPoints = todayCompletions?.reduce((sum, comp) => {
        const habit = habits?.find(h => h.id === comp.habit_id);
        return sum + (habit?.difficulty_weight || 0);
      }, 0) || 0;

      // Calculate streak
      const { data: allCompletions } = await supabase
        .from('habit_completions')
        .select('date, completed')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      let currentStreak = 0;
      const todayDate = startOfDay(new Date());
      let checkDate = todayDate;

      if (allCompletions) {
        const habitCount = habits?.length || 0;
        for (const dateStr of last7Days.reverse()) {
          const dateCompletions = allCompletions.filter(c => c.date === dateStr && c.completed);
          if (dateCompletions.length === habitCount) {
            currentStreak++;
          } else if (dateStr !== today) {
            break;
          }
        }
      }

      // Sleep Tracker
      const { data: sleepEntries } = await supabase
        .from('sleep_entries')
        .select('date, hours_slept')
        .eq('user_id', user.id);

      const avgHours = sleepEntries && sleepEntries.length > 0
        ? sleepEntries.reduce((sum, e) => sum + Number(e.hours_slept), 0) / sleepEntries.length
        : 0;

      const lastNight = sleepEntries?.find(e => e.date === today);
      const lastNightHours = lastNight ? Number(lastNight.hours_slept) : 0;

      const sleepChartData = last7Days.reverse().map(date => {
        const entry = sleepEntries?.find(e => e.date === date);
        return { date, hours: entry ? Number(entry.hours_slept) : null };
      });

      // Calendar
      const { data: calendarNotes } = await supabase
        .from('calendar_notes')
        .select('id, date, reminder_time')
        .eq('user_id', user.id);

      const upcomingReminders = calendarNotes?.filter(n => 
        n.reminder_time && new Date(n.reminder_time) > new Date()
      ).length || 0;

      const todayNotes = calendarNotes?.filter(n => n.date === today).length || 0;

      setDashboardData({
        performance: {
          activeHabits: perfHabits?.length || 0,
          totalScores: perfScores?.length || 0,
          avgScore,
          chartData: perfChartData
        },
        habits: {
          activeHabits: habits?.length || 0,
          completedToday: todayCompletions?.length || 0,
          totalPoints,
          currentStreak
        },
        sleep: {
          totalEntries: sleepEntries?.length || 0,
          avgHours,
          lastNightHours,
          chartData: sleepChartData
        },
        calendar: {
          totalNotes: calendarNotes?.length || 0,
          upcomingReminders,
          todayNotes
        }
      });
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadProfile(), loadDashboardData()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary p-2">
          <User className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view analytics</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <User className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ProfileDashboard data={dashboardData} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AvatarUpload
                  currentAvatarUrl={profile.avatar_url}
                  userId={profile.id}
                  onAvatarUpdated={loadProfile}
                />
                
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{profile.full_name || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium">
                      {format(new Date(profile.created_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <BioEditor
                    currentBio={profile.bio}
                    userId={profile.id}
                    onBioUpdated={loadProfile}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <ThemeSettings />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {profile.bio && (
        <div className="text-center py-4 border-t">
          <p className="text-sm text-muted-foreground/50 italic">"{profile.bio}"</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
