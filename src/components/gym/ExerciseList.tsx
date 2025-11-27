import { useState } from "react";
import { MoreVertical, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { deleteExercise, type Exercise } from "@/lib/gym-api";
import { EditExerciseDialog } from "./EditExerciseDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExerciseListProps {
  exercises: Exercise[];
  onExercisesChange: () => void;
  selectedFolderId: string | null;
}

export function ExerciseList({
  exercises,
  onExercisesChange,
  selectedFolderId,
}: ExerciseListProps) {
  const { toast } = useToast();
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  const handleDeleteExercise = async () => {
    if (!deletingExercise) return;

    try {
      await deleteExercise(deletingExercise.id);
      toast({
        title: "Success",
        description: "Exercise deleted successfully",
      });
      onExercisesChange();
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive",
      });
    } finally {
      setDeletingExercise(null);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No exercises yet</h3>
        <p className="text-muted-foreground mb-4">
          {selectedFolderId
            ? "This folder is empty. Add your first exercise to get started."
            : "Create your first exercise to start tracking your workouts."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-2">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">
                  {exercise.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{exercise.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {exercise.primary_muscle && (
                    <Badge variant="outline" className="text-xs">
                      {exercise.primary_muscle}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {exercise.unit.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingExercise(exercise)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingExercise(exercise)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingExercise && (
        <EditExerciseDialog
          exercise={editingExercise}
          open={!!editingExercise}
          onOpenChange={(open) => !open && setEditingExercise(null)}
          onSuccess={() => {
            setEditingExercise(null);
            onExercisesChange();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingExercise}
        onOpenChange={(open) => !open && setDeletingExercise(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingExercise?.name}"? This will also delete
              all associated workout history and statistics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExercise} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
