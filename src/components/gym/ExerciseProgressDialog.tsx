import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface ExerciseProgressDialogProps {
  exercise: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseProgressDialog({ exercise, open, onOpenChange }: ExerciseProgressDialogProps) {
  const { data: sets } = useQuery({
    queryKey: ['exercise-progress', exercise?.id],
    enabled: !!exercise,
    queryFn: async () => {
      if (!exercise) return [];
      
      const { data, error } = await supabase
        .from('set_entries')
        .select('*, gym_sessions!inner(session_index)')
        .eq('exercise_id', exercise.id)
        .order('timestamp');
      
      if (error) throw error;
      return data;
    }
  });

  const chartData = sets?.map((set: any) => ({
    day: `Day ${set.gym_sessions.session_index}`,
    weight: set.weight,
    reps: set.reps,
  })) || [];

  const { data: stats } = useQuery({
    queryKey: ['exercise-stats', exercise?.id],
    enabled: !!exercise,
    queryFn: async () => {
      if (!exercise) return null;
      
      const { data, error } = await supabase
        .from('exercise_stats')
        .select('*')
        .eq('exercise_id', exercise.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise.name} - Progress</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Independent tracking for this exercise
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">{stats.total_volume?.toFixed(0) || 0}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Est. 1RM</p>
                <p className="text-2xl font-bold">{stats.estimated_1rm?.toFixed(1) || 0} {exercise.unit}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Best Set</p>
                <p className="text-2xl font-bold">{stats.last_best_set_value?.toFixed(1) || 0} {exercise.unit}</p>
              </Card>
            </div>
          )}

          {chartData.length > 0 ? (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Weight Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data yet. Start logging sets to see your progress.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
