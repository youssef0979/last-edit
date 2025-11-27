import { Folder, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { EditFolderDialog } from "./EditFolderDialog";

interface FolderListProps {
  folders: any[];
  onUpdate: () => void;
}

export function FolderList({ folders, onUpdate }: FolderListProps) {
  const [deleteFolder, setDeleteFolder] = useState<any>(null);
  const [editFolder, setEditFolder] = useState<any>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card key={folder.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{folder.title}</h3>
                  <p className="text-sm text-muted-foreground">Muscle Group</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditFolder(folder)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteFolder(folder)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {folders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No muscle groups yet. Create one to organize your exercises.</p>
        </div>
      )}

      <DeleteFolderDialog
        folder={deleteFolder}
        open={!!deleteFolder}
        onOpenChange={(open) => !open && setDeleteFolder(null)}
        onSuccess={onUpdate}
      />

      <EditFolderDialog
        folder={editFolder}
        open={!!editFolder}
        onOpenChange={(open) => !open && setEditFolder(null)}
        onSuccess={onUpdate}
      />
    </>
  );
}
