import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { UserSearchResult } from "./UserSearchResult";
import { UserProfile } from "@/hooks/use-friends";

export const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .neq("id", currentUserId)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, currentUserId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && searchQuery && searchResults.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        )}

        <div className="space-y-2">
          {searchResults.map((user) => (
            <UserSearchResult key={user.id} user={user} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
