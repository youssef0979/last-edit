import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Epley formula for estimated 1RM: weight * (1 + reps/30)
function calculateEpley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

async function recalculateExerciseStats(
  supabaseClient: any,
  exerciseId: string,
  userId: string
) {
  // Get all sets for this exercise from completed sessions
  const { data: sets, error: setsError } = await supabaseClient
    .from('set_entries')
    .select('weight, reps, unit, gym_sessions!inner(status, user_id)')
    .eq('exercise_id', exerciseId)
    .eq('gym_sessions.user_id', userId)
    .eq('gym_sessions.status', 'completed');

  if (setsError) throw setsError;

  if (!sets || sets.length === 0) {
    // No completed sets, clear stats
    await supabaseClient
      .from('exercise_stats')
      .upsert({
        exercise_id: exerciseId,
        last_best_set_value: null,
        estimated_1rm: null,
        total_volume: null,
        updated_at: new Date().toISOString(),
      });
    return;
  }

  // Calculate best 1RM across all sets
  let bestOneRM = 0;
  let bestSetValue = 0;
  let totalVolume = 0;

  for (const set of sets) {
    const oneRM = calculateEpley1RM(set.weight, set.reps);
    if (oneRM > bestOneRM) {
      bestOneRM = oneRM;
      bestSetValue = set.weight;
    }
    totalVolume += set.weight * set.reps;
  }

  // Update exercise stats
  await supabaseClient
    .from('exercise_stats')
    .upsert({
      exercise_id: exerciseId,
      last_best_set_value: bestSetValue,
      estimated_1rm: bestOneRM,
      total_volume: totalVolume,
      updated_at: new Date().toISOString(),
    });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const sessionId = pathParts[2]; // /gym-sets/:sessionId

    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseClient
      .from('gym_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /api/gym/sessions/:id/sets - List sets for session
    if (req.method === 'GET') {
      const { data: sets, error } = await supabaseClient
        .from('set_entries')
        .select('*, exercises(name, primary_muscle, unit)')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(sets), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/gym/sessions/:id/sets - Add set entry
    if (req.method === 'POST') {
      const body = await req.json();
      const { exerciseId, setNumber, weight, reps, unit } = body;

      if (!exerciseId || setNumber === undefined || !weight || !reps || !unit) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: exerciseId, setNumber, weight, reps, unit' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Verify exercise exists and belongs to user
      const { data: exercise, error: exerciseError } = await supabaseClient
        .from('exercises')
        .select('id, user_id')
        .eq('id', exerciseId)
        .eq('user_id', user.id)
        .single();

      if (exerciseError || !exercise) {
        return new Response(JSON.stringify({ error: 'Exercise not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert set entry
      const { data: newSet, error: insertError } = await supabaseClient
        .from('set_entries')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight: parseFloat(weight),
          reps: parseInt(reps),
          unit,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Recalculate stats for this exercise
      await recalculateExerciseStats(supabaseClient, exerciseId, user.id);

      return new Response(JSON.stringify(newSet), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
