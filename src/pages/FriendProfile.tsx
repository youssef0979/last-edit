import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, CheckSquare, Moon, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { FriendTrackerView } from "@/components/friends/FriendTrackerView";

interface FriendProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

interface PrivacySettings {
  show_performance: boolean;
  show_habits: boolean;
  show_sleep: boolean;
}

export default function FriendProfile() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    const loadFriendProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !friendId) return;

        // Check if they are friends
        const { data: friendship } = await supabase
          .from("friends")
          .select("status")
          .eq("status", "accepted")
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`)
          .maybeSingle();

        if (!friendship) {
          toast({
            title: "Access Denied",
            description: "You must be friends to view this profile",
            variant: "destructive",
          });
          navigate("/friends");
          return;
        }

        setIsFriend(true);

        // Load friend profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio")
          .eq("id", friendId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Load privacy settings
        const { data: privacyData } = await supabase
          .from("privacy_settings")
          .select("show_performance, show_habits, show_sleep")
          .eq("user_id", friendId)
          .maybeSingle();

        setPrivacy(privacyData || {
          show_performance: false,
          show_habits: false,
          show_sleep: false,
        });
      } catch (error) {
        console.error("Error loading friend profile:", error);
        toast({
          title: "Error",
          description: "Failed to load friend profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFriendProfile();
  }, [friendId, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile || !isFriend) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/friends")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Friends
      </Button>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-2xl">
                {profile.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && (
                <p className="mt-2 text-sm text-muted-foreground italic">"{profile.bio}"</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" disabled={!privacy?.show_performance}>
            <Activity className="h-4 w-4 mr-2" />
            Performance
            {!privacy?.show_performance && <Lock className="h-3 w-3 ml-2" />}
          </TabsTrigger>
          <TabsTrigger value="habits" disabled={!privacy?.show_habits}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Habits
            {!privacy?.show_habits && <Lock className="h-3 w-3 ml-2" />}
          </TabsTrigger>
          <TabsTrigger value="sleep" disabled={!privacy?.show_sleep}>
            <Moon className="h-4 w-4 mr-2" />
            Sleep
            {!privacy?.show_sleep && <Lock className="h-3 w-3 ml-2" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <FriendTrackerView 
            friendId={friendId!} 
            trackerType="performance" 
            isAllowed={privacy?.show_performance || false} 
          />
        </TabsContent>

        <TabsContent value="habits" className="mt-6">
          <FriendTrackerView 
            friendId={friendId!} 
            trackerType="habits" 
            isAllowed={privacy?.show_habits || false} 
          />
        </TabsContent>

        <TabsContent value="sleep" className="mt-6">
          <FriendTrackerView 
            friendId={friendId!} 
            trackerType="sleep" 
            isAllowed={privacy?.show_sleep || false} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
