import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, TrendingUp, Target, Award } from "lucide-react";

interface WeeklySleepSummaryProps {
  avgHours: number;
  totalEntries: number;
  avgQuality: number;
  goalHours: number;
}

export function WeeklySleepSummary({ avgHours, totalEntries, avgQuality, goalHours }: WeeklySleepSummaryProps) {
  const goalAchievement = goalHours > 0 ? Math.round((avgHours / goalHours) * 100) : 0;
  const isGoalMet = avgHours >= goalHours;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          Weekly Sleep Summary
        </CardTitle>
        <CardDescription>Your sleep stats for the current week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Average Hours
            </div>
            <div className="text-2xl font-bold text-primary">
              {avgHours > 0 ? `${avgHours.toFixed(1)}h` : "—"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              Sleep Quality
            </div>
            <div className="text-2xl font-bold text-primary">
              {avgQuality > 0 ? `${avgQuality.toFixed(1)}/10` : "—"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Goal Progress
            </div>
            <div className={`text-2xl font-bold ${isGoalMet ? 'text-green-500' : 'text-primary'}`}>
              {goalAchievement > 0 ? `${goalAchievement}%` : "—"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Moon className="h-4 w-4" />
              Days Logged
            </div>
            <div className="text-2xl font-bold text-primary">{totalEntries}/7</div>
          </div>
        </div>

        {goalHours > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily Goal:</span>
              <span className="font-medium">{goalHours}h</span>
            </div>
            {isGoalMet && (
              <p className="text-xs text-green-600 mt-1">🎉 You're meeting your sleep goal!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
