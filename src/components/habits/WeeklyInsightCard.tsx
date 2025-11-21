import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, Target } from "lucide-react";

interface WeeklyInsightCardProps {
  weeklyStats: {
    totalPoints: number;
    completionRate: number;
    bestDay: string;
    avgPoints: number;
  };
}

export function WeeklyInsightCard({ weeklyStats }: WeeklyInsightCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Weekly Insights</CardTitle>
        </div>
        <CardDescription>Your performance this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-semibold">{weeklyStats.completionRate}%</span>
          </div>
          <Progress value={weeklyStats.completionRate} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="text-xs">Total Points</span>
            </div>
            <div className="text-2xl font-bold text-primary">{weeklyStats.totalPoints}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Award className="h-3 w-3" />
              <span className="text-xs">Avg/Day</span>
            </div>
            <div className="text-2xl font-bold text-primary">{weeklyStats.avgPoints.toFixed(1)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Best Day</span>
            </div>
            <div className="text-2xl font-bold text-primary">{weeklyStats.bestDay}</div>
          </div>
        </div>

        {weeklyStats.completionRate >= 80 && (
          <div className="rounded-lg bg-primary/10 p-3 text-sm">
            <p className="font-semibold text-primary">🎉 Excellent work!</p>
            <p className="text-muted-foreground">You're maintaining great consistency this week.</p>
          </div>
        )}

        {weeklyStats.completionRate < 50 && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-semibold">💪 Keep pushing!</p>
            <p className="text-muted-foreground">Small steps every day lead to big changes.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
