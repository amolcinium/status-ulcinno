import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const title = (form.get('title') as string | null)?.trim();
  const one_liner = (form.get('one_liner') as string | null)?.trim() || null;

  if (!title) return new Response('Missing title', { status: 400 });

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co',
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from('ideas')
    .insert({ title, one_liner, state: 'intake', source: 'dashboard' });

  if (error) return new Response(`Insert failed: ${error.message}`, { status: 500 });

  return redirect('/', 303);
};
