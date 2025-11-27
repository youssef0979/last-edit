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
import { updateExercise, getFolders, type Exercise, type ExerciseFolder } from "@/lib/gym-api";

interface EditExerciseDialogProps {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditExerciseDialog({
  exercise,
  open,
  onOpenChange,
  onSuccess,
}: EditExerciseDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(exercise.name);
  const [folderId, setFolderId] = useState<string | undefined>(exercise.folder_id || undefined);
  const [primaryMuscle, setPrimaryMuscle] = useState(exercise.primary_muscle || "");
  const [unit, setUnit] = useState<'kg' | 'lbs'>(exercise.unit);
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(exercise.name);
    setFolderId(exercise.folder_id || undefined);
    setPrimaryMuscle(exercise.primary_muscle || "");
    setUnit(exercise.unit);
    loadFolders();
  }, [exercise]);

  async function loadFolders() {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }

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

    setLoading(true);
    try {
      await updateExercise(exercise.id, {
        name: name.trim(),
        folderId: folderId === "none" ? null : folderId,
        primaryMuscle: primaryMuscle.trim() || undefined,
        unit,
      });
      
      toast({
        title: "Success",
        description: "Exercise updated successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to update exercise:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise",
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
            <DialogTitle>Edit Exercise</DialogTitle>
            <DialogDescription>
              Update exercise details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exercise Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder (Optional)</Label>
              <Select value={folderId || "none"} onValueChange={setFolderId}>
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
