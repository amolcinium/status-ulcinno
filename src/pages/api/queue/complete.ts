import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const id = form.get('id') as string | null;

  if (!id) return new Response('Missing id', { status: 400 });

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co',
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.rpc('complete_priority_item', { p_id: id });

  if (error) return new Response(`Failed: ${error.message}`, { status: 500 });

  return redirect('/', 303);
};
