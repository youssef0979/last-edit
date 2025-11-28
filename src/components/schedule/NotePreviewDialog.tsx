import { useQuery } from "@tanstack/react-query";
import { StickyNote, Tag, List, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NotePreviewDialogProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotePreviewDialog({ noteId, open, onOpenChange }: NotePreviewDialogProps) {
  const navigate = useNavigate();

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: open && !!noteId,
  });

  const checklist = note?.checklist ? JSON.parse(JSON.stringify(note.checklist)) : null;
  const completedItems = checklist?.items?.filter((item: any) => item.checked).length || 0;
  const totalItems = checklist?.items?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Linked Note
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading note...</div>
        ) : note ? (
          <div className="space-y-4">
            {/* Note Preview */}
            <div
              className="rounded-lg p-4 border border-border"
              style={{ backgroundColor: note.color }}
            >
              <div className="flex items-start gap-2 mb-3">
                {note.icon && <span className="text-2xl">{note.icon}</span>}
                <h3 className="font-semibold text-lg text-foreground flex-1">
                  {note.title || "Untitled"}
                </h3>
              </div>

              {note.body && (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3">
                  {note.body}
                </p>
              )}

              {/* Checklist Preview */}
              {checklist && checklist.items && (
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-foreground/80">
                      <List className="h-4 w-4" />
                      <span>Checklist Progress</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {completedItems} / {totalItems}
                    </span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-150"
                      style={{
                        width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground/80">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                navigate("/notes");
                onOpenChange(false);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open in Notes
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Note not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
