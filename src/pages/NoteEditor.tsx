import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pin, Palette, Tag, List, Type, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { debounce } from "lodash";
import { z } from "zod";

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

export default function NoteEditor() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<{ text: string; checked: boolean }[]>([]);
  const [hasCreatedNote, setHasCreatedNote] = useState(!!noteId);
  const [currentNoteId, setCurrentNoteId] = useState(noteId || null);
  const queryClient = useQueryClient();

  // Fetch existing note if editing
  const { data: note } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      if (!noteId) return null;
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!noteId,
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setBody(note.body || "");
      setIcon(note.icon || "");
      setColor(note.color || PRESET_COLORS[0]);
      setTags(note.tags || []);
      setIsPinned(note.is_pinned || false);
      
      if (note.checklist) {
        const parsed = typeof note.checklist === 'string' 
          ? JSON.parse(note.checklist) 
          : note.checklist;
        if (parsed?.items) {
          setChecklistItems(parsed.items);
          setShowChecklist(true);
        }
      }
    }
  }, [note]);

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

      if (currentNoteId) {
        const { error } = await supabase
          .from("notes")
          .update(noteData)
          .eq("id", currentNoteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("notes")
          .insert({ user_id: user.id, ...noteData })
          .select()
          .single();
        if (error) throw error;
        setCurrentNoteId(data.id);
        setHasCreatedNote(true);
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
      if (hasCreatedNote || title.trim() || body.trim() || checklistItems.some(item => item.text.trim())) {
        saveNoteMutation.mutate(data);
      }
    }, 500),
    [hasCreatedNote, title, body, checklistItems]
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
    handleAutoSave();
  }, [title, body, icon, color, tags, isPinned, checklistItems, handleAutoSave]);

  const handleBack = () => {
    navigate("/notes");
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
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
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4" style={{ backgroundColor: color }}>
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
              className="min-h-[400px] resize-none"
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
      </div>
    </div>
  );
}
