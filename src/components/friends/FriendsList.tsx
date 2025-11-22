import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFriends, Friend } from "@/hooks/use-friends";
import { UserMinus, Ban, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye } from "lucide-react";

export const FriendsList = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { removeFriend, blockUser } = useFriends();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const loadFriends = async () => {
      if (!currentUserId) return;

      try {
        const { data, error } = await supabase
          .from("friends_readable")
          .select("*")
          .eq("status", "accepted")
          .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setFriendsList(data || []);
      } catch (error) {
        console.error("Error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();

    // Subscribe to changes
    const channel = supabase
      .channel("friends-list")
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
  }, [currentUserId]);

  const getFriendInfo = (friend: Friend) => {
    const isFriendTheRequester = friend.requester_id !== currentUserId;
    return {
      username: isFriendTheRequester ? friend.requester_username : friend.addressee_username,
      fullName: isFriendTheRequester ? friend.requester_full_name : friend.addressee_full_name,
      avatarUrl: isFriendTheRequester ? friend.requester_avatar_url : friend.addressee_avatar_url,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friends ({friendsList.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {friendsList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No friends yet. Start by searching for users!
          </p>
        ) : (
          <div className="space-y-2">
            {friendsList.map((friend) => {
              const friendInfo = getFriendInfo(friend);
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friendInfo.avatarUrl || ""} />
                      <AvatarFallback>
                        {friendInfo.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {friendInfo.fullName || friendInfo.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{friendInfo.username}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/friends/${friend.requester_id !== currentUserId ? friend.requester_id : friend.addressee_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeFriend(friend.id)}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Friend
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => blockUser(friend.id)}
                        className="text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
