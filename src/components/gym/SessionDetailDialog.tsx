import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Dumbbell, Trash2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddSetDialog } from "./AddSetDialog";
import { ExerciseProgressDialog } from "./ExerciseProgressDialog";

interface SessionDetailDialogProps {
  session: any;
  exercises: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function SessionDetailDialog({ session, exercises, open, onOpenChange, onUpdate }: SessionDetailDialogProps) {
  const [addSetOpen, setAddSetOpen] = useState(false);
  const [progressDialogExercise, setProgressDialogExercise] = useState<any>(null);
  const { toast } = useToast();

  // Epley formula to calculate estimated 1RM
  const calculateEpley1RM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  };

  const { data: sets, refetch: refetchSets } = useQuery({
    queryKey: ['session-sets', session?.id],
    enabled: !!session,
    queryFn: async () => {
      if (!session) return [];
      
      const { data, error } = await supabase
        .from('set_entries')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp');
      
      if (error) throw error;
      return data;
    }
  });

  // Group sets by exercise and calculate best set
  const setsByExercise = sets?.reduce((acc: Record<string, any[]>, set) => {
    if (!acc[set.exercise_id]) {
      acc[set.exercise_id] = [];
    }
    acc[set.exercise_id].push(set);
    return acc;
  }, {}) || {};

  const exercisesInSession = Object.keys(setsByExercise).map(exerciseId => {
    const exercise = exercises.find(e => e.id === exerciseId);
    const exerciseSets = setsByExercise[exerciseId];
    
    // Calculate best set using Epley formula
    const setsWithEstimate = exerciseSets.map(set => ({
      ...set,
      estimated1RM: calculateEpley1RM(set.weight, set.reps)
    }));
    const bestSet = setsWithEstimate.reduce((best, current) => 
      current.estimated1RM > best.estimated1RM ? current : best
    );
    
    return {
      exercise,
      sets: exerciseSets,
      bestSet,
      totalVolume: exerciseSets.reduce((sum, set) => sum + (set.weight * set.reps), 0)
    };
  });

  const handleCompleteSession = async () => {
    if (!session) return;

    if (!sets || sets.length === 0) {
      toast({
        title: "Cannot complete empty session",
        description: "Log at least one set before completing the session.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('gym_sessions')
        .update({ status: 'completed', scheduled_date: new Date().toISOString() })
        .eq('id', session.id);

      if (error) throw error;

      toast({ 
        title: "Session completed!",
        description: `Logged ${sets.length} sets across ${exercisesInSession.length} exercises.`
      });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!session) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Session {session.session_index}</span>
              {sets && sets.length > 0 && (
                <div className="text-sm font-normal text-muted-foreground">
                  {sets.length} sets • {exercisesInSession.length} exercises
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex gap-2">
              <Button onClick={() => setAddSetOpen(true)} className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                Log Set
              </Button>
              {session.status === 'planned' && sets && sets.length > 0 && (
                <Button onClick={handleCompleteSession} variant="default" className="gap-2">
                  Complete Session
                </Button>
              )}
            </div>

            {exercisesInSession.length > 0 ? (
              <div className="space-y-4">
                {exercisesInSession.map(({ exercise, sets: exerciseSets, bestSet, totalVolume }) => (
                  <Card key={exercise?.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{exercise?.name || 'Unknown'}</h3>
                            <p className="text-xs text-muted-foreground">
                              {exerciseSets.length} set{exerciseSets.length !== 1 ? 's' : ''} • {totalVolume.toFixed(0)} {exercise?.unit} total volume
                            </p>
                            <p className="text-xs font-medium text-primary mt-1">
                              Best Set: {bestSet.weight} {exercise?.unit} × {bestSet.reps} reps (Est. 1RM: {calculateEpley1RM(bestSet.weight, bestSet.reps).toFixed(1)} {exercise?.unit})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{exercise?.unit}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProgressDialogExercise(exercise)}
                            className="gap-1"
                          >
                            <TrendingUp className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pl-12">
                        {exerciseSets.map((set, index) => (
                          <div key={set.id} className="flex items-center justify-between text-sm border-l-2 border-primary/20 pl-3 py-1">
                            <span className="text-muted-foreground">Set {index + 1}</span>
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{set.weight} {exercise?.unit}</span>
                              <span className="text-muted-foreground">×</span>
                              <span className="font-medium">{set.reps} reps</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('set_entries')
                                      .delete()
                                      .eq('id', set.id);
                                    if (error) throw error;
                                    toast({ title: "Set removed" });
                                    refetchSets();
                                  } catch (error: any) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No sets logged yet</p>
                <p className="text-sm">Click "Log Set" to record your first exercise</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddSetDialog
        open={addSetOpen}
        onOpenChange={setAddSetOpen}
        sessionId={session?.id}
        exercises={exercises}
        onSuccess={refetchSets}
      />

      {progressDialogExercise && (
        <ExerciseProgressDialog
          exercise={progressDialogExercise}
          open={!!progressDialogExercise}
          onOpenChange={(open) => !open && setProgressDialogExercise(null)}
        />
      )}
    </>
  );
}
