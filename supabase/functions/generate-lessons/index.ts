import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting lesson generation check...");

    // Find subjects where next_release_at is in the past
    const now = new Date().toISOString();
    
    const { data: subjects, error: subjectsError } = await supabase
      .from("study_subjects")
      .select("*")
      .not("next_release_at", "is", null)
      .lte("next_release_at", now);

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError);
      throw subjectsError;
    }

    console.log(`Found ${subjects?.length || 0} subjects due for lesson release`);

    for (const subject of subjects || []) {
      // Get the current max lesson number for this subject
      const { data: maxLesson } = await supabase
        .from("study_lessons")
        .select("lesson_number")
        .eq("subject_id", subject.id)
        .order("lesson_number", { ascending: false })
        .limit(1)
        .single();

      const nextLessonNumber = (maxLesson?.lesson_number || 0) + 1;

      // Create new lesson
      const { error: lessonError } = await supabase
        .from("study_lessons")
        .insert({
          subject_id: subject.id,
          user_id: subject.user_id,
          title: `Lesson ${nextLessonNumber}`,
          lesson_number: nextLessonNumber,
          status: "pending",
          released_at: now,
        });

      if (lessonError) {
        console.error(`Error creating lesson for subject ${subject.id}:`, lessonError);
        continue;
      }

      console.log(`Created lesson ${nextLessonNumber} for subject: ${subject.name}`);

      // Calculate next release date
      if (subject.release_day && subject.release_time) {
        const nextRelease = calculateNextRelease(subject.release_day, subject.release_time);
        
        // Update subject's next_release_at and pending_lessons count
        const { error: updateError } = await supabase
          .from("study_subjects")
          .update({
            next_release_at: nextRelease,
            pending_lessons: subject.pending_lessons + 1,
          })
          .eq("id", subject.id);

        if (updateError) {
          console.error(`Error updating subject ${subject.id}:`, updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${subjects?.length || 0} subjects` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in generate-lessons function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

function calculateNextRelease(day: string, time: string): string {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const targetDay = DAYS.indexOf(day);
  const [hours] = time.split(":").map(Number);
  
  const next = new Date(now);
  next.setHours(hours, 0, 0, 0);
  
  const currentDay = now.getDay();
  let daysUntilTarget = targetDay - currentDay;
  
  // Always add 7 days since we just released
  daysUntilTarget += 7;
  
  next.setDate(next.getDate() + daysUntilTarget);
  return next.toISOString();
}
