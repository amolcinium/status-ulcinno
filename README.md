# status.ulcinno.me — Ardi's Command Center

Single dashboard za sve aktivne projekte, idea pipeline, sistem health, finansije, sessions, i learning. Mobile-first PWA, dark mode, self-hosted on Cloudflare Pages.

## Stack

- **Astro 5** + **Tailwind 3** — static frontend
- **Cloudflare Pages** — hosting (free tier)
- **Cloudflare Access** + Google SSO — auth
- **Supabase** (`frsgzfzvdxswqjpdmcsd`) — data layer
- **n8n** — aggregation crons (Langfuse, Better Stack, Kuma, etc.)
- **PWA** — installable on mobile

## Sections

| Section | Status | Source |
|---------|--------|--------|
| Today + This Week | ✅ live | `priority_queue` |
| Pending Actions | ✅ live | `pending_actions` (mobile-to-VSC bridge) |
| Active Projects | ✅ live | `projects` |
| Ideas Pipeline | ✅ live | `ideas` (intake/analyzing/validated/active/killed) |
| Finance | ✅ live | `subscriptions` |
| Self-Check (my proposals) | ✅ live | `system_proposals` |
| System Health | 🟡 stub | static — Phase 7 wires real probes |
| Domains | ✅ live | `domains` |
| Sessions | 🟡 stub | Phase 3 wires `~/.claude/state/sessions/` |
| Learn | ✅ live | `learning_log` (empty until Karakeep+Miniflux wired) |

## Local dev

```bash
npm install
cp .env.example .env  # fill PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY
npm run dev
# → http://localhost:4321
```

## Deploy

1. Push to `maverick-sea/status-ulcinno` on GitHub
2. On CF Pages: Create project → Connect to Git → choose this repo
3. Build settings auto-detect Astro (build: `npm run build`, output: `dist`)
4. Add env vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
5. Deploy
6. Custom domain: settings → custom domains → add `status.ulcinno.me` (DNS auto-created)
7. Cloudflare Access → add app for `status.ulcinno.me` → Google SSO → email allowlist `ardi.mavric@gmail.com`

## Architecture

```
   [mobile/desktop]
         ↓
   status.ulcinno.me (CF Pages, Astro SSR)
         ↓ Supabase JS client (anon key, RLS-protected)
   Supabase Postgres (10 dashboard tables + existing KB)
         ↑
   n8n crons (15min): aggregate Langfuse/Kuma/CF API → tables
   Claude Code MCP: writes ideas/proposals/decisions
```

## Master plan reference

Full 6-week build plan: `~/.claude/projects/-mnt-c-PlatformWeb-openclaw-mcp/memory/plan-command-center-master.md`

## Co-built by

Ardi Mavriq + Claude (Opus 4.7) — 2026-05-20 onwards.


## Deployment

Deployed via Cloudflare Pages from `amolcinium/status-ulcinno` on auto-push.

First deploy: 2026-05-21T03:38:15Z
