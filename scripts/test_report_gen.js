// scripts/test_report_gen.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) process.env[m[1]] = m[2];
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testGen() {
  const attemptId = '5f757a52-6956-469d-af24-116753216aa9';
  console.log('Testing diagnostic report generation for:', attemptId);

  const { data: attemptData, error: attemptErr } = await supabase
    .from("attempts")
    .select(`
      *,
      test:tests (
        id,
        title,
        exam_type,
        duration_minutes,
        total_marks
      )
    `)
    .eq("id", attemptId)
    .single();

  console.log('Attempt data:', attemptData?.id, attemptErr);

  const { data: answersData, error: ansErr } = await supabase
    .from("attempt_answers")
    .select(`
      *,
      question:questions (
        *,
        options:question_options (*)
      )
    `)
    .eq("attempt_id", attemptId);

  console.log('Answers count:', answersData?.length, ansErr);

  const { data: subjectsData } = await supabase.from("subjects").select("*");
  const { data: chaptersData } = await supabase.from("chapters").select("*");
  const { data: topicsData } = await supabase.from("topics").select("*");

  // Load aggregator
  const { buildDeterministicAnalyticsPayload } = require('../src/lib/analytics/diagnosticAggregator');
  const payload = buildDeterministicAnalyticsPayload(
    attemptData,
    answersData,
    subjectsData || [],
    chaptersData || [],
    topicsData || []
  );

  console.log('Payload generated:', payload.total_score, payload.total_attempted, payload.subject_metrics);

  const { MockAIProvider } = require('../src/lib/ai/mockAdapter');
  const provider = new MockAIProvider();
  const rawReport = await provider.generateDiagnosticReport(payload);
  console.log('Raw AI Report generated:', rawReport.report_version, rawReport.summary);

  const { AIDiagnosticReportSchema } = require('../src/types/diagnosticReport');
  const validReport = AIDiagnosticReportSchema.parse(rawReport);
  console.log('Validation success:', !!validReport);

  // Try upserting to ai_analysis
  const analysisRecord = {
    attempt_id: attemptId,
    user_id: attemptData.student_id,
    test_id: attemptData.test_id,
    status: "COMPLETED",
    report_version: validReport.report_version || "v1.0.0",
    deterministic_payload: payload,
    ai_report: validReport,
    error_message: null,
    generation_time_ms: 120,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insErr } = await supabase.from("ai_analysis").upsert(analysisRecord, { onConflict: "attempt_id" });
  console.log('Insert into ai_analysis error:', insErr);
}

testGen().catch(console.error);
