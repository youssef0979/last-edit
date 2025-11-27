import { Dumbbell, Trash2, Edit, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { EditExerciseDialog } from "./EditExerciseDialog";
import { DeleteExerciseDialog } from "./DeleteExerciseDialog";
import { ExerciseProgressDialog } from "./ExerciseProgressDialog";

interface ExerciseListProps {
  exercises: any[];
  folders: any[];
  onUpdate: () => void;
}

export function ExerciseList({ exercises, folders, onUpdate }: ExerciseListProps) {
  const [editExercise, setEditExercise] = useState<any>(null);
  const [deleteExercise, setDeleteExercise] = useState<any>(null);
  const [progressExercise, setProgressExercise] = useState<any>(null);

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "No Group";
    return folders.find(f => f.id === folderId)?.title || "Unknown";
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{exercise.name}</h3>
                    <p className="text-xs text-muted-foreground">{getFolderName(exercise.folder_id)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {exercise.primary_muscle && (
                  <Badge variant="secondary">{exercise.primary_muscle}</Badge>
                )}
                <Badge variant="outline">{exercise.unit}</Badge>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setProgressExercise(exercise)}
                >
                  <TrendingUp className="h-4 w-4" />
                  Progress
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditExercise(exercise)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteExercise(exercise)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No exercises yet. Add your first exercise to start tracking.</p>
        </div>
      )}

      <EditExerciseDialog
        exercise={editExercise}
        folders={folders}
        open={!!editExercise}
        onOpenChange={(open) => !open && setEditExercise(null)}
        onSuccess={onUpdate}
      />

      <DeleteExerciseDialog
        exercise={deleteExercise}
        open={!!deleteExercise}
        onOpenChange={(open) => !open && setDeleteExercise(null)}
        onSuccess={onUpdate}
      />

      <ExerciseProgressDialog
        exercise={progressExercise}
        open={!!progressExercise}
        onOpenChange={(open) => !open && setProgressExercise(null)}
      />
    </>
  );
}
