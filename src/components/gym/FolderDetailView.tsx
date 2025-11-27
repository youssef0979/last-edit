import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Dumbbell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddExerciseDialog } from "./AddExerciseDialog";
import { ExerciseList } from "./ExerciseList";

interface FolderDetailViewProps {
  folder: any;
  onBack: () => void;
  onUpdate: () => void;
}

export function FolderDetailView({ folder, onBack, onUpdate }: FolderDetailViewProps) {
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  const { data: exercises, refetch: refetchExercises } = useQuery({
    queryKey: ['folder-exercises', folder.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('folder_id', folder.id)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSuccess = () => {
    refetchExercises();
    onUpdate();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Muscle Groups
          </Button>
          <Button onClick={() => setAddExerciseOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold">{folder.title}</h2>
          <p className="text-muted-foreground">
            {exercises?.length || 0} exercise{exercises?.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ExerciseList 
          exercises={exercises || []} 
          folders={[folder]} 
          onUpdate={handleSuccess} 
        />

        {(!exercises || exercises.length === 0) && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No exercises in this muscle group yet.</p>
            <p className="text-sm">Add your first exercise to get started.</p>
          </div>
        )}
      </div>

      <AddExerciseDialog 
        open={addExerciseOpen} 
        onOpenChange={setAddExerciseOpen}
        folders={[folder]}
        onSuccess={handleSuccess}
      />
    </>
  );
}
