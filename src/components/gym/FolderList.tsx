import { Folder, Trash2, Edit, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { EditFolderDialog } from "./EditFolderDialog";
import { FolderDetailView } from "./FolderDetailView";

interface FolderListProps {
  folders: any[];
  onUpdate: () => void;
}

export function FolderList({ folders, onUpdate }: FolderListProps) {
  const [deleteFolder, setDeleteFolder] = useState<any>(null);
  const [editFolder, setEditFolder] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);

  const { data: exerciseCounts } = useQuery({
    queryKey: ['folder-exercise-counts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('exercises')
        .select('folder_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(ex => {
        if (ex.folder_id) {
          counts[ex.folder_id] = (counts[ex.folder_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  if (selectedFolder) {
    return (
      <FolderDetailView
        folder={selectedFolder}
        onBack={() => setSelectedFolder(null)}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card 
            key={folder.id} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => setSelectedFolder(folder)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{folder.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {exerciseCounts?.[folder.id] || 0}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Muscle Group</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <div className="flex gap-1 mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditFolder(folder);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteFolder(folder);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Delete
              </Button>
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
