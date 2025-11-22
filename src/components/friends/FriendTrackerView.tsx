import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { format } from "date-fns";

interface FriendTrackerViewProps {
  friendId: string;
  trackerType: "performance" | "habits" | "sleep";
  isAllowed: boolean;
}

export const FriendTrackerView = ({ friendId, trackerType, isAllowed }: FriendTrackerViewProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendName, setFriendName] = useState("");

  useEffect(() => {
    if (!isAllowed) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load friend name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, username")
          .eq("id", friendId)
          .single();

        setFriendName(profileData?.full_name || profileData?.username || "Friend");

        // Load tracker data based on type
        if (trackerType === "performance") {
          const { data: scoresData } = await supabase
            .from("performance_scores")
            .select(`
              *,
              performance_habits(name, color)
            `)
            .eq("user_id", friendId)
            .order("date", { ascending: false })
            .limit(10);

          setData(scoresData || []);
        } else if (trackerType === "habits") {
          const { data: completionsData } = await supabase
            .from("habit_completions")
            .select(`
              *,
              habits(name, color)
            `)
            .eq("user_id", friendId)
            .eq("completed", true)
            .order("date", { ascending: false })
            .limit(10);

          setData(completionsData || []);
        } else if (trackerType === "sleep") {
          const { data: sleepData } = await supabase
            .from("sleep_entries")
            .select("*")
            .eq("user_id", friendId)
            .order("date", { ascending: false })
            .limit(10);

          setData(sleepData || []);
        }
      } catch (error) {
        console.error("Error loading tracker data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [friendId, trackerType, isAllowed]);

  if (!isAllowed) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            This data is not shared
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTitle = () => {
    switch (trackerType) {
      case "performance":
        return `${friendName}'s Recent Performance Scores`;
      case "habits":
        return `${friendName}'s Recent Completed Habits`;
      case "sleep":
        return `${friendName}'s Recent Sleep Entries`;
    }
  };

  const renderItem = (item: any) => {
    if (trackerType === "performance") {
      return (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.performance_habits?.color }}
            />
            <div>
              <p className="font-medium">{item.performance_habits?.name}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="text-lg font-bold">{item.score}/10</div>
        </div>
      );
    } else if (trackerType === "habits") {
      return (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.habits?.color }}
            />
            <div>
              <p className="font-medium">{item.habits?.name}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</p>
            </div>
          </div>
        </div>
      );
    } else if (trackerType === "sleep") {
      return (
        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{item.hours_slept} hours</p>
            <p className="text-sm text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</p>
          </div>
          <div className="text-right">
            {item.sleep_quality && (
              <p className="text-sm">Quality: {item.sleep_quality}/5</p>
            )}
            {item.mood && (
              <p className="text-sm text-muted-foreground">{item.mood}</p>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <div className="space-y-2">
            {data.map(renderItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
