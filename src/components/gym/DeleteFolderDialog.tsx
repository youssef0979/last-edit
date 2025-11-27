import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type ExerciseFolder } from "@/lib/gym-api";

interface DeleteFolderDialogProps {
  folder: ExerciseFolder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteExercises: boolean) => void;
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [deleteOption, setDeleteOption] = useState<"move" | "delete">("move");

  const handleConfirm = () => {
    onConfirm(deleteOption === "delete");
  };

  const exerciseCount = folder.exercises?.length || 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete the folder "{folder.title}".
            {exerciseCount > 0 && (
              <span className="block mt-2 font-medium text-foreground">
                This folder contains {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {exerciseCount > 0 && (
          <RadioGroup value={deleteOption} onValueChange={(v) => setDeleteOption(v as "move" | "delete")}>
            <div className="flex items-start space-x-2 rounded-lg border p-4">
              <RadioGroupItem value="move" id="move" />
              <div className="space-y-1">
                <Label htmlFor="move" className="cursor-pointer">
                  Move exercises to root
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep all exercises and move them to the root folder
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2 rounded-lg border p-4 border-destructive/50">
              <RadioGroupItem value="delete" id="delete" />
              <div className="space-y-1">
                <Label htmlFor="delete" className="cursor-pointer text-destructive">
                  Delete all exercises
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete the folder and all contained exercises
                </p>
              </div>
            </div>
          </RadioGroup>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {deleteOption === "delete" ? "Delete All" : "Delete Folder"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
