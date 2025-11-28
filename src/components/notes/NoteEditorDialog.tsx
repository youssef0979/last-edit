import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Pin, Palette, Tag, List, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { debounce } from "lodash";
import { z } from "zod";

interface NoteEditorDialogProps {
  note?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#ffffff", "#fef3c7", "#fecaca", "#fbcfe8", "#ddd6fe", 
  "#bfdbfe", "#a7f3d0", "#fde68a", "#fed7aa",
];

const noteSchema = z.object({
  title: z.string().max(200, "Title must be less than 200 characters").optional(),
  body: z.string().max(10000, "Body must be less than 10,000 characters").optional(),
  icon: z.string().max(2, "Icon must be 1-2 characters").optional(),
  tags: z.array(z.string().max(50, "Tag must be less than 50 characters")).optional(),
});

export function NoteEditorDialog({ note, open, onOpenChange }: NoteEditorDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<{ text: string; checked: boolean }[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setBody(note.body || "");
      setIcon(note.icon || "");
      setColor(note.color || PRESET_COLORS[0]);
      setTags(note.tags || []);
      setIsPinned(note.is_pinned || false);
      
      if (note.checklist) {
        const parsed = JSON.parse(note.checklist);
        if (parsed?.items) {
          setChecklistItems(parsed.items);
          setShowChecklist(true);
        }
      }
    } else {
      resetForm();
    }
  }, [note, open]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setIcon("");
    setColor(PRESET_COLORS[0]);
    setTags([]);
    setTagInput("");
    setIsPinned(false);
    setShowChecklist(false);
    setChecklistItems([]);
  };

  const saveNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      // Validate input
      try {
        noteSchema.parse(noteData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (note) {
        const { error } = await supabase
          .from("notes")
          .update(noteData)
          .eq("id", note.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notes")
          .insert({ user_id: user.id, ...noteData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save note");
    },
  });

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((data: any) => {
      if (note && (data.title || data.body || data.checklist)) {
        saveNoteMutation.mutate(data);
      }
    }, 500),
    [note]
  );

  const handleAutoSave = useCallback(() => {
    const noteData = {
      title: title.trim() || null,
      body: body.trim() || null,
      icon: icon.trim() || null,
      color,
      tags,
      is_pinned: isPinned,
      checklist: showChecklist && checklistItems.length > 0
        ? JSON.stringify({ items: checklistItems })
        : null,
    };
    debouncedSave(noteData);
  }, [title, body, icon, color, tags, isPinned, showChecklist, checklistItems, debouncedSave]);

  useEffect(() => {
    if (note) {
      handleAutoSave();
    }
  }, [title, body, icon, color, tags, isPinned, checklistItems, handleAutoSave]);

  const handleClose = () => {
    if (!note && (title.trim() || body.trim() || checklistItems.length > 0)) {
      // Create new note on close
      const noteData = {
        title: title.trim() || null,
        body: body.trim() || null,
        icon: icon.trim() || null,
        color,
        tags,
        is_pinned: isPinned,
        checklist: showChecklist && checklistItems.length > 0
          ? JSON.stringify({ items: checklistItems })
          : null,
      };
      saveNoteMutation.mutate(noteData);
    }
    onOpenChange(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { text: "", checked: false }]);
  };

  const updateChecklistItem = (index: number, text: string) => {
    const newItems = [...checklistItems];
    newItems[index].text = text;
    setChecklistItems(newItems);
  };

  const toggleChecklistItem = (index: number) => {
    const newItems = [...checklistItems];
    newItems[index].checked = !newItems[index].checked;
    setChecklistItems(newItems);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant={isPinned ? "default" : "ghost"}
              size="icon"
              onClick={() => setIsPinned(!isPinned)}
            >
              <Pin className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={showChecklist ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              {showChecklist ? <List className="h-4 w-4" /> : <Type className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" style={{ backgroundColor: color }}>
          {/* Icon & Title */}
          <div className="flex gap-3">
            <Input
              placeholder="🎯"
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              className="w-16 text-center text-xl"
              maxLength={2}
            />
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 font-semibold text-lg"
            />
          </div>

          {/* Body or Checklist */}
          {showChecklist ? (
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleChecklistItem(idx)}
                  />
                  <Input
                    value={item.text}
                    onChange={(e) => updateChecklistItem(idx, e.target.value)}
                    placeholder="List item"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChecklistItem(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addChecklistItem}>
                + Add item
              </Button>
            </div>
          ) : (
            <Textarea
              placeholder="Take a note..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          )}

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                className="flex-1"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Background</span>
            </div>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: c === color ? "#000" : "transparent",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
