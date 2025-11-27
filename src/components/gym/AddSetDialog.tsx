import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  exercises: any[];
  onSuccess: () => void;
}

export function AddSetDialog({ open, onOpenChange, sessionId, exercises, onSuccess }: AddSetDialogProps) {
  const [exerciseId, setExerciseId] = useState("");
  const [setNumber, setSetNumber] = useState("1");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedExercise = exercises.find(e => e.id === exerciseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseId || !weight || !reps) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('set_entries')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: parseInt(setNumber),
          weight: parseFloat(weight),
          reps: parseInt(reps),
          unit: selectedExercise?.unit || 'kg',
        });

      if (error) throw error;

      toast({ title: "Set logged" });
      setExerciseId("");
      setSetNumber("1");
      setWeight("");
      setReps("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Set</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise">Exercise</Label>
            <Select value={exerciseId} onValueChange={setExerciseId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="set">Set Number</Label>
            <Input
              id="set"
              type="number"
              min="1"
              value={setNumber}
              onChange={(e) => setSetNumber(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight ({selectedExercise?.unit || 'kg'})</Label>
              <Input
                id="weight"
                type="number"
                step="0.5"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                min="1"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log Set"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
