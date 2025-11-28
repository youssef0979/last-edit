import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/notes/NoteCard";
import { QuickCaptureButton } from "@/components/notes/QuickCaptureButton";

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(query);
      const bodyMatch = note.body?.toLowerCase().includes(query);
      const tagsMatch = note.tags?.some((tag: string) => 
        tag.toLowerCase().includes(query)
      );
      const iconMatch = note.icon?.includes(query);
      
      return titleMatch || bodyMatch || tagsMatch || iconMatch;
    });
  }, [notes, searchQuery]);

  const pinnedNotes = filteredNotes.filter((note) => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter((note) => !note.is_pinned);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <StickyNote className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, body, tags, or icon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading notes...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Pinned
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes */}
            {unpinnedNotes.length > 0 && (
              <div className="space-y-4">
                {pinnedNotes.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Other Notes
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {unpinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredNotes.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <StickyNote className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? "No notes found" : "No notes yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first note to get started"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Capture Button */}
      <QuickCaptureButton />
    </div>
  );
}
