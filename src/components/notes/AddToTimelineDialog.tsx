import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface AddToTimelineDialogProps {
  note: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeBlockSchema = z.object({
  title: z.string().max(200, "Title must be less than 200 characters"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

export function AddToTimelineDialog({ note, open, onOpenChange }: AddToTimelineDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const queryClient = useQueryClient();

  const createTimeBlockMutation = useMutation({
    mutationFn: async () => {
      // Validate input
      try {
        timeBlockSchema.parse({
          title: note.title || "Untitled",
          start_time: startTime,
          end_time: endTime,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("time_blocks")
        .insert({
          user_id: user.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          title: note.title || "Untitled Note",
          description: note.body || null,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          color: note.color || "#3b82f6",
          icon: note.icon || null,
          note_id: note.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
      toast.success("Added to timeline");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add to timeline");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Timeline</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Preview of note */}
          <div className="rounded-lg p-4 border border-border" style={{ backgroundColor: note.color }}>
            <div className="flex items-start gap-2 mb-2">
              {note.icon && <span className="text-xl">{note.icon}</span>}
              <h4 className="font-semibold text-foreground">{note.title || "Untitled"}</h4>
            </div>
            {note.body && (
              <p className="text-sm text-foreground/80 line-clamp-2">{note.body}</p>
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => createTimeBlockMutation.mutate()}>
            Add to Timeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
