import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  target_table: string | null;
  details: any;
  created_at: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      delete_user: "destructive",
      reset_tracker: "default",
      update_user: "secondary",
    };

    return (
      <Badge variant={colors[actionType] as any || "outline"}>
        {actionType.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">Loading logs...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Action Logs</h1>
          <p className="text-muted-foreground">View all administrative actions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No actions logged yet</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getActionBadge(log.action_type)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">
                          Admin ID: <code className="bg-muted px-1 rounded">{log.admin_id}</code>
                        </p>
                        {log.target_user_id && (
                          <p className="text-sm">
                            Target User: <code className="bg-muted px-1 rounded">{log.target_user_id}</code>
                          </p>
                        )}
                        {log.target_table && (
                          <p className="text-sm">
                            Table: <code className="bg-muted px-1 rounded">{log.target_table}</code>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
