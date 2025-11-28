import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pin, Trash, MoreVertical, Check, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddToTimelineDialog } from "./AddToTimelineDialog";

interface NoteCardProps {
  note: any;
}

export function NoteCard({ note }: NoteCardProps) {
  const navigate = useNavigate();
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const queryClient = useQueryClient();

  const togglePinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notes")
        .update({ is_pinned: !note.is_pinned })
        .eq("id", note.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => {
      toast.error("Failed to update note");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
    onError: () => {
      toast.error("Failed to delete note");
    },
  });

  const checklist = note.checklist ? JSON.parse(note.checklist) : null;

  return (
    <>
      <div
        className={cn(
          "group relative rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer overflow-hidden",
          "animate-scale-in"
        )}
        style={{ backgroundColor: note.color }}
        onClick={() => navigate(`/notes/${note.id}`)}
      >
        {/* Pin indicator */}
        {note.is_pinned && (
          <div className="absolute top-2 right-2 opacity-50">
            <Pin className="h-4 w-4 fill-current" />
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Title & Icon */}
          {(note.title || note.icon) && (
            <div className="flex items-start gap-2">
              {note.icon && <span className="text-xl">{note.icon}</span>}
              {note.title && (
                <h3 className="font-semibold text-foreground text-base line-clamp-2 flex-1">
                  {note.title}
                </h3>
              )}
            </div>
          )}

          {/* Body */}
          {note.body && (
            <p className="text-sm text-foreground/80 line-clamp-6 whitespace-pre-wrap">
              {note.body}
            </p>
          )}

          {/* Checklist */}
          {checklist && checklist.items && (
            <div className="space-y-1.5">
              {checklist.items.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                      item.checked
                        ? "bg-primary border-primary"
                        : "border-border bg-background"
                    )}
                  >
                    {item.checked && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span
                    className={cn(
                      "line-clamp-1",
                      item.checked && "line-through text-muted-foreground"
                    )}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
              {checklist.items.length > 5 && (
                <div className="text-xs text-muted-foreground pl-6">
                  +{checklist.items.length - 5} more
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions Menu (top-right corner) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80 backdrop-blur-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinMutation.mutate();
                }}
              >
                <Pin className="h-4 w-4 mr-2" />
                {note.is_pinned ? "Unpin" : "Pin"} note
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNoteMutation.mutate();
                }}
                className="text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add to Timeline Button */}
        <div className="px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowTimelineDialog(true);
            }}
            className="w-full gap-2"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Add to Timeline
          </Button>
        </div>
      </div>

      <AddToTimelineDialog
        note={note}
        open={showTimelineDialog}
        onOpenChange={setShowTimelineDialog}
      />
    </>
  );
}
