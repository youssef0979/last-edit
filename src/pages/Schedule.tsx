import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimelineView } from "@/components/schedule/TimelineView";
import { MiniMap } from "@/components/schedule/MiniMap";
import { AddBlockDialog } from "@/components/schedule/AddBlockDialog";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [zoom, setZoom] = useState(1);

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-sm"
            >
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Block
            </Button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Zoom:</span>
          <div className="flex gap-1">
            {[0.75, 1, 1.5, 2].map((z) => (
              <Button
                key={z}
                variant={zoom === z ? "default" : "outline"}
                size="sm"
                onClick={() => setZoom(z)}
                className="h-7 px-3"
              >
                {z}x
              </Button>
            ))}
          </div>
        </div>

        {/* Mini Map */}
        <MiniMap selectedDate={selectedDate} />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden">
        <TimelineView selectedDate={selectedDate} zoom={zoom} />
      </div>

      {/* Add Block Dialog */}
      <AddBlockDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        selectedDate={selectedDate}
      />
    </div>
  );
}
