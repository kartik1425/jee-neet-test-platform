# Production Runbook & Operational Guide

## 1. System Deployment Architecture

The platform is architected for deployment across two managed cloud environments:
1. **Next.js Web Application**: Hosted on **Vercel** (Serverless Functions + Static Assets).
2. **Database & Storage**: Hosted on **Supabase** (PostgreSQL with Row Level Security + S3-compatible Object Storage).
3. **AI Intelligence Engine**: Managed via **Google Gemini API** (Gemini 3.5 Flash).

---

## 2. Layered Rate Limiting & Abuse Protection

| Layer | Implementation | Scope / Responsibility |
| :--- | :--- | :--- |
| **Edge / WAF** | Vercel Firewall / WAF | IP-level volumetric rate limiting on public endpoints (`/login`, `/signup`, `/api/health`). |
| **Authentication** | Supabase Auth + RBAC | Server-side role enforcement (`STUDENT`, `TEACHER`, `ADMIN`). |
| **Application Layer** | Server Action Checks | Per-user cooldowns and input size caps for expensive AI generation and ingestion. |
| **Process-Local Memory** | `checkInMemoryRateLimit()` | **Best-effort per-instance optimization** to dampen bursts; not a global boundary. |
| **Exam Exemption** | Excluded | Answer autosaves (`saveAnswerAction`) are **never** rate-limited to prevent exam disruptions. |

---

## 3. Database Migrations & Rollback Procedures

### Applying Migrations
Migrations are sequentially numbered in `supabase/migrations/` and must be applied in order:
```bash
# Using Supabase CLI
supabase db push
# Or applying directly to remote database:
supabase db remote commit
```

### Rollback Strategy
1. **Forward Fix Preference**: In production PostgreSQL, schema rollbacks should be applied as forward additive migrations (e.g. `20260921000011_revert_xyz.sql`).
2. **Snapshot Protection**: Published tests freeze question text and options in `test_questions.snapshot_data`. Schema changes to the question bank never mutate past or ongoing attempts.

---

## 4. Backup, Storage & Disaster Recovery Strategy

> [!IMPORTANT]
> **Plan Capability Disclosure**: Supabase project backup capabilities depend strictly on the subscription plan.

### A. Free Tier Database Backup (Manual / Scripted Logical Export)
* Free tier projects do **NOT** have automated daily backups or Point-in-Time Recovery (PITR).
* **Backup Procedure**: Execute periodic logical database dumps using the Supabase CLI:
  ```bash
  # Export full PostgreSQL schema and data
  supabase db dump --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f backup_$(date +%Y%m%d).sql
  ```
* **Offsite Storage**: Store dump files encrypted in secondary cloud storage (e.g., AWS S3, Google Cloud Storage).

### B. Pro / Team Tier Database Backup (Automated)
* Pro tier includes **automated daily backups** retained for 7 days.
* **Point-in-Time Recovery (PITR)** is an optional paid add-on enabling granular restoration down to the second.

### C. Object Storage Backup (Separate from Database)
* **Crucial Note**: Supabase database backups do **NOT** include files stored in Supabase Storage buckets (e.g., uploaded ingestion PDFs, student documents).
* **Storage Backup Procedure**: Sync object storage buckets independently:
  ```bash
  # Sync storage bucket to offsite backup
  aws s3 sync s3://[SUPABASE_BUCKET] s3://[BACKUP_BUCKET] --endpoint-url [SUPABASE_STORAGE_URL]
  ```

---

## 5. Live Exam Network Resilience & Recovery (Phase 4 Model)

The platform guarantees exam reliability during student connectivity issues without relying on a fake offline architecture:

```text
Student Attempting Exam
       ↓
Network Hiccup / Drop
       ↓
Client preserves unsynced answers locally in browser storage
       ↓
Heartbeat timer retries synchronization with exponential backoff
       ↓
Server authoritative end-time (server_end_time) remains immutable
       ↓
Upon reconnection, delta answers commit cleanly to PostgreSQL
       ↓
Final server-authoritative submission and deterministic scoring
```

---

## 6. AI Outage & Degraded Mode Handling

Core examination and evaluation systems are strictly air-gapped from AI dependencies:
1. **Test Taking & Submission**: Operates 100% locally on Supabase PostgreSQL. Unaffected by Google Gemini outages.
2. **Deterministic Scoring**: Computed purely via mathematics. Scores and accuracy are available immediately upon submission.
3. **AI Diagnostics & Mistakes**: If Gemini experiences transient latency or downtime, diagnostic reports fail gracefully with retry options. Core results remain viewable.

---

## 7. Incident Response & Secret Rotation

In the event of suspected credential compromise:
1. **Gemini API Key**: Generate a new API key in Google AI Studio $\rightarrow$ Update `GEMINI_API_KEY` in Vercel Environment Variables $\rightarrow$ Redeploy $\rightarrow$ Revoke old key.
2. **Supabase Service Role Key**: Rotate in Supabase Dashboard $\rightarrow$ Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel $\rightarrow$ Redeploy.
3. **Audit Logs**: Inspect Supabase Auth audit logs for anomalous role escalation attempts.
