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
    const exerciseId = url.searchParams.get('exerciseId');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const format = url.searchParams.get('format') || 'json';

    // GET /api/gym/export
    if (req.method === 'GET') {
      let query = supabaseClient
        .from('set_entries')
        .select(`
          *,
          exercises(name, primary_muscle, unit),
          gym_sessions!inner(session_index, scheduled_date, status, user_id)
        `)
        .eq('gym_sessions.user_id', user.id);

      if (exerciseId) {
        query = query.eq('exercise_id', exerciseId);
      }

      if (from) {
        query = query.gte('timestamp', from);
      }

      if (to) {
        query = query.lte('timestamp', to);
      }

      const { data: sets, error } = await query.order('timestamp', { ascending: true });

      if (error) throw error;

      // Format data
      const formattedData = sets?.map((set: any) => ({
        exercise: set.exercises.name,
        primaryMuscle: set.exercises.primary_muscle,
        sessionIndex: set.gym_sessions.session_index,
        sessionDate: set.gym_sessions.scheduled_date,
        sessionStatus: set.gym_sessions.status,
        setNumber: set.set_number,
        weight: set.weight,
        reps: set.reps,
        unit: set.unit,
        timestamp: set.timestamp,
        estimated1RM: set.weight * (1 + set.reps / 30),
      })) || [];

      if (format === 'csv') {
        // Convert to CSV
        if (formattedData.length === 0) {
          return new Response('No data found', {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
          });
        }

        const headers = Object.keys(formattedData[0]).join(',');
        const rows = formattedData.map((row: any) => 
          Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        );
        const csv = [headers, ...rows].join('\n');

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="gym-export.csv"',
          },
        });
      }

      // Return JSON
      return new Response(JSON.stringify(formattedData), {
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
