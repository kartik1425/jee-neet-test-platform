# Architecture Specification: Private AI-Powered JEE/NEET Test Platform

## 1. System Overview

The **JEE/NEET Test Platform** is an enterprise-grade examination and analytics platform tailored for educational institutions (schools, coaching centers) to deliver high-stakes practice and mock examinations under authentic exam constraints.

The platform separates the **deterministic examination engine** (authoritative timing, question presentation, answer persistence, deterministic mark computation) from the **asynchronous AI intelligence engine** (question classification, mistake diagnosis, multi-dimensional analytics, tailored recommendations).

---

## 2. High-Level Architecture

```mermaid
flowchart TB
    subgraph Client Layer
        WebStudent[Student Web Client - Next.js/React]
        WebAdmin[Admin & Teacher Portal - Next.js/React]
    end

    subgraph Application Layer - Next.js App Router
        AuthRoute[/api/auth - Supabase Auth Handler]
        ExamEngine[/api/exam - Authoritative Attempt & Scoring Engine]
        AdminRoute[/api/admin - Question Bank & Management Engine]
        AnalyticsRoute[/api/analytics - Performance & Mistake Analysis]
        AIRoute[/api/ai - AI Orchestrator & Provider Abstraction]
    end

    subgraph Data & Storage Layer
        PostgreSQL[(Supabase PostgreSQL Database)]
        Storage[(Supabase Object Storage - Media/Docs)]
    end

    subgraph AI Service Layer
        AIProviderAbstraction[AI Provider Interface]
        GeminiAdapter[Google Gemini 2.5/Flash/Pro Adapter]
        FutureAdapters[Future LLM Adapters: OpenAI/Anthropic/Local]
    end

    WebStudent --> AuthRoute
    WebStudent --> ExamEngine
    WebStudent --> AnalyticsRoute

    WebAdmin --> AuthRoute
    WebAdmin --> AdminRoute
    WebAdmin --> AnalyticsRoute
    WebAdmin --> AIRoute

    ExamEngine --> PostgreSQL
    AdminRoute --> PostgreSQL
    AdminRoute --> Storage
    AnalyticsRoute --> PostgreSQL

    AIRoute --> AIProviderAbstraction
    AIProviderAbstraction --> GeminiAdapter
    AIProviderAbstraction --> FutureAdapters
    AIRoute --> PostgreSQL
```

---

## 3. Technology Stack

* **Frontend Framework**: Next.js 15+ (App Router), React 19, TypeScript
* **Styling & UI**: Tailwind CSS, Lucide Icons, KaTeX (for mathematical LaTeX rendering)
* **Backend Runtime**: Next.js Server Components, Server Actions, Edge/Node Route Handlers
* **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth
* **Validation**: Zod schema validation on client and server boundaries
* **AI Provider**: Google Gemini API via unified `AIProvider` abstraction layer
* **Testing**: Vitest / Playwright

---

## 4. Key Architectural Decisions & Principles

### A. Reliability & Air-Gapped Test Execution
* Active test sessions **never** depend on synchronous third-party AI calls.
* Once a test is generated and published, it is 100% executable from local PostgreSQL cache even if AI APIs encounter downtime or rate limits.
* All AI evaluations (mistake analysis, study plan generation) occur asynchronously post-submission or on background queues.

### B. Server-Authoritative Test Timing & Integrity
* Test durations and end times are maintained authoritatively on the database/server.
* Refreshing the browser, switching tabs, or accidental closures calculate remaining time strictly based on `server_now - attempt_started_at`.
* Answers are autosaved with optimistic local confirmation and transactional remote persistence.

### C. Deterministic Scoring Pipeline
* AI **never** calculates raw marks, rankings, or percentiles.
* Scoring operates through a pure, server-authoritative mathematical function:
  $$\text{Final Marks} = \sum_{\text{all questions}} \text{marks\_awarded}$$
  $$\text{Accuracy} = \begin{cases} \frac{\text{Correct}}{\text{Attempted}} \times 100 & \text{if Attempted} > 0 \\ 0 & \text{if Attempted} = 0 \end{cases}$$
* Marking rules (e.g. $+4 / -1 / 0$, $+3 / -0.5 / 0$, $+2 / 0 / 0$) are configured at the **test level** and evaluated against the immutable question snapshot created at test publication time.
* Version 1 focuses strictly on **MCQ questions** with extensible architecture for other question types later.
* The AI engine receives only finalized deterministic statistics to interpret diagnostic insights.

### D. Multi-Tenancy & School-Scale Role-Based Access Control (RBAC)
* **Roles**: `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN`.
* Strict Row Level Security (RLS) guarantees a student cannot inspect unassigned tests, answer keys of active tests, or peers' private data.

---

## 5. Major System Modules

1. **Auth & Identity Module (`/lib/auth`)**: Role enforcement, session verification, user profiles.
2. **Question Bank Engine (`/lib/questions`)**: CRUD, LaTeX equations, multi-subject taxonomy (Subject $\rightarrow$ Chapter $\rightarrow$ Topic), difficulty rating, PYQ provenance.
3. **Test Authoring & Scheduling (`/lib/tests`)**: Blueprint configuration, question assignment, duration, window scheduling, class assignment.
4. **Exam Engine (`/lib/exam`)**: Live attempt manager, state recovery, heartbeat autosave, answer delta commits, final submission pipeline.
5. **Deterministic Scoring Engine (`/lib/scoring`)**: Marks computation, negative marking rules, subject-wise aggregation, accuracy metrics.
6. **Analytics & Mistake Engine (`/lib/analytics`)**: Question-level accuracy, time spent per question, error taxonomy (Conceptual, Calculation, Misread, Time Pressure).
7. **Student Self-Test Practice Engine (`/lib/practice`)**: Deterministic question selection engine for student private self-practice tests. Features multi-subject balancing, repeat-prevention priority tiering (never attempted > older attempts > attempted pool with opt-in), approved PYQ provenance validation, transparent shortage reporting, and snapshot freezing without any LLM dependence.
8. **AI Question Ingestion & Staging Engine (`/lib/ingestion`)**: Document parsing (CSV, TXT, DOCX, PDF), KaTeX math normalizer, LLM-assisted question extraction, Zod output schema enforcement, multi-tier duplicate detector, unverified PYQ provenance protection, and teacher/admin human review queue before insertion into authoritative question bank.
9. **AI Test Paper Generator Engine (`/lib/tests/aiPaperGenerator.ts`)**: Natural language blueprint extraction via Gemini JSON mode, taxonomy mapper against database records, hybrid selection engine, hard constraint filtering, soft preference difficulty curves, recent test question exclusion, transparent shortage diagnostics, non-hallucination verification, and integration into existing Phase 6 publication flow.
10. **AI Provider Abstraction (`/lib/ai`)**: Unified interface for prompt generation, structured schema output parsing, retry policies, and fallback telemetry.
11. **AI Six-Section Diagnostic Test Analysis (`/lib/diagnostic`)**: Multi-dimensional student test evaluation providing 6 distinct diagnostic perspectives (score overview, time allocation & efficiency, question difficulty breakdown, topic mastery evidence with strict thresholds, 10-category error classification, and concrete revision recommendations). Built on 100% authoritative database numbers with Zod validation.
12. **Persistent Mistake Engine & Longitudinal Error Taxonomy (`/lib/mistakes`)**: Longitudinal error tracking preserving student problem-solving mistake histories across tests, calculating deterministic trend directions, detecting recurring misconception patterns, and maintaining an auditable teacher review and correction loop.
13. **Teacher & Class Analytics Engine (`/lib/teacher`)**: Real-time batch-level faculty console computing mean/median scores, participation/completion rates, question struggle & misconception analysis, topic mastery evidence summaries, 10-category mistake matrices, and CSV data export without LLM dependencies.
