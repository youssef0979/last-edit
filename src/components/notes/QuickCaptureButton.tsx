import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteEditorDialog } from "./NoteEditorDialog";

export function QuickCaptureButton() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 hover:scale-110 z-50"
        onClick={() => setShowEditor(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <NoteEditorDialog open={showEditor} onOpenChange={setShowEditor} />
    </>
  );
}
