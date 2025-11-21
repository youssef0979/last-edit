import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Cycle {
  id: string;
  start_date: string;
  end_date: string;
  total_points: number;
  completion_rate: number;
}

export function PreviousCyclesDialog() {
  const [open, setOpen] = useState(false);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCycles();
    }
  }, [open]);

  const loadCycles = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cyclesData } = await supabase
        .from("habit_cycles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", false)
        .order("start_date", { ascending: false });

      if (cyclesData) {
        const cyclesWithStats = await Promise.all(
          cyclesData.map(async (cycle) => {
            const { data: completions } = await supabase
              .from("habit_completions")
              .select(`
                *,
                habits!inner(difficulty_weight)
              `)
              .eq("user_id", user.id)
              .gte("date", cycle.start_date)
              .lte("date", cycle.end_date);

            const totalPoints = completions?.reduce((sum, c: any) => 
              c.completed ? sum + (c.habits?.difficulty_weight || 1) : sum, 0
            ) || 0;

            const totalPossible = completions?.reduce((sum, c: any) => 
              sum + (c.habits?.difficulty_weight || 1), 0
            ) || 1;

            const completionRate = Math.round((totalPoints / totalPossible) * 100);

            return {
              id: cycle.id,
              start_date: cycle.start_date,
              end_date: cycle.end_date,
              total_points: totalPoints,
              completion_rate: completionRate
            };
          })
        );

        setCycles(cyclesWithStats);
      }
    } catch (error) {
      console.error("Error loading cycles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Previous Cycles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Previous 2-Week Cycles</DialogTitle>
          <DialogDescription>
            View your past habit tracking cycles and performance
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No previous cycles yet
            </div>
          ) : (
            cycles.map((cycle) => (
              <Card key={cycle.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(new Date(cycle.start_date), "MMM d")} - {format(new Date(cycle.end_date), "MMM d, yyyy")}
                  </CardTitle>
                  <CardDescription>2-week cycle completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">{cycle.total_points}</div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{cycle.completion_rate}%</div>
                      <div className="text-sm text-muted-foreground">Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
