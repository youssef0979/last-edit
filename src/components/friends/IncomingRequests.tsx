import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFriends, Friend } from "@/hooks/use-friends";
import { Check, X, Loader2 } from "lucide-react";

export const IncomingRequests = () => {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { acceptFriendRequest, rejectFriendRequest } = useFriends();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const loadIncomingRequests = async () => {
      if (!currentUserId) return;

      try {
        const { data: friendsData, error } = await supabase
          .from("friends")
          .select("*")
          .eq("addressee_id", currentUserId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get requester profiles
        const requesterIds = friendsData?.map(f => f.requester_id) || [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", requesterIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const enrichedRequests = friendsData?.map(f => {
          const requesterProfile = profileMap.get(f.requester_id);
          return {
            ...f,
            requester_username: requesterProfile?.username || "",
            requester_full_name: requesterProfile?.full_name || "",
            requester_avatar_url: requesterProfile?.avatar_url || "",
            addressee_username: "",
            addressee_full_name: "",
            addressee_avatar_url: "",
          };
        }) || [];

        setIncomingRequests(enrichedRequests);
      } catch (error) {
        console.error("Error loading incoming requests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadIncomingRequests();

    // Subscribe to changes
    const channel = supabase
      .channel("incoming-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          loadIncomingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
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
        <CardTitle>Incoming Requests ({incomingRequests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {incomingRequests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No incoming requests
          </p>
        ) : (
          <div className="space-y-2">
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.requester_avatar_url || ""} />
                    <AvatarFallback>
                      {request.requester_username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {request.requester_full_name || request.requester_username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{request.requester_username}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => acceptFriendRequest(request.id)}
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => rejectFriendRequest(request.id)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
