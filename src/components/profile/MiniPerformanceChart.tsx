import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniPerformanceChartProps {
  data: { date: string; score: number | null }[];
}

export function MiniPerformanceChart({ data }: MiniPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
