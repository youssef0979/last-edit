import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TimeBlock } from "./TimeBlock";
import { toast } from "sonner";

interface TimelineViewProps {
  selectedDate: Date;
  zoom: number;
}

export function TimelineView({ selectedDate, zoom }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOverTime, setDragOverTime] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const createBlockMutation = useMutation({
    mutationFn: async (block: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("time_blocks")
        .insert({
          user_id: user.id,
          date: dateStr,
          ...block,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks", dateStr] });
      toast.success("Time block created");
    },
    onError: () => {
      toast.error("Failed to create time block");
    },
  });

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const hours = now.getHours();
      const hourWidth = 120 * zoom;
      scrollRef.current.scrollLeft = (hours - 2) * hourWidth;
    }
  }, [zoom]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourWidth = 120 * zoom;
  const snapInterval = 15; // 15-minute snapping

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (scrollRef.current) {
      const rect = scrollRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollRef.current.scrollLeft;
      const hour = Math.floor(x / hourWidth);
      const minutePercent = (x % hourWidth) / hourWidth;
      const minute = Math.round((minutePercent * 60) / snapInterval) * snapInterval;
      setDragOverTime(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverTime) {
      const [hours, minutes] = dragOverTime.split(":").map(Number);
      const endHours = hours + 1;
      createBlockMutation.mutate({
        title: "New Block",
        start_time: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`,
        end_time: `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`,
        color: "#3b82f6",
      });
    }
    setDragOverTime(null);
  };

  const timeToPixels = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours * 60 + minutes) * (hourWidth / 60);
  };

  const pixelsToTime = (pixels: number) => {
    const totalMinutes = Math.round((pixels / hourWidth) * 60);
    let hours = Math.floor(totalMinutes / 60);
    let minutes = Math.round((totalMinutes % 60) / snapInterval) * snapInterval;
    
    // Handle edge case where minutes rounds to 60
    if (minutes >= 60) {
      hours += 1;
      minutes = 0;
    }
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
          <div
            className="relative bg-background"
            style={{ width: `${24 * hourWidth}px`, minHeight: "200px" }}
          >
            {/* Hour markers */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-shrink-0 border-r border-border py-2 px-3"
                  style={{ width: `${hourWidth}px` }}
                >
                  <div className="text-sm font-medium text-foreground">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                </div>
              ))}
            </div>

            {/* Time blocks track */}
            <div className="relative py-4" style={{ height: "160px" }}>
              {/* Grid lines (15-min intervals) */}
              {hours.flatMap((hour) =>
                [0, 15, 30, 45].map((minute) => {
                  const x = timeToPixels(`${hour}:${minute}:00`);
                  return (
                    <div
                      key={`${hour}-${minute}`}
                      className={`absolute top-0 bottom-0 ${
                        minute === 0 ? "border-l border-border" : "border-l border-border/30"
                      }`}
                      style={{ left: `${x}px` }}
                    />
                  );
                })
              )}

              {/* Drop zone indicator */}
              {dragOverTime && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary/50 rounded-full animate-pulse"
                  style={{ left: `${timeToPixels(dragOverTime)}px` }}
                />
              )}

              {/* Time blocks */}
              {blocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  timeToPixels={timeToPixels}
                  pixelsToTime={pixelsToTime}
                  hourWidth={hourWidth}
                  snapInterval={snapInterval}
                />
              ))}
            </div>

            {/* Current time indicator */}
            {format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
                style={{
                  left: `${timeToPixels(format(new Date(), "HH:mm:00"))}px`,
                }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-destructive" />
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
