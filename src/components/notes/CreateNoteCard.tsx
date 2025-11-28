import { useState } from "react";
import { Plus } from "lucide-react";
import { NoteEditorDialog } from "./NoteEditorDialog";

export function CreateNoteCard() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEditor(true)}
        className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent/50 transition-all duration-150 p-6 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground group"
      >
        <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Create a new note</span>
      </button>

      <NoteEditorDialog open={showEditor} onOpenChange={setShowEditor} />
    </>
  );
}
