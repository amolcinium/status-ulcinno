import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const VALID_STATUSES = ['pending', 'accepted', 'deferred', 'rejected', 'completed'] as const;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id = form.get('id') as string | null;
  const status = form.get('status') as string | null;

  if (!id || !status || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return new Response('Missing or invalid params', { status: 400 });
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co',
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.rpc('update_proposal_state', {
    p_id: id,
    p_status: status,
  });

  if (error) {
    return new Response(`State update failed: ${error.message}`, { status: 500 });
  }

  return redirect('/', 303);
};
