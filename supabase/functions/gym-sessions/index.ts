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
    const sessionId = pathParts[pathParts.length - 1];

    // GET /api/gym/sessions - List sessions
    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const presetId = url.searchParams.get('presetId');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabaseClient
        .from('gym_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (status) query = query.eq('status', status);
      if (presetId) query = query.eq('preset_id', presetId);

      const { data: sessions, error, count } = await query
        .order('session_index', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(JSON.stringify({ sessions, total: count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/gym/sessions - Create session
    if (req.method === 'POST') {
      const body = await req.json();
      const { scheduledDate, presetId, sessionIndex } = body;

      let nextIndex = sessionIndex;
      if (!nextIndex) {
        const { data: maxSession } = await supabaseClient
          .from('gym_sessions')
          .select('session_index')
          .eq('user_id', user.id)
          .order('session_index', { ascending: false })
          .limit(1)
          .single();

        nextIndex = maxSession ? maxSession.session_index + 1 : 1;
      }

      const { data, error } = await supabaseClient
        .from('gym_sessions')
        .insert({
          user_id: user.id,
          session_index: nextIndex,
          scheduled_date: scheduledDate || null,
          preset_id: presetId || null,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /api/gym/sessions/:id - Update session
    if (req.method === 'PUT' && sessionId) {
      const body = await req.json();
      const { status, scheduledDate } = body;

      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (scheduledDate !== undefined) updateData.scheduled_date = scheduledDate;

      const { data, error } = await supabaseClient
        .from('gym_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/gym/sessions/:id - Delete session
    if (req.method === 'DELETE' && sessionId) {
      const { error } = await supabaseClient
        .from('gym_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
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
