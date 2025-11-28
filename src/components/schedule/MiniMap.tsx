import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface MiniMapProps {
  selectedDate: Date;
}

export function MiniMap({ selectedDate }: MiniMapProps) {
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: blocks = [] } = useQuery({
    queryKey: ["time-blocks", dateStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .order("start_time");

      if (error) throw error;
      return data;
    },
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const timeToPercent = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <div className="text-xs text-muted-foreground mb-2">Day Overview</div>
      <div className="relative h-6 bg-background rounded border border-border overflow-hidden">
        {/* Hour markers */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute top-0 bottom-0 border-l border-border/30"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}

        {/* Time blocks */}
        {blocks.map((block) => {
          const start = timeToPercent(block.start_time);
          const end = timeToPercent(block.end_time);
          const width = end - start;

          return (
            <div
              key={block.id}
              className="absolute top-1 bottom-1 rounded-sm transition-all hover:scale-105 cursor-pointer"
              style={{
                left: `${start}%`,
                width: `${width}%`,
                backgroundColor: block.color,
              }}
              title={`${block.title} (${format(
                new Date(`2000-01-01T${block.start_time}`),
                "HH:mm"
              )} - ${format(new Date(`2000-01-01T${block.end_time}`), "HH:mm")})`}
            />
          );
        })}

        {/* Current time indicator */}
        {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
            style={{
              left: `${timeToPercent(format(new Date(), "HH:mm:00"))}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
