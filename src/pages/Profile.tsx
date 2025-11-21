import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar as CalendarIcon, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user?.user_metadata?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Your milestones and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "7-Day Streak", icon: Award, color: "text-chart-1" },
                { name: "Early Bird", icon: Award, color: "text-chart-2" },
                { name: "Consistency King", icon: Award, color: "text-chart-4" },
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                  <span className="font-medium">{achievement.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>Your overall progress and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Total Activities", value: "127" },
              { label: "Current Streak", value: "15 days" },
              { label: "Overall Score", value: "85%" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
