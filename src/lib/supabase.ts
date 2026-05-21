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
