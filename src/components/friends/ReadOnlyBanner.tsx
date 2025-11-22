import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ReadOnlyBannerProps {
  friendName: string;
}

export const ReadOnlyBanner = ({ friendName }: ReadOnlyBannerProps) => {
  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        You are viewing <strong>{friendName}'s</strong> tracker in read-only mode. You cannot edit or modify their data.
      </AlertDescription>
    </Alert>
  );
};
