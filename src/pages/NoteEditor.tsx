import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Pin, Palette, Tag, List, Type, X, Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { z } from "zod";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#FFFFFF", "#F8FAFC", "#F1F5F9", "#FEF3C7", "#FEE2E2", 
  "#FCE7F3", "#EDE9FE", "#DBEAFE", "#D1FAE5", "#FED7AA",
];

const noteSchema = z.object({
  title: z.string().max(200, "Title must be less than 200 characters").nullable().optional(),
  body: z.string().max(10000, "Body must be less than 10,000 characters").nullable().optional(),
  icon: z.string().max(2, "Icon must be 1-2 characters").nullable().optional(),
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const queryClient = useQueryClient();

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



  const handleSave = () => {
    const noteData = {
      title: title.trim() || null,
      body: body.trim() || null,
      icon: icon.trim() || null,
      color,
      tags,
      is_pinned: isPinned,
      checklist:
        showChecklist && checklistItems.length > 0
          ? JSON.stringify({ items: checklistItems })
          : null,
    };
    const hasContent = noteData.title || noteData.body || noteData.checklist;
    if (hasContent) {
      saveNoteMutation.mutate(noteData);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/notes")}
                className="hover:bg-muted/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-foreground">Note Editor</span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Button
                variant={isPinned ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setIsPinned(!isPinned)}
                className="hover:bg-muted/80 transition-colors"
              >
                <Pin className={cn("h-4 w-4", isPinned && "fill-current")} />
              </Button>
              <div className="h-5 w-px bg-border/60" />
              <Button
                variant={showChecklist ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowChecklist(!showChecklist)}
                className="hover:bg-muted/80 transition-colors"
              >
                {showChecklist ? <List className="h-4 w-4" /> : <Type className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="animate-fade-in">
          {/* Note Card */}
          <div
            className="rounded-2xl border-2 bg-card shadow-xl overflow-hidden transition-all duration-300"
            style={{ borderColor: color }}
          >
            <div className="p-8 space-y-6">
              {/* Title Section */}
              <div className="space-y-4">
                {/* Icon Input */}
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Input
                      placeholder="📝"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                      className="w-14 h-14 text-center text-2xl border-border/60 bg-background/80 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 transition-all"
                      maxLength={2}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Color Picker Dropdown */}
                {showColorPicker && (
                  <div className="p-4 rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg animate-scale-in">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Background Color</p>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 transition-all hover:scale-110",
                            c === color ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            setColor(c);
                            setShowColorPicker(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Title Input */}
                <Input
                  placeholder="Untitled"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-bold border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* Content Section */}
              {showChecklist ? (
                <div className="space-y-3">
                  {checklistItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleChecklistItem(idx)}
                        className="mt-1"
                      />
                      <Input
                        value={item.text}
                        onChange={(e) => updateChecklistItem(idx, e.target.value)}
                        placeholder="List item"
                        className={cn(
                          "flex-1 border-0 bg-transparent px-0 focus-visible:ring-0",
                          item.checked && "line-through opacity-60"
                        )}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChecklistItem(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addChecklistItem}
                    className="mt-2 border-border/60 hover:bg-muted/50"
                  >
                    + Add item
                  </Button>
                </div>
              ) : (
                <Textarea
                  placeholder="Start writing..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[400px] resize-none border-0 bg-transparent px-0 text-base leading-relaxed focus-visible:ring-0 placeholder:text-muted-foreground/40"
                />
              )}

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* Tags Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Add tags (press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 transition-all hover:bg-primary/20"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
