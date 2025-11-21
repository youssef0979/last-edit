import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniSleepChartProps {
  data: { date: string; hours: number | null }[];
}

export function MiniSleepChart({ data }: MiniSleepChartProps) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="hours"
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
