import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Flame, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    color: string;
    difficulty_weight: number;
    priority: string;
    is_preloaded: boolean;
  };
  completed: boolean;
  streak: number;
  isLocked: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, completed, streak, isLocked, onToggle, onDelete }: HabitCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("habits").delete().eq("id", habit.id);
      if (error) throw error;
      
      toast({
        title: "Habit deleted",
        description: `"${habit.name}" has been removed.`
      });
      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDifficultyLabel = (weight: number) => {
    switch (weight) {
      case 1: return "Easy";
      case 2: return "Medium";
      case 3: return "Hard";
      default: return "Easy";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-primary";
      case "low": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className={completed ? "border-2" : ""} style={{ borderColor: completed ? habit.color : undefined }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="h-4 w-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: habit.color }}
            />
            <CardTitle className="text-lg truncate">{habit.name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{getDifficultyLabel(habit.difficulty_weight)}</Badge>
          <Badge variant="outline" className={getPriorityColor(habit.priority)}>
            {habit.priority}
          </Badge>
          {streak > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3" />
              {streak} day{streak !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Complete today's habits first</span>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={completed}
                onCheckedChange={onToggle}
                disabled={isLocked}
              />
              <span className="text-sm">{completed ? "Completed today" : "Mark as complete"}</span>
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
