import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const form = await request.formData();
  const service = form.get('service') as string | null;
  const cmd = form.get('cmd') as string | null;
  const from_ver = form.get('from_ver') as string | null;
  const to_ver = form.get('to_ver') as string | null;

  if (!service || !cmd) return new Response('Missing params', { status: 400 });

  const runtimeEnv = (locals as any)?.runtime?.env ?? {};
  const serviceKey = runtimeEnv.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return new Response('Server misconfig: SUPABASE_SERVICE_ROLE_KEY not set in CF Pages env', { status: 500 });

  const supabase = createClient(
    runtimeEnv.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co',
    serviceKey,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.from('pending_actions').insert({
    source: 'dashboard',
    action_type: `upgrade:${service}`,
    status: 'pending',
    notes: `Upgrade ${service} ${from_ver} → ${to_ver}. CMD: ${cmd}`,
    payload: { service, cmd, from_ver, to_ver },
  });

  if (error) return new Response(`Insert failed: ${error.message}`, { status: 500 });

  return redirect('/', 303);
};
