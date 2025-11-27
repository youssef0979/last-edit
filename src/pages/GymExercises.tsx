import { useState, useEffect } from "react";
import { Plus, Search, FolderOpen, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getFolders, getExercises, type ExerciseFolder, type Exercise } from "@/lib/gym-api";
import { FolderList } from "@/components/gym/FolderList";
import { ExerciseList } from "@/components/gym/ExerciseList";
import { AddFolderDialog } from "@/components/gym/AddFolderDialog";
import { AddExerciseDialog } from "@/components/gym/AddExerciseDialog";
import { QuickAddButton } from "@/components/gym/QuickAddButton";

export default function GymExercises() {
  const { toast } = useToast();
  const [folders, setFolders] = useState<ExerciseFolder[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadExercises();
  }, [selectedFolderId]);

  async function loadData() {
    try {
      const [foldersData] = await Promise.all([
        getFolders(),
      ]);
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load exercise library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadExercises() {
    try {
      const exercisesData = await getExercises(selectedFolderId);
      setExercises(exercisesData);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load exercises",
        variant: "destructive",
      });
    }
  }

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.primary_muscle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-muted-foreground">Loading exercise library...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Exercise Library</h1>
              <p className="text-sm text-muted-foreground">
                Manage your exercises and folders
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddFolder(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={() => setShowAddExercise(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Exercise
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search exercises by name or muscle group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Folders */}
        <div className="w-80 border-r bg-card overflow-y-auto">
          <FolderList
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onFoldersChange={loadData}
          />
        </div>

        {/* Center - Exercise List */}
        <div className="flex-1 overflow-y-auto">
          <ExerciseList
            exercises={filteredExercises}
            onExercisesChange={loadExercises}
            selectedFolderId={selectedFolderId}
          />
        </div>
      </div>

      {/* Dialogs */}
      <AddFolderDialog
        open={showAddFolder}
        onOpenChange={setShowAddFolder}
        onSuccess={loadData}
      />

      <AddExerciseDialog
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
        onSuccess={loadExercises}
        folders={folders}
        defaultFolderId={selectedFolderId}
      />

      {/* Quick Add Button */}
      <QuickAddButton onAdd={() => setShowAddExercise(true)} />
    </div>
  );
}
