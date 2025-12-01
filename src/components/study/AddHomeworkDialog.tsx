import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  onHomeworkCreated: () => void;
}

export function AddHomeworkDialog({
  open,
  onOpenChange,
  subjectId,
  onHomeworkCreated,
}: AddHomeworkDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountType, setAmountType] = useState<"pages" | "questions">("pages");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number.",
        variant: "destructive",
      });
      return;
    }

    if (!deadline) {
      toast({
        title: "Deadline required",
        description: "Please select a deadline date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("study_homework").insert({
        subject_id: subjectId,
        user_id: user.id,
        amount: amountNum,
        amount_type: amountType,
        deadline,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Homework added",
        description: "Your homework has been added successfully.",
      });

      // Reset form
      setAmount("");
      setAmountType("pages");
      setDeadline("");
      setNotes("");
      onHomeworkCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error adding homework",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Homework</DialogTitle>
          <DialogDescription>
            Add a new homework assignment for this subject.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountType">Type</Label>
                <Select value={amountType} onValueChange={(v: "pages" | "questions") => setAmountType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pages">Pages</SelectItem>
                    <SelectItem value="questions">Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Extra Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Homework
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}