import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { bioSchema } from "@/lib/validations";
import { handleError } from "@/lib/error-handler";

interface BioEditorProps {
  currentBio?: string;
  userId: string;
  onBioUpdated: () => void;
}

export function BioEditor({ currentBio, userId, onBioUpdated }: BioEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(currentBio || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    // Validate bio with zod
    const validationResult = bioSchema.safeParse(bio);
    
    if (!validationResult.success) {
      toast({
        title: "Validation error",
        description: validationResult.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({ bio: validationResult.data || null })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bio updated successfully"
      });

      setIsEditing(false);
      onBioUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: handleError(error, "database"),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(currentBio || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={500}
          disabled={isSaving}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Bio</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </div>
      {currentBio ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentBio}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No bio yet. Add one to tell others about yourself!</p>
      )}
    </div>
  );
}
