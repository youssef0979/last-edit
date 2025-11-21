import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Meh, Frown } from "lucide-react";

interface SleepEntry {
  date: string;
  hours_slept: number;
  mood: string;
  sleep_quality?: number;
}

interface SleepChartProps {
  entries: SleepEntry[];
  startDate: Date;
  endDate: Date;
}

export function SleepChart({ entries, startDate, endDate }: SleepChartProps) {
  const dates = eachDayOfInterval({ start: startDate, end: endDate });
  
  const chartData = dates.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const entry = entries.find(e => e.date === dateStr);
    
    return {
      date: format(date, "MMM d"),
      fullDate: dateStr,
      hours: entry ? Number(entry.hours_slept) : null,
      mood: entry?.mood || null,
      quality: entry?.sleep_quality || null,
    };
  });

  const getMoodIcon = (mood: string | null) => {
    switch (mood) {
      case 'happy':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'neutral':
        return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'sad':
        return <Frown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length || payload[0].value === null) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg">
        <p className="font-medium mb-2">{data.date}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Hours:</span>
            <span className="font-medium">{data.hours}h</span>
          </div>
          {data.quality && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Quality:</span>
              <span className="font-medium">{data.quality}/10</span>
            </div>
          )}
          {data.mood && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Mood:</span>
              {getMoodIcon(data.mood)}
              <span className="font-medium capitalize">{data.mood}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const avgHours = entries.length > 0
    ? (entries.reduce((sum, e) => sum + Number(e.hours_slept), 0) / entries.length).toFixed(1)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep Pattern</CardTitle>
        <CardDescription>
          {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")} • Avg: {avgHours}h
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              domain={[0, 24]} 
              ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
