import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarNote {
  date: string;
  title: string;
  color: string;
}

interface CalendarViewProps {
  currentMonth: Date;
  notes: CalendarNote[];
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
}

export function CalendarView({ currentMonth, notes, selectedDate, onMonthChange, onDateSelect }: CalendarViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = new Date();

  const getNotesForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return notes.filter(note => note.date === dateStr);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const dayNotes = getNotesForDate(day);
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={idx}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "min-h-24 p-2 rounded-lg border transition-all text-left relative",
                  "hover:border-primary hover:shadow-sm",
                  isToday && "border-primary bg-primary/5",
                  isSelected && "ring-2 ring-primary",
                  !isCurrentMonth && "opacity-40"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "text-primary"
                )}>
                  {format(day, "d")}
                </div>
                
                {dayNotes.length > 0 && (
                  <div className="space-y-1">
                    {dayNotes.slice(0, 2).map((note, i) => (
                      <div
                        key={i}
                        className="text-xs truncate px-1 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${note.color}20`,
                          color: note.color,
                          borderLeft: `2px solid ${note.color}`
                        }}
                      >
                        {note.title}
                      </div>
                    ))}
                    {dayNotes.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayNotes.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
