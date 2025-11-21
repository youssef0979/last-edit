import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PerformanceHabitCardProps {
  habit: {
    id: string;
    name: string;
    color: string;
    is_active: boolean;
  };
  avgScore: number;
  totalScores: number;
  onDelete: () => void;
}

export function PerformanceHabitCard({ habit, avgScore, totalScores, onDelete }: PerformanceHabitCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First delete all performance scores for this habit
      await supabase
        .from("performance_scores")
        .delete()
        .eq("performance_habit_id", habit.id)
        .eq("user_id", user.id);

      // Then delete the performance habit itself
      const { error } = await supabase
        .from("performance_habits")
        .delete()
        .eq("id", habit.id)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      toast({
        title: "Habit deleted",
        description: `"${habit.name}" has been removed permanently from Performance Tracker.`
      });
      
      // Trigger parent refresh
      onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
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
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Avg: {avgScore > 0 ? `${avgScore}/10` : "—"}
          </Badge>
          <Badge variant="secondary">
            {totalScores} score{totalScores !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
