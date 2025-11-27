import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
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
    const exerciseId = pathParts[2]; // /gym-stats/:exerciseId

    // GET /api/gym/exercises/:id/stats
    if (req.method === 'GET') {
      // Verify exercise belongs to user
      const { data: exercise, error: exerciseError } = await supabaseClient
        .from('exercises')
        .select('id, name, user_id')
        .eq('id', exerciseId)
        .eq('user_id', user.id)
        .single();

      if (exerciseError || !exercise) {
        return new Response(JSON.stringify({ error: 'Exercise not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get exercise stats
      const { data: stats, error: statsError } = await supabaseClient
        .from('exercise_stats')
        .select('*')
        .eq('exercise_id', exerciseId)
        .single();

      // Get best set history (recent best sets)
      const { data: bestSets, error: setsError } = await supabaseClient
        .from('set_entries')
        .select('weight, reps, unit, timestamp, gym_sessions!inner(status, session_index)')
        .eq('exercise_id', exerciseId)
        .eq('gym_sessions.status', 'completed')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (setsError) throw setsError;

      // Calculate 1RM for each set and find personal bests
      const history = bestSets?.map((set: any) => ({
        weight: set.weight,
        reps: set.reps,
        unit: set.unit,
        estimated1RM: set.weight * (1 + set.reps / 30),
        timestamp: set.timestamp,
        sessionIndex: set.gym_sessions.session_index,
      })) || [];

      return new Response(
        JSON.stringify({
          exerciseId,
          exerciseName: exercise.name,
          stats: stats || {
            last_best_set_value: null,
            estimated_1rm: null,
            total_volume: null,
          },
          history,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
