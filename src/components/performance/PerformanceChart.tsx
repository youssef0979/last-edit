import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Habit {
  id: string;
  name: string;
  color: string;
}

interface Score {
  performance_habit_id: string;
  date: string;
  score: number;
}

interface PerformanceChartProps {
  habits: Habit[];
  scores: Score[];
  startDate: Date;
  endDate: Date;
}

export function PerformanceChart({ habits, scores, startDate, endDate }: PerformanceChartProps) {
  // Generate all dates in the 2-week range
  const dates = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Transform data for recharts
  const chartData = dates.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dataPoint: any = {
      date: format(date, "MMM d"),
      fullDate: dateStr,
    };
    
    habits.forEach(habit => {
      const score = scores.find(s => s.performance_habit_id === habit.id && s.date === dateStr);
      dataPoint[habit.id] = score ? score.score : null;
    });
    
    return dataPoint;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any) => {
          if (entry.value === null) return null;
          const habit = habits.find(h => h.id === entry.dataKey);
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{habit?.name}:</span>
              <span className="font-medium">{entry.value}/10</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle>Current 2-Week Cycle</CardTitle>
        <CardDescription>
          {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              domain={[0, 10]} 
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => {
                const habit = habits.find(h => h.id === value);
                return habit?.name || value;
              }}
            />
            {habits.map(habit => (
              <Line
                key={habit.id}
                type="monotone"
                dataKey={habit.id}
                stroke={habit.color}
                strokeWidth={3}
                dot={{ fill: habit.color, r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                connectNulls={false}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
