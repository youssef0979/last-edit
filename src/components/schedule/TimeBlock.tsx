import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { StickyNote, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { NotePreviewDialog } from "./NotePreviewDialog";

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
  const [showNotePreview, setShowNotePreview] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch linked note data if note_id exists
  const { data: linkedNote } = useQuery({
    queryKey: ["linked-note", block.note_id],
    queryFn: async () => {
      if (!block.note_id) return null;

      const { data, error } = await supabase
        .from("notes")
        .select("checklist")
        .eq("id", block.note_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!block.note_id,
  });

  // Calculate checklist progress
  const checklistProgress = linkedNote?.checklist
    ? (() => {
        const checklist = JSON.parse(JSON.stringify(linkedNote.checklist));
        const completed = checklist?.items?.filter((item: any) => item.checked).length || 0;
        const total = checklist?.items?.length || 0;
        return { completed, total };
      })()
    : null;

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
    e.stopPropagation();
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
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  const startPx = timeToPixels(block.start_time);
  const endPx = timeToPixels(block.end_time);
  const width = endPx - startPx;

  const handleBlockClick = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing && block.note_id) {
      e.stopPropagation();
      setShowNotePreview(true);
    }
  };

  return (
    <>
      <div
        ref={blockRef}
        className={cn(
          "absolute top-4 bottom-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 group border border-border/50",
          isDragging && "opacity-70 scale-105",
          isResizing && "opacity-80",
          block.note_id && "cursor-pointer"
        )}
        style={{
          left: `${startPx}px`,
          width: `${width}px`,
          backgroundColor: block.color + "20",
          borderLeftColor: block.color,
          borderLeftWidth: "3px",
        }}
        onMouseDown={(e) => handleMouseDown(e, "drag")}
        onClick={handleBlockClick}
      >
      {/* Resize handle - left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-primary/10 hover:bg-primary/30 transition-colors rounded-l-lg z-10"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, "resize-left");
        }}
      >
        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
      </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-2 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs font-medium text-foreground/90 mb-1">
                {block.note_id && <StickyNote className="h-3 w-3 text-primary" />}
                {block.icon && <span>{block.icon}</span>}
                <span className="truncate">{block.title}</span>
              </div>
              {block.description && (
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {block.description}
                </div>
              )}
              {/* Checklist Progress */}
              {checklistProgress && checklistProgress.total > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span className="text-xs text-foreground/80">
                    {checklistProgress.completed}/{checklistProgress.total}
                  </span>
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
        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-primary/10 hover:bg-primary/30 transition-colors rounded-r-lg z-10"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, "resize-right");
        }}
      >
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
      </div>
    </div>

    {/* Note Preview Dialog */}
    {block.note_id && (
      <NotePreviewDialog
        noteId={block.note_id}
        open={showNotePreview}
        onOpenChange={setShowNotePreview}
      />
    )}
  </>
  );
}
