import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://frsgzfzvdxswqjpdmcsd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

/**
 * Server-side client using the service-role key, which bypasses RLS.
 *
 * Why the sections can't use the anon client above: every dashboard table got RLS on
 * 2026-08-02, and the policies that existed before that already targeted `authenticated`
 * only — so anon reads had been silently returning [] for a while, which is why most of
 * the dashboard rendered empty. On top of that the anon key is effectively public: it is
 * hardcoded in committed source elsewhere in the monorepo (cadastre map, grant-ai
 * frontend) and does not expire until 2036. Anything it can read, the internet can read.
 *
 * Astro frontmatter runs on the server and never ships to the browser, so the
 * service-role key stays server-side. Only call this from .astro frontmatter or API
 * routes — never from a client-side script.
 */
export function serverClient(locals: unknown) {
  const runtimeEnv = (locals as any)?.runtime?.env ?? {};
  const serviceKey =
    runtimeEnv.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  return createClient(
    runtimeEnv.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || SUPABASE_URL,
    serviceKey,
    { auth: { persistSession: false } }
  );
}

/** Shown in place of a Supabase error when the key is missing from the CF Pages env. */
export const MISSING_SERVICE_KEY = {
  message: 'SUPABASE_SERVICE_ROLE_KEY not set in CF Pages env',
};

// Type helpers for the new dashboard tables
export type Idea = {
  id: string;
  title: string;
  one_liner: string | null;
  source: string | null;
  state: 'intake' | 'analyzing' | 'validated' | 'active' | 'killed';
  fit_score: number | null;
  kill_criterion: string | null;
  activated_project_id: string | null;
  estimated_value_eur: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type SystemProposal = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  effort_hours: number | null;
  cost_eur_monthly: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'deferred' | 'rejected' | 'completed';
  rationale: string | null;
  created_at: string;
};

export type PriorityQueueItem = {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  scope: 'today' | 'this_week' | 'this_month';
  rank: number;
  is_blocker: boolean;
  blocked_by: string | null;
  completed_at: string | null;
  due_date: string | null;
};

export type Domain = {
  id: string;
  domain: string;
  parent_domain: string | null;
  project_id: string | null;
  registrar: string | null;
  dns_provider: string | null;
  expires_at: string | null;
  ssl_expires_at: string | null;
  is_active: boolean;
  health_status: string | null;
};

export type Subscription = {
  id: string;
  service_name: string;
  vendor: string | null;
  amount_eur: number | null;
  amount_usd: number | null;
  billing_cycle: 'monthly' | 'annual' | 'one-time' | 'usage' | null;
  next_billing_at: string | null;
  status: 'active' | 'paused' | 'cancelled' | 'failing';
  category: string | null;
  total_paid: number | null;
  notes: string | null;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  status: string;
  description: string | null;
  budget_eur: number | null;
  budget_hours: number | null;
};

export type Session = {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  status: 'active' | 'completed' | 'crashed';
  cwd: string | null;
  last_git_commit: string | null;
  summary: string | null;
  files_changed: string[];
  decisions: unknown[];
  archived_path: string | null;
  created_at: string;
};
