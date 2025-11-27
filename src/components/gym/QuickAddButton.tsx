import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAddButtonProps {
  onAdd: () => void;
}

export function QuickAddButton({ onAdd }: QuickAddButtonProps) {
  return (
    <Button
      onClick={onAdd}
      size="lg"
      className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
