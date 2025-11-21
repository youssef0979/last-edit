import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Habit {
  id: string;
  name: string;
  color: string;
}

interface ScoreInputDialogProps {
  date: Date;
  habits: Habit[];
  existingScores: Record<string, number>;
  onScoreUpdated: () => void;
  canEdit: boolean;
}

export function ScoreInputDialog({ 
  date, 
  habits, 
  existingScores, 
  onScoreUpdated,
  canEdit 
}: ScoreInputDialogProps) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(existingScores);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Cannot edit future dates",
        description: "Please complete today's score first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const dateStr = format(date, "yyyy-MM-dd");

      // Insert or update scores for each habit
      for (const habit of habits) {
        if (scores[habit.id]) {
          const { error } = await supabase
            .from("performance_scores")
            .upsert({
              user_id: user.id,
              habit_id: habit.id,
              date: dateStr,
              score: scores[habit.id],
            }, {
              onConflict: "habit_id,date",
            });

          if (error) throw error;
        }
      }

      toast({
        title: "Success",
        description: "Scores saved successfully",
      });

      setOpen(false);
      onScoreUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={!canEdit}
        >
          <Edit className="h-4 w-4" />
          {Object.keys(existingScores).length > 0 ? "Edit" : "Add"} Scores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Input Scores for {format(date, "MMM d, yyyy")}</DialogTitle>
          <DialogDescription>
            Rate each habit from 1 to 10
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: habit.color }}
                  />
                  {habit.name}
                </Label>
                <span className="text-2xl font-bold text-primary">
                  {scores[habit.id] || 5}
                </span>
              </div>
              <Slider
                value={[scores[habit.id] || 5]}
                onValueChange={(value) => 
                  setScores(prev => ({ ...prev, [habit.id]: value[0] }))
                }
                min={1}
                max={10}
                step={1}
                disabled={isLoading}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 (Poor)</span>
                <span>10 (Excellent)</span>
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <p className="text-center text-muted-foreground">
              No habits added yet. Add a habit first to start tracking.
            </p>
          )}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || habits.length === 0}
          >
            {isLoading ? "Saving..." : "Save Scores"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
