# Security Specification & Threat Model

## 1. Authentication & Role-Based Access Control (RBAC)

### User Roles
* **STUDENT**: Can access assigned tests, self-tests, their own live attempts, personal test history, mistake logs, and personalized recommendations.
* **TEACHER**: Can manage classes, assign tests, monitor active student batches, view class analytics and student reports.
* **ADMIN / SUPER_ADMIN**: Full system access including Question Bank CRUD, AI ingestion pipeline, test blueprint authoring, system configuration.

### Critical Auth Invariants
* **No Client Role Escalation**: Public sign-up creates strictly `STUDENT` profiles. `TEACHER` and `ADMIN` roles must be provisioned through secure server-side scripts or administrative invitations.
* **Protected Server Actions & Route Handlers**: All mutations verify session token, user ID, and role permissions server-side.

---

## 2. Row Level Security (RLS) Policies

All PostgreSQL tables enforce Row Level Security:
1. `profiles`: Read-only public summary; update allowed only by profile owner; role modification restricted to service role/admin.
2. `questions`:
   - Students can only read questions assigned to active/completed tests or approved self-practice banks.
   - `question_options.is_correct` and `explanation_latex` are hidden from students until an attempt is in status `SUBMITTED` or `AUTO_SUBMITTED`.
3. `attempts`:
   - Students can insert their own attempts for valid assigned/self tests.
   - Students can only update attempts in `IN_PROGRESS` state.
   - Calculated marks and submission statuses are modifiable strictly via server scoring procedures.
4. `test_assignments`:
   - Students can only query tests explicitly assigned to their `class_id` or `student_id`.

---

## 3. Examination Integrity & Anti-Tampering

* **Server-Authoritative Clock**: Time remaining is computed as:
  $$\text{Remaining} = \text{Duration} - (\text{Current Server Time} - \text{Attempt Started At})$$
  Client clock adjustments cannot manipulate test duration.
* **Submissions**: Final submission validates whether the attempt was submitted within the allowed grace period.
* **Idempotent Autosave**: Heartbeat submissions use monotonic versioning / last saved timestamps to prevent out-of-order state overwrites.

---

## 4. Key Management & Environment Hygiene
* Client-side bundles must only contain `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
* `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are kept exclusively server-side.
