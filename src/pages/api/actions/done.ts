import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const form = await request.formData();
  const id = form.get('id') as string | null;

  if (!id) return new Response('Missing id', { status: 400 });

  // Od Astro 6 runtime env dolazi iz cloudflare:workers (Astro.locals.runtime ne postoji).
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const serviceKey = runtimeEnv.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return new Response('Server misconfig: SUPABASE_SERVICE_ROLE_KEY not set in CF Pages env', { status: 500 });

  const supabase = createClient(
    runtimeEnv.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co',
    serviceKey,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase
    .from('pending_actions')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return new Response(`Update failed: ${error.message}`, { status: 500 });

  return redirect('/', 303);
};
