import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckSquare, Moon, Calendar, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrackerStats {
  performance: {
    activeHabits: number;
    totalScores: number;
  };
  habits: {
    activeHabits: number;
    totalPoints: number;
  };
  sleep: {
    totalEntries: number;
    avgHours: number;
  };
  calendar: {
    totalNotes: number;
    upcomingReminders: number;
  };
}

interface TrackerOverviewProps {
  stats: TrackerStats;
}

export function TrackerOverview({ stats }: TrackerOverviewProps) {
  const navigate = useNavigate();

  const trackers = [
    {
      name: "Performance Tracker",
      icon: Activity,
      color: "text-chart-1",
      path: "/performance",
      stats: [
        { label: "Active Habits", value: stats.performance.activeHabits },
        { label: "Total Scores", value: stats.performance.totalScores }
      ]
    },
    {
      name: "Habit Tracker",
      icon: CheckSquare,
      color: "text-chart-2",
      path: "/habits",
      stats: [
        { label: "Active Habits", value: stats.habits.activeHabits },
        { label: "Total Points Today", value: stats.habits.totalPoints }
      ]
    },
    {
      name: "Sleep Tracker",
      icon: Moon,
      color: "text-chart-3",
      path: "/sleep",
      stats: [
        { label: "Total Entries", value: stats.sleep.totalEntries },
        { label: "Avg Hours", value: stats.sleep.avgHours > 0 ? `${stats.sleep.avgHours.toFixed(1)}h` : "—" }
      ]
    },
    {
      name: "Calendar",
      icon: Calendar,
      color: "text-chart-4",
      path: "/calendar",
      stats: [
        { label: "Total Notes", value: stats.calendar.totalNotes },
        { label: "Reminders", value: stats.calendar.upcomingReminders }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Tracker Overview
        </CardTitle>
        <CardDescription>
          Your activity across all trackers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trackers.map((tracker) => (
          <div key={tracker.name} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <tracker.icon className={`h-6 w-6 ${tracker.color}`} />
                <div>
                  <h3 className="font-medium">{tracker.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    {tracker.stats.map((stat, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="text-muted-foreground">{stat.label}: </span>
                        <span className="font-semibold">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(tracker.path)}
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
