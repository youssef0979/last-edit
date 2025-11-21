import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckSquare, Moon, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Performance Score",
      value: "85%",
      description: "Last 7 days average",
      icon: Activity,
      color: "text-chart-1",
    },
    {
      title: "Habits Completed",
      value: "12/15",
      description: "This week",
      icon: CheckSquare,
      color: "text-chart-2",
    },
    {
      title: "Sleep Average",
      value: "7.5h",
      description: "Last 7 nights",
      icon: Moon,
      color: "text-chart-3",
    },
    {
      title: "Weekly Progress",
      value: "+12%",
      description: "Compared to last week",
      icon: TrendingUp,
      color: "text-chart-4",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Here's your wellness overview</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest tracked activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Morning Exercise", time: "Today at 7:00 AM", type: "Performance" },
                { name: "Meditation", time: "Today at 8:30 AM", type: "Habit" },
                { name: "8 hours sleep", time: "Last night", type: "Sleep" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                  <span className="text-xs font-medium text-primary">{activity.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Performance metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Weekly Streak", value: "5 days", progress: 71 },
                { label: "Goals Achieved", value: "8/10", progress: 80 },
                { label: "Overall Health", value: "Good", progress: 85 },
              ].map((metric, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className="font-medium">{metric.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${metric.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
