import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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

  const handleCompleteSession = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('gym_sessions')
        .update({ status: 'completed', scheduled_date: new Date().toISOString() })
        .eq('id', session.id);

      if (error) throw error;

      toast({ title: "Session completed!" });
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!session) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session {session.session_index}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => setAddSetOpen(true)} className="flex-1 gap-2">
                <Plus className="h-4 w-4" />
                Add Set
              </Button>
              {session.status === 'planned' && sets && sets.length > 0 && (
                <Button onClick={handleCompleteSession} variant="default" className="gap-2">
                  Complete Session
                </Button>
              )}
            </div>

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
