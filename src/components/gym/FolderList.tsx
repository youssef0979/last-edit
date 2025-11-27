import { useState } from "react";
import { Folder, FolderOpen, MoreVertical, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { deleteFolder, type ExerciseFolder } from "@/lib/gym-api";
import { EditFolderDialog } from "./EditFolderDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { cn } from "@/lib/utils";

interface FolderListProps {
  folders: ExerciseFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersChange: () => void;
}

export function FolderList({
  folders,
  selectedFolderId,
  onSelectFolder,
  onFoldersChange,
}: FolderListProps) {
  const { toast } = useToast();
  const [editingFolder, setEditingFolder] = useState<ExerciseFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<ExerciseFolder | null>(null);

  const handleDeleteFolder = async (deleteExercises: boolean) => {
    if (!deletingFolder) return;

    try {
      // If user wants to delete exercises too, delete them first
      if (deleteExercises && deletingFolder.exercises && deletingFolder.exercises.length > 0) {
        // Import deleteExercise function
        const { deleteExercise } = await import("@/lib/gym-api");
        await Promise.all(
          deletingFolder.exercises.map(exercise => deleteExercise(exercise.id))
        );
      }
      
      // Then delete the folder (exercises will be moved to root due to ON DELETE SET NULL)
      await deleteFolder(deletingFolder.id);
      toast({
        title: "Success",
        description: deleteExercises 
          ? "Folder and exercises deleted successfully"
          : "Folder deleted, exercises moved to root",
      });
      if (selectedFolderId === deletingFolder.id) {
        onSelectFolder(null);
      }
      onFoldersChange();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    } finally {
      setDeletingFolder(null);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button
          variant={selectedFolderId === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onSelectFolder(null)}
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          All Exercises
        </Button>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">
          FOLDERS
        </div>
        {folders.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No folders yet
          </div>
        ) : (
          folders.map((folder) => (
            <div
              key={folder.id}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                selectedFolderId === folder.id
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-muted cursor-pointer"
              )}
            >
              <div
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={() => onSelectFolder(folder.id)}
              >
                <Folder className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm">{folder.title}</span>
                <span className="text-xs text-muted-foreground">
                  ({folder.exercises?.length || 0})
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeletingFolder(folder)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingFolder && (
        <EditFolderDialog
          folder={editingFolder}
          open={!!editingFolder}
          onOpenChange={(open) => !open && setEditingFolder(null)}
          onSuccess={() => {
            setEditingFolder(null);
            onFoldersChange();
          }}
        />
      )}

      {/* Delete Dialog */}
      {deletingFolder && (
        <DeleteFolderDialog
          folder={deletingFolder}
          open={!!deletingFolder}
          onOpenChange={(open) => !open && setDeletingFolder(null)}
          onConfirm={handleDeleteFolder}
        />
      )}
    </div>
  );
}
