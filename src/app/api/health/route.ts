import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Health Check API Endpoint
 *
 * Semantics:
 * - Liveness: Verifies Next.js server process is active and handling HTTP requests.
 * - Readiness: Verifies Supabase PostgreSQL database connectivity.
 * - AI Independence: Third-party AI API states are intentionally NOT evaluated here so
 *   transient external LLM hiccups never falsely mark the examination server as dead.
 *
 * Status Codes:
 * - 200 OK: Process alive and database connected.
 * - 503 Service Unavailable: Database connectivity failure.
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createClient();
    const { error: dbError } = await supabase.from("subjects").select("id").limit(1);

    if (dbError) {
      return NextResponse.json(
        {
          status: "degraded",
          liveness: "healthy",
          database: "unreachable",
          error: "Database connectivity check failed",
          timestamp,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        liveness: "healthy",
        database: "connected",
        timestamp,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        liveness: "healthy",
        database: "unreachable",
        error: err?.message || "Health probe failure",
        timestamp,
      },
      { status: 503 }
    );
  }
}
