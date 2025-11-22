import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function AdminContent() {
  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage default settings and configurations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Default Habits</CardTitle>
            <CardDescription>Configure default habits for new users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Feature coming soon. Define default habits that will be automatically added for new users.
            </p>
            <Button disabled>
              <Settings className="h-4 w-4 mr-2" />
              Configure Defaults
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Colors</CardTitle>
            <CardDescription>Set default color palette for trackers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Feature coming soon. Customize the default colors available for habits and performance categories.
            </p>
            <Button disabled>
              <Settings className="h-4 w-4 mr-2" />
              Edit Colors
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracker Settings</CardTitle>
            <CardDescription>Configure global tracker behaviors</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Feature coming soon. Set default configurations for performance, habit, sleep, and calendar trackers.
            </p>
            <Button disabled>
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
