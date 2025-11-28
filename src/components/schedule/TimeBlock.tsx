import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { GripVertical, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QuickActionsMenu } from "./QuickActionsMenu";

interface TimeBlockProps {
  block: any;
  timeToPixels: (time: string) => number;
  pixelsToTime: (pixels: number) => string;
  hourWidth: number;
  snapInterval: number;
}

export function TimeBlock({
  block,
  timeToPixels,
  pixelsToTime,
  hourWidth,
  snapInterval,
}: TimeBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const [dragStart, setDragStart] = useState<number>(0);
  const blockRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const updateBlockMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from("time_blocks")
        .update(updates)
        .eq("id", block.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
    },
    onError: () => {
      toast.error("Failed to update time block");
    },
  });

  const handleMouseDown = (e: React.MouseEvent, type: "drag" | "resize-left" | "resize-right") => {
    e.preventDefault();
    setDragStart(e.clientX);
    if (type === "drag") {
      setIsDragging(true);
    } else {
      setIsResizing(type === "resize-left" ? "left" : "right");
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const delta = e.clientX - dragStart;
    const startPx = timeToPixels(block.start_time);
    const endPx = timeToPixels(block.end_time);

    if (isDragging) {
      const newStartPx = Math.max(0, startPx + delta);
      const newEndPx = newStartPx + (endPx - startPx);
      const newStartTime = pixelsToTime(newStartPx);
      const newEndTime = pixelsToTime(newEndPx);

      updateBlockMutation.mutate({
        start_time: newStartTime,
        end_time: newEndTime,
      });
    } else if (isResizing === "left") {
      const newStartPx = Math.max(0, Math.min(startPx + delta, endPx - hourWidth / 4));
      const newStartTime = pixelsToTime(newStartPx);
      updateBlockMutation.mutate({ start_time: newStartTime });
    } else if (isResizing === "right") {
      const newEndPx = Math.max(endPx + delta, startPx + hourWidth / 4);
      const newEndTime = pixelsToTime(newEndPx);
      updateBlockMutation.mutate({ end_time: newEndTime });
    }

    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  // Attach global listeners
  useState(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  });

  const startPx = timeToPixels(block.start_time);
  const endPx = timeToPixels(block.end_time);
  const width = endPx - startPx;

  return (
    <div
      ref={blockRef}
      className={cn(
        "absolute top-4 bottom-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 group cursor-move border border-border/50",
        isDragging && "opacity-70 scale-105",
        isResizing && "opacity-80"
      )}
      style={{
        left: `${startPx}px`,
        width: `${width}px`,
        backgroundColor: block.color + "20",
        borderLeftColor: block.color,
        borderLeftWidth: "3px",
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      {/* Resize handle - left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40 rounded-l-lg"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, "resize-left");
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-2 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs font-medium text-foreground/90 mb-1">
              {block.icon && <span>{block.icon}</span>}
              <span className="truncate">{block.title}</span>
            </div>
            {block.description && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {block.description}
              </div>
            )}
          </div>
          <QuickActionsMenu block={block} />
        </div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(`2000-01-01T${block.start_time}`), "HH:mm")} -{" "}
          {format(new Date(`2000-01-01T${block.end_time}`), "HH:mm")}
        </div>
      </div>

      {/* Resize handle - right */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40 rounded-r-lg"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, "resize-right");
        }}
      >
        <GripVertical className="h-3 w-3 absolute right-0 top-1/2 -translate-y-1/2 text-primary" />
      </div>
    </div>
  );
}
