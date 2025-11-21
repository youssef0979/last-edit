import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Target } from "lucide-react";

const Performance = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary p-2">
          <Activity className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Performance Tracker</h1>
          <p className="text-muted-foreground">Monitor your productivity and achievements</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Today's Score", value: "92%", icon: Target, color: "text-chart-1" },
          { title: "Weekly Average", value: "85%", icon: TrendingUp, color: "text-chart-2" },
          { title: "Monthly Progress", value: "+15%", icon: Activity, color: "text-chart-4" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Track your key performance indicators</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Performance charts and detailed metrics will appear here
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;
