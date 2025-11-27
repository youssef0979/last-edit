import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SetEntryProps {
  set: any;
  exercises: any[];
  onUpdate: () => void;
}

export function SetEntry({ set, exercises, onUpdate }: SetEntryProps) {
  const { toast } = useToast();
  const exercise = exercises.find(e => e.id === set.exercise_id);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('set_entries')
        .delete()
        .eq('id', set.id);

      if (error) throw error;

      toast({ title: "Set deleted" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline">Set {set.set_number}</Badge>
          <div>
            <p className="font-medium">{exercise?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              {set.weight} {set.unit} × {set.reps} reps
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
