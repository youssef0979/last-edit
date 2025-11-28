import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Edit, Copy, Trash, Calendar, Palette } from "lucide-react";
import { format, addDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditBlockDialog } from "./EditBlockDialog";

interface QuickActionsMenuProps {
  block: any;
}

const PRESET_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
];

export function QuickActionsMenu({ block }: QuickActionsMenuProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  const deleteBlockMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("time_blocks")
        .delete()
        .eq("id", block.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
      toast.success("Time block deleted");
    },
    onError: () => {
      toast.error("Failed to delete time block");
    },
  });

  const duplicateBlockMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("time_blocks")
        .insert({
          user_id: user.id,
          date: block.date,
          start_time: block.start_time,
          end_time: block.end_time,
          title: `${block.title} (Copy)`,
          description: block.description,
          color: block.color,
          icon: block.icon,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
      toast.success("Time block duplicated");
    },
    onError: () => {
      toast.error("Failed to duplicate time block");
    },
  });

  const moveToTomorrowMutation = useMutation({
    mutationFn: async () => {
      const tomorrow = format(addDays(new Date(block.date), 1), "yyyy-MM-dd");
      const { error } = await supabase
        .from("time_blocks")
        .update({ date: tomorrow })
        .eq("id", block.id);

      if (error) throw error;
      return tomorrow;
    },
    onSuccess: (tomorrow) => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
      toast.success(`Moved to ${format(new Date(tomorrow), "MMM d")}`);
    },
    onError: () => {
      toast.error("Failed to move time block");
    },
  });

  const changeColorMutation = useMutation({
    mutationFn: async (color: string) => {
      const { error } = await supabase
        .from("time_blocks")
        .update({ color })
        .eq("id", block.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
      toast.success("Color updated");
    },
    onError: () => {
      toast.error("Failed to update color");
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            setShowEditDialog(true);
          }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            duplicateBlockMutation.mutate();
          }}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            moveToTomorrowMutation.mutate();
          }}>
            <Calendar className="h-4 w-4 mr-2" />
            Move to Tomorrow
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Palette className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Change Color</span>
            </div>
            <div className="flex gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 border-transparent hover:border-primary transition-all"
                  style={{ backgroundColor: color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    changeColorMutation.mutate(color);
                  }}
                />
              ))}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              deleteBlockMutation.mutate();
            }}
            className="text-destructive"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBlockDialog
        block={block}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
