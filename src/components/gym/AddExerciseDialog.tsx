import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createExercise, getExercises, type ExerciseFolder } from "@/lib/gym-api";

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  folders: ExerciseFolder[];
  defaultFolderId?: string | null;
}

export function AddExerciseDialog({
  open,
  onOpenChange,
  onSuccess,
  folders,
  defaultFolderId,
}: AddExerciseDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string | undefined>(defaultFolderId || undefined);
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultFolderId) {
      setFolderId(defaultFolderId);
    }
  }, [defaultFolderId]);

  const checkDuplicateName = async (exerciseName: string): Promise<boolean> => {
    try {
      const exercises = await getExercises();
      return exercises.some(
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    const isDuplicate = await checkDuplicateName(name.trim());
    if (isDuplicate) {
      toast({
        title: "Warning",
        description: "An exercise with this name already exists. Consider using a different name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createExercise({
        name: name.trim(),
        folderId: folderId || null,
        primaryMuscle: primaryMuscle.trim() || undefined,
        unit,
      });
      
      toast({
        title: "Success",
        description: "Exercise created successfully",
      });
      
      setName("");
      setFolderId(defaultFolderId || undefined);
      setPrimaryMuscle("");
      setUnit('kg');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create exercise:', error);
      toast({
        title: "Error",
        description: "Failed to create exercise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
            <DialogDescription>
              Create a new exercise to track in your workouts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exercise Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Bench Press, Squats..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder (Optional)</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="None (Root)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root)</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryMuscle">Primary Muscle (Optional)</Label>
              <Input
                id="primaryMuscle"
                placeholder="e.g., Chest, Legs, Back..."
                value={primaryMuscle}
                onChange={(e) => setPrimaryMuscle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Weight Unit *</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as 'kg' | 'lbs')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
