import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: any[];
  onSuccess: () => void;
}

export function AddExerciseDialog({ open, onOpenChange, folders, onSuccess }: AddExerciseDialogProps) {
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string>("none");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Pre-select folder if only one is provided
  useState(() => {
    if (folders.length === 1 && !folderId) {
      setFolderId(folders[0].id);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('exercises')
        .insert({
          name: name.trim(),
          user_id: user.id,
          folder_id: folderId === "none" ? null : folderId,
          primary_muscle: primaryMuscle || null,
          unit,
        });

      if (error) throw error;

      toast({ title: "Exercise created" });
      setName("");
      setFolderId("none");
      setPrimaryMuscle("");
      setUnit("kg");
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
          <DialogTitle>Add Exercise</DialogTitle>
          {folders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This will create a standalone exercise
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Exercise Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bench Press"
              required
            />
          </div>

          {folders.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="folder">Muscle Group (Optional)</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Group</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {folders.length === 1 && (
            <div className="space-y-2">
              <Label>Muscle Group</Label>
              <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                {folders[0].title}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="muscle">Primary Muscle (Optional)</Label>
            <Input
              id="muscle"
              value={primaryMuscle}
              onChange={(e) => setPrimaryMuscle(e.target.value)}
              placeholder="e.g., Pectorals"
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
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
