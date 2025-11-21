import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Cloud, Sunrise } from "lucide-react";

const Sleep = () => {
  const sleepData = [
    { date: "Last night", duration: "7h 30m", quality: "Good" },
    { date: "2 days ago", duration: "8h 15m", quality: "Excellent" },
    { date: "3 days ago", duration: "6h 45m", quality: "Fair" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary p-2">
          <Moon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">Sleep Tracker</h1>
          <p className="text-muted-foreground">Monitor your sleep patterns and quality</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Last Night", value: "7h 30m", icon: Moon, color: "text-chart-3" },
          { title: "Weekly Average", value: "7h 45m", icon: Cloud, color: "text-chart-1" },
          { title: "Sleep Quality", value: "Good", icon: Sunrise, color: "text-chart-2" },
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
          <CardTitle>Recent Sleep History</CardTitle>
          <CardDescription>Your sleep duration and quality over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sleepData.map((sleep, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{sleep.date}</p>
                  <p className="text-sm text-muted-foreground">{sleep.duration}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sleep.quality === "Excellent" ? "bg-chart-1/20 text-chart-1" :
                  sleep.quality === "Good" ? "bg-chart-2/20 text-chart-2" :
                  "bg-chart-4/20 text-chart-4"
                }`}>
                  {sleep.quality}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep Trends</CardTitle>
          <CardDescription>Analyze your sleep patterns over time</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Sleep trend charts and detailed analysis will appear here
        </CardContent>
      </Card>
    </div>
  );
};

export default Sleep;
