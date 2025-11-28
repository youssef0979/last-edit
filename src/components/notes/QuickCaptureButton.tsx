import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickCaptureButton() {
  const navigate = useNavigate();

  return (
    <Button
      size="lg"
      className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 hover:scale-110 z-50"
      onClick={() => navigate("/notes/new")}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
