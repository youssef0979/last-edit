import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePrivacySettings } from "@/hooks/use-privacy-settings";
import { Activity, CheckSquare, Moon, Calendar, Shield, Loader2 } from "lucide-react";

export const PrivacySettings = () => {
  const { settings, loading, updateSettings } = usePrivacySettings();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control what your friends can see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  const privacyOptions = [
    {
      id: "show_performance",
      label: "Performance Tracker",
      description: "Allow friends to view your performance scores and habits",
      icon: Activity,
      value: settings.show_performance,
    },
    {
      id: "show_habits",
      label: "Habit Tracker",
      description: "Allow friends to view your habits and completion status",
      icon: CheckSquare,
      value: settings.show_habits,
    },
    {
      id: "show_sleep",
      label: "Sleep Tracker",
      description: "Allow friends to view your sleep entries and statistics",
      icon: Moon,
      value: settings.show_sleep,
    },
    {
      id: "show_calendar",
      label: "Calendar Notes",
      description: "Allow friends to view your calendar notes and events",
      icon: Calendar,
      value: settings.show_calendar,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Privacy Settings</CardTitle>
        </div>
        <CardDescription>
          Control what data your friends can see. These settings only affect friends - your data is always private to everyone else.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {privacyOptions.map((option, index) => (
          <div key={option.id}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  <option.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor={option.id} className="text-base font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
              <Switch
                id={option.id}
                checked={option.value}
                onCheckedChange={(checked) => {
                  updateSettings({ [option.id]: checked });
                }}
              />
            </div>
          </div>
        ))}

        <Separator />

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Admins can always view all data for moderation purposes. These settings only control visibility to your friends.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
