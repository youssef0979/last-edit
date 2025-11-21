import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { BioEditor } from "@/components/profile/BioEditor";
import { ThemeSettings } from "@/components/profile/ThemeSettings";
import { TrackerOverview } from "@/components/profile/TrackerOverview";
import { format } from "date-fns";

interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trackerStats, setTrackerStats] = useState({
    performance: { activeHabits: 0, totalScores: 0 },
    habits: { activeHabits: 0, totalPoints: 0 },
    sleep: { totalEntries: 0, avgHours: 0 },
    calendar: { totalNotes: 0, upcomingReminders: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

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

  const loadTrackerStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Load Performance Tracker stats
      const { data: perfHabits } = await supabase
        .from('performance_habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data: perfScores } = await supabase
        .from('performance_scores')
        .select('id')
        .eq('user_id', user.id);

      // Load Habit Tracker stats
      const { data: habits } = await supabase
        .from('habits')
        .select('id, difficulty_weight')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data: todayCompletions } = await supabase
        .from('habit_completions')
        .select('habit_id, completed')
        .eq('user_id', user.id)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .eq('completed', true);

      const totalPoints = todayCompletions?.reduce((sum, comp) => {
        const habit = habits?.find(h => h.id === comp.habit_id);
        return sum + (habit?.difficulty_weight || 0);
      }, 0) || 0;

      // Load Sleep Tracker stats
      const { data: sleepEntries } = await supabase
        .from('sleep_entries')
        .select('hours_slept')
        .eq('user_id', user.id);

      const avgHours = sleepEntries && sleepEntries.length > 0
        ? sleepEntries.reduce((sum, e) => sum + Number(e.hours_slept), 0) / sleepEntries.length
        : 0;

      // Load Calendar stats
      const { data: calendarNotes } = await supabase
        .from('calendar_notes')
        .select('id, reminder_time')
        .eq('user_id', user.id);

      const upcomingReminders = calendarNotes?.filter(n => 
        n.reminder_time && new Date(n.reminder_time) > new Date()
      ).length || 0;

      setTrackerStats({
        performance: {
          activeHabits: perfHabits?.length || 0,
          totalScores: perfScores?.length || 0
        },
        habits: {
          activeHabits: habits?.length || 0,
          totalPoints
        },
        sleep: {
          totalEntries: sleepEntries?.length || 0,
          avgHours
        },
        calendar: {
          totalNotes: calendarNotes?.length || 0,
          upcomingReminders
        }
      });
    } catch (error: any) {
      console.error("Error loading tracker stats:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadProfile(), loadTrackerStats()]);
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
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

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
                <p className="font-medium">{profile.email}</p>
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

        <div className="lg:col-span-2 space-y-6">
          <ThemeSettings />
          <TrackerOverview stats={trackerStats} />
        </div>
      </div>

      {profile.bio && (
        <div className="text-center py-4 border-t">
          <p className="text-sm text-muted-foreground/50 italic">"{profile.bio}"</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
