import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFriends, UserProfile, Friend } from "@/hooks/use-friends";
import { UserPlus, UserMinus, Check, X, Ban } from "lucide-react";

interface UserSearchResultProps {
  user: UserProfile;
}

export const UserSearchResult = ({ user }: UserSearchResultProps) => {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [relationship, setRelationship] = useState<Friend | null>(null);
  const {
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unblockUser,
    removeFriend,
  } = useFriends();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setCurrentUserId(currentUser.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const loadRelationship = async () => {
      if (!currentUserId) return;

      const { data } = await supabase
        .from("friends_readable")
        .select("*")
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${user.id}),and(requester_id.eq.${user.id},addressee_id.eq.${currentUserId})`)
        .maybeSingle();

      setRelationship(data);
    };

    loadRelationship();

    // Subscribe to changes
    const channel = supabase
      .channel(`friends-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          loadRelationship();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, user.id]);

  const renderActionButton = () => {
    if (!relationship) {
      return (
        <Button onClick={() => sendFriendRequest(user.id)} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Send Request
        </Button>
      );
    }

    const isRequester = relationship.requester_id === currentUserId;

    switch (relationship.status) {
      case "pending":
        if (isRequester) {
          return (
            <Button
              onClick={() => cancelFriendRequest(relationship.id)}
              variant="outline"
              size="sm"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          );
        } else {
          return (
            <div className="flex gap-2">
              <Button
                onClick={() => acceptFriendRequest(relationship.id)}
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                onClick={() => rejectFriendRequest(relationship.id)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          );
        }
      case "accepted":
        return (
          <Button
            onClick={() => removeFriend(relationship.id)}
            variant="outline"
            size="sm"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Friend
          </Button>
        );
      case "blocked":
        if (isRequester) {
          return (
            <Button
              onClick={() => unblockUser(relationship.id)}
              variant="outline"
              size="sm"
            >
              <Ban className="h-4 w-4 mr-2" />
              Unblock
            </Button>
          );
        } else {
          return (
            <span className="text-sm text-muted-foreground">Blocked by user</span>
          );
        }
      case "rejected":
        return (
          <span className="text-sm text-muted-foreground">Request rejected</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatar_url || ""} />
          <AvatarFallback>
            {user.username?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.full_name || user.username}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {renderActionButton()}
    </div>
  );
};
