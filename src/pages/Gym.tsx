import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Plus, Folder, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderList } from "@/components/gym/FolderList";
import { ExerciseList } from "@/components/gym/ExerciseList";
import { SessionManager } from "@/components/gym/SessionManager";
import { AddFolderDialog } from "@/components/gym/AddFolderDialog";
import { AddExerciseDialog } from "@/components/gym/AddExerciseDialog";

export default function Gym() {
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  const { data: folders, refetch: refetchFolders } = useQuery({
    queryKey: ['gym-folders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('exercise_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: exercises, refetch: refetchExercises } = useQuery({
    queryKey: ['gym-exercises'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gym Tracker</h1>
            <p className="text-muted-foreground">Track your lifting progress</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="exercises" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exercises" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Exercises
          </TabsTrigger>
          <TabsTrigger value="folders" className="gap-2">
            <Folder className="h-4 w-4" />
            Muscle Groups
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercises" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddExerciseOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </div>
          <ExerciseList exercises={exercises || []} folders={folders || []} onUpdate={refetchExercises} />
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddFolderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Muscle Group
            </Button>
          </div>
          <FolderList folders={folders || []} onUpdate={refetchFolders} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionManager exercises={exercises || []} />
        </TabsContent>
      </Tabs>

      <AddFolderDialog 
        open={addFolderOpen} 
        onOpenChange={setAddFolderOpen}
        onSuccess={refetchFolders}
      />
      
      <AddExerciseDialog 
        open={addExerciseOpen} 
        onOpenChange={setAddExerciseOpen}
        folders={folders || []}
        onSuccess={refetchExercises}
      />
    </div>
  );
}
