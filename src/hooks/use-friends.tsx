import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type FriendStatus = "pending" | "accepted" | "rejected" | "blocked";

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
  requester_username: string;
  requester_full_name: string;
  requester_avatar_url: string;
  addressee_username: string;
  addressee_full_name: string;
  addressee_avatar_url: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: friendsData, error } = await supabase
        .from("friends")
        .select("*")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all unique user IDs
      const userIds = new Set<string>();
      friendsData?.forEach(f => {
        userIds.add(f.requester_id);
        userIds.add(f.addressee_id);
      });

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", Array.from(userIds));

      // Map profiles by ID
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine friends data with profile data
      const enrichedFriends = friendsData?.map(f => {
        const requesterProfile = profileMap.get(f.requester_id);
        const addresseeProfile = profileMap.get(f.addressee_id);
        return {
          ...f,
          requester_username: requesterProfile?.username || "",
          requester_full_name: requesterProfile?.full_name || "",
          requester_avatar_url: requesterProfile?.avatar_url || "",
          addressee_username: addresseeProfile?.username || "",
          addressee_full_name: addresseeProfile?.full_name || "",
          addressee_avatar_url: addresseeProfile?.avatar_url || "",
        };
      }) || [];

      setFriends(enrichedFriends);
    } catch (error) {
      console.error("Error loading friends:", error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();

    // Set up realtime subscription
    const channel = supabase
      .channel("friends-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendFriendRequest = async (addresseeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if relationship already exists in either direction
      const { data: existing } = await supabase
        .from("friends")
        .select("*")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`);

      if (existing && existing.length > 0) {
        toast({
          title: "Request exists",
          description: "A friend relationship already exists with this user",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("friends").insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request sent",
      });

      await loadFriends();
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const cancelFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request cancelled",
      });

      await loadFriends();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request accepted",
      });

      await loadFriends();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "rejected" })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request rejected",
      });

      await loadFriends();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const blockUser = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "blocked" })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User blocked",
      });

      await loadFriends();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  const unblockUser = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User unblocked",
      });

      await loadFriends();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend removed",
      });

      await loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  return {
    friends,
    loading,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser,
    removeFriend,
    refreshFriends: loadFriends,
  };
};
