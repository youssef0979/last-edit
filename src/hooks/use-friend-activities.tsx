import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FriendActivity {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  activity_type: "habit_completion" | "performance_score" | "sleep_entry";
  activity_data: any;
  created_at: string;
}

export const useFriendActivities = (limit: number = 20) => {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();

  const loadActivities = async (reset: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentOffset = reset ? 0 : offset;

      const { data, error } = await supabase.rpc("get_friend_activities", {
        _viewer_id: user.id,
        _limit: limit,
        _offset: currentOffset,
      });

      if (error) throw error;

      if (reset) {
        setActivities((data || []) as FriendActivity[]);
        setOffset(0);
      } else {
        setActivities((prev) => [...prev, ...((data || []) as FriendActivity[])]);
      }

      setHasMore(data && data.length === limit);
      setOffset(currentOffset + limit);
    } catch (error: any) {
      console.error("Error loading friend activities:", error);
      toast({
        title: "Error",
        description: "Failed to load friend activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadActivities(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    loadActivities(true);
  };

  return {
    activities,
    loading,
    hasMore,
    loadMore,
    refresh,
  };
};
