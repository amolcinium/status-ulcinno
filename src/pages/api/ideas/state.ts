import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const VALID_STATES = ['intake', 'analyzing', 'validated', 'active', 'killed'] as const;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id = form.get('id') as string | null;
  const state = form.get('state') as string | null;

  if (!id || !state || !VALID_STATES.includes(state as typeof VALID_STATES[number])) {
    return new Response('Missing or invalid params', { status: 400 });
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co',
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.rpc('update_idea_state', {
    p_id: id,
    p_state: state,
  });

  if (error) {
    return new Response(`State update failed: ${error.message}`, { status: 500 });
  }

  return redirect('/', 303);
};
