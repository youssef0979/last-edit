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
    const exerciseId = pathParts[pathParts.length - 1];
    const folderId = url.searchParams.get('folderId');

    // GET /api/gym/exercises - List exercises
    if (req.method === 'GET') {
      let query = supabaseClient
        .from('exercises')
        .select('*, exercise_folders(title)')
        .eq('user_id', user.id);

      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data: exercises, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(exercises), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/gym/exercises - Create exercise
    if (req.method === 'POST') {
      const body = await req.json();
      const { name, folderId: bodyFolderId, primaryMuscle, unit = 'kg' } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('exercises')
        .insert({
          user_id: user.id,
          name,
          folder_id: bodyFolderId || null,
          primary_muscle: primaryMuscle || null,
          unit,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT /api/gym/exercises/:id - Update exercise
    if (req.method === 'PUT' && exerciseId) {
      const body = await req.json();
      const { name, folderId: bodyFolderId, primaryMuscle, unit } = body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (bodyFolderId !== undefined) updateData.folder_id = bodyFolderId;
      if (primaryMuscle !== undefined) updateData.primary_muscle = primaryMuscle;
      if (unit !== undefined) updateData.unit = unit;

      const { data, error } = await supabaseClient
        .from('exercises')
        .update(updateData)
        .eq('id', exerciseId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/gym/exercises/:id - Delete exercise
    if (req.method === 'DELETE' && exerciseId) {
      const { error } = await supabaseClient
        .from('exercises')
        .delete()
        .eq('id', exerciseId)
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
