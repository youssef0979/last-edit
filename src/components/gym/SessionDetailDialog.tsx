import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { AddSetDialog } from "./AddSetDialog";
import { SetEntry } from "./SetEntry";

interface SessionDetailDialogProps {
  session: any;
  exercises: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function SessionDetailDialog({ session, exercises, open, onOpenChange, onUpdate }: SessionDetailDialogProps) {
  const [addSetOpen, setAddSetOpen] = useState(false);

  const { data: sets, refetch: refetchSets } = useQuery({
    queryKey: ['session-sets', session?.id],
    enabled: !!session,
    queryFn: async () => {
      if (!session) return [];
      
      const { data, error } = await supabase
        .from('set_entries')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp');
      
      if (error) throw error;
      return data;
    }
  });

  if (!session) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Day {session.session_index}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={() => setAddSetOpen(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Set
            </Button>

            <div className="space-y-2">
              {sets?.map((set) => (
                <SetEntry
                  key={set.id}
                  set={set}
                  exercises={exercises}
                  onUpdate={refetchSets}
                />
              ))}

              {(!sets || sets.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sets logged yet. Add your first set.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddSetDialog
        open={addSetOpen}
        onOpenChange={setAddSetOpen}
        sessionId={session?.id}
        exercises={exercises}
        onSuccess={refetchSets}
      />
    </>
  );
}
