import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PrivacySettings {
  id: string;
  user_id: string;
  show_performance: boolean;
  show_habits: boolean;
  show_sleep: boolean;
  show_calendar: boolean;
  created_at: string;
  updated_at: string;
}

export const usePrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("privacy_settings")
          .insert({
            user_id: user.id,
            show_performance: true,
            show_habits: true,
            show_sleep: true,
            show_calendar: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (updates: Partial<Pick<PrivacySettings, "show_performance" | "show_habits" | "show_sleep" | "show_calendar">>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !settings) return;

      const { data, error } = await supabase
        .from("privacy_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "Success",
        description: "Privacy settings updated",
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refreshSettings: loadSettings,
  };
};
