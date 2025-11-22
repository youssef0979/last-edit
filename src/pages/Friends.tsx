import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSearch } from "@/components/friends/UserSearch";
import { PendingRequests } from "@/components/friends/PendingRequests";
import { IncomingRequests } from "@/components/friends/IncomingRequests";
import { FriendsList } from "@/components/friends/FriendsList";

export default function Friends() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">
            Connect with other users and manage your friendships
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <UserSearch />
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            <FriendsList />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <PendingRequests />
          </TabsContent>

          <TabsContent value="incoming" className="mt-6">
            <IncomingRequests />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
