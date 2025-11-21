import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PerformanceChart } from "./PerformanceChart";
import { format } from "date-fns";

interface Habit {
  id: string;
  name: string;
  color: string;
}

interface Cycle {
  id: string;
  start_date: string;
  end_date: string;
}

interface Score {
  habit_id: string;
  date: string;
  score: number;
}

interface PreviousTracksDialogProps {
  habits: Habit[];
}

export function PreviousTracksDialog({ habits }: PreviousTracksDialogProps) {
  const [open, setOpen] = useState(false);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPreviousCycles = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("performance_cycles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", false)
        .order("start_date", { ascending: false });

      if (error) throw error;

      setCycles(data || []);
      
      if (data && data.length > 0) {
        setSelectedCycle(data[0]);
        await loadCycleScores(data[0]);
      }
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

  const loadCycleScores = async (cycle: Cycle) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("performance_scores")
        .select("habit_id, date, score")
        .eq("user_id", user.id)
        .gte("date", cycle.start_date)
        .lte("date", cycle.end_date);

      if (error) throw error;

      setScores(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      loadPreviousCycles();
    }
  }, [open]);

  const handleCycleChange = async (cycle: Cycle) => {
    setSelectedCycle(cycle);
    await loadCycleScores(cycle);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Previous Tracks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Previous 2-Week Cycles</DialogTitle>
          <DialogDescription>
            View your past performance tracking cycles
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No previous cycles found. Complete your first 2-week cycle to see it here!
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {cycles.map(cycle => (
                <Button
                  key={cycle.id}
                  variant={selectedCycle?.id === cycle.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCycleChange(cycle)}
                >
                  {format(new Date(cycle.start_date), "MMM d")} - {format(new Date(cycle.end_date), "MMM d")}
                </Button>
              ))}
            </div>
            
            {selectedCycle && (
              <PerformanceChart
                habits={habits}
                scores={scores}
                startDate={new Date(selectedCycle.start_date)}
                endDate={new Date(selectedCycle.end_date)}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
