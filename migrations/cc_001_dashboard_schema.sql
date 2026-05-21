-- cc_001_dashboard_schema.sql
-- Command Center dashboard schema — 10 new tables
-- Idempotent (IF NOT EXISTS). Additive only — no DROP, no destructive ops.
-- Apply via: psql "$SUPABASE_DB_URL" -f cc_001_dashboard_schema.sql

BEGIN;

-- =====================================================
-- 1. ideas — biz idea pipeline
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  one_liner TEXT,
  source TEXT,
  state TEXT NOT NULL DEFAULT 'intake' CHECK (state IN ('intake', 'analyzing', 'validated', 'active', 'killed')),
  fit_score NUMERIC,
  kill_criterion TEXT,
  kill_reason TEXT,
  killed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  activated_project_id UUID REFERENCES public.projects(id),
  estimated_value_eur NUMERIC,
  estimated_effort_hours NUMERIC,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ideas_state ON public.ideas(state);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON public.ideas(created_at DESC);

-- =====================================================
-- 2. idea_evaluations — versioned biz-eval snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS public.idea_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  score NUMERIC,
  triangulation JSONB,
  pre_mortem TEXT,
  adversarial_critique TEXT,
  comparable_failures JSONB,
  base_rate NUMERIC,
  verdict TEXT,
  evaluator TEXT DEFAULT 'claude-code',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_idea ON public.idea_evaluations(idea_id, version DESC);

-- =====================================================
-- 3. system_proposals — my proposals waiting for Ardi
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  effort_hours NUMERIC,
  cost_eur_monthly NUMERIC DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'deferred', 'rejected', 'completed')),
  rationale TEXT,
  source TEXT,
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  decision_note TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.system_proposals(status, priority);

-- =====================================================
-- 4. priority_queue — today + this week + this month
-- =====================================================
CREATE TABLE IF NOT EXISTS public.priority_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id),
  scope TEXT NOT NULL CHECK (scope IN ('today', 'this_week', 'this_month')),
  rank INTEGER NOT NULL DEFAULT 100,
  is_blocker BOOLEAN DEFAULT FALSE,
  blocked_by TEXT,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priority_active ON public.priority_queue(scope, rank) WHERE completed_at IS NULL;

-- =====================================================
-- 5. capability_snapshots — LLM/system state over time
-- =====================================================
CREATE TABLE IF NOT EXISTS public.capability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated', 'experimental')),
  capabilities JSONB,
  limitations JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capabilities_category ON public.capability_snapshots(category, snapshot_at DESC);

-- =====================================================
-- 6. domains — all Ardi's domains + subdomains
-- =====================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  parent_domain TEXT,
  project_id UUID REFERENCES public.projects(id),
  registrar TEXT,
  dns_provider TEXT,
  expires_at TIMESTAMPTZ,
  ssl_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  health_status TEXT,
  last_checked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_parent ON public.domains(parent_domain);
CREATE INDEX IF NOT EXISTS idx_domains_expires ON public.domains(expires_at) WHERE is_active = TRUE;

-- =====================================================
-- 7. subscriptions — paid SaaS tracker
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  vendor TEXT,
  amount_eur NUMERIC,
  amount_usd NUMERIC,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual', 'one-time', 'usage')),
  next_billing_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'failing')),
  category TEXT,
  project_id UUID REFERENCES public.projects(id),
  detected_via TEXT,
  first_charged_at TIMESTAMPTZ,
  total_paid NUMERIC,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next ON public.subscriptions(next_billing_at) WHERE status = 'active';

-- =====================================================
-- 8. revenue_streams — per-project revenue tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  source TEXT NOT NULL,
  type TEXT CHECK (type IN ('recurring', 'one-time', 'commission', 'grant', 'service')),
  amount_eur NUMERIC NOT NULL,
  occurred_at DATE NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('expected', 'invoiced', 'confirmed', 'received')),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_project ON public.revenue_streams(project_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON public.revenue_streams(occurred_at DESC);

-- =====================================================
-- 9. learning_log — what we learned, how it changes the system
-- =====================================================
CREATE TABLE IF NOT EXISTS public.learning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  source TEXT,
  source_url TEXT,
  category TEXT,
  applicability TEXT[],
  action_taken TEXT,
  proposal_id UUID REFERENCES public.system_proposals(id),
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_category ON public.learning_log(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_embedding_hnsw ON public.learning_log USING hnsw (embedding vector_cosine_ops);

-- =====================================================
-- 10. pending_actions — mobile/claude.ai actions queued
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('dashboard', 'claude_mobile', 'mobile_voice', 'pwa', 'manual')),
  action_type TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'rejected')),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_status ON public.pending_actions(status, created_at);

-- =====================================================
-- updated_at trigger function (shared)
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

-- Apply trigger to tables with updated_at column
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ideas', 'system_proposals', 'priority_queue',
    'domains', 'subscriptions'
  ] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
      CREATE TRIGGER trg_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================
-- Grants (anon + authenticated for dashboard read, service_role for cron writes)
-- =====================================================
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ideas', 'idea_evaluations', 'system_proposals', 'priority_queue',
    'capability_snapshots', 'domains', 'subscriptions', 'revenue_streams',
    'learning_log', 'pending_actions'
  ] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- RLS policies — open to authenticated (single-user dashboard for now)
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ideas', 'idea_evaluations', 'system_proposals', 'priority_queue',
    'capability_snapshots', 'domains', 'subscriptions', 'revenue_streams',
    'learning_log', 'pending_actions'
  ] LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS %I_authenticated_read ON public.%I;
      CREATE POLICY %I_authenticated_read ON public.%I
        FOR SELECT TO authenticated USING (true);
    ', t, t, t, t);
  END LOOP;
END $$;

COMMIT;

-- Verification
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'ideas', 'idea_evaluations', 'system_proposals', 'priority_queue',
    'capability_snapshots', 'domains', 'subscriptions', 'revenue_streams',
    'learning_log', 'pending_actions'
  )
ORDER BY table_name;
