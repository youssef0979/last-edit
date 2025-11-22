import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFriends, Friend } from "@/hooks/use-friends";
import { UserMinus, Loader2 } from "lucide-react";

export const PendingRequests = () => {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { cancelFriendRequest } = useFriends();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const loadPendingRequests = async () => {
      if (!currentUserId) return;

      try {
        const { data, error } = await supabase
          .from("friends_readable")
          .select("*")
          .eq("requester_id", currentUserId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPendingRequests(data || []);
      } catch (error) {
        console.error("Error loading pending requests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPendingRequests();

    // Subscribe to changes
    const channel = supabase
      .channel("pending-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          loadPendingRequests();
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
          <CardTitle>Pending Requests</CardTitle>
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
        <CardTitle>Pending Requests ({pendingRequests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No pending requests
          </p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.addressee_avatar_url || ""} />
                    <AvatarFallback>
                      {request.addressee_username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {request.addressee_full_name || request.addressee_username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{request.addressee_username}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => cancelFriendRequest(request.id)}
                  variant="outline"
                  size="sm"
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
