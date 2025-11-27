import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditExerciseDialogProps {
  exercise: any;
  folders: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditExerciseDialog({ exercise, folders, open, onOpenChange, onSuccess }: EditExerciseDialogProps) {
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setFolderId(exercise.folder_id || "");
      setPrimaryMuscle(exercise.primary_muscle || "");
      setUnit(exercise.unit);
    }
  }, [exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !exercise) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          name: name.trim(),
          folder_id: folderId || null,
          primary_muscle: primaryMuscle || null,
          unit,
        })
        .eq('id', exercise.id);

      if (error) throw error;

      toast({ title: "Exercise updated" });
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
          <DialogTitle>Edit Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Exercise Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Muscle Group (Optional)</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Group</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscle">Primary Muscle (Optional)</Label>
            <Input
              id="muscle"
              value={primaryMuscle}
              onChange={(e) => setPrimaryMuscle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Weight Unit</Label>
            <Select value={unit} onValueChange={(v: "kg" | "lbs") => setUnit(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
