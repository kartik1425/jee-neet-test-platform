// scripts/test_score_insert.js
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

async function testScore() {
  const attemptId = 'afda871d-a85b-49f1-a143-c32875a18093';
  console.log('Testing scoring for attempt:', attemptId);

  // Check test_questions for this attempt's test
  const { data: attempt } = await supabase.from('attempts').select('*').eq('id', attemptId).single();
  console.log('Attempt:', attempt);

  const { data: testQuestions, error: tqErr } = await supabase
    .from("test_questions")
    .select(`
      id, question_id, section_id, order_index, marks, negative_marks, snapshot_data,
      questions (
        id, content_latex, explanation_latex, subject_id, chapter_id, topic_id,
        subjects(name),
        chapters(name),
        topics(name),
        question_options (id, option_key, content_latex, is_correct, order_index)
      )
    `)
    .eq("test_id", attempt.test_id)
    .order("order_index", { ascending: true });

  console.log('Test questions count:', testQuestions?.length, tqErr);

  // Test insert into test_results
  const { error: insErr } = await supabase.from("test_results").insert({
    attempt_id: attemptId,
    test_id: attempt.test_id,
    student_id: attempt.student_id,
    scoring_version: "v1.0.0",
    total_score: attempt.total_score || 10,
    maximum_score: 40,
    total_questions: 10,
    attempted_count: 10,
    correct_count: 4,
    incorrect_count: 6,
    unattempted_count: 0,
    accuracy_percentage: 40,
    total_time_spent_seconds: 60,
    subject_breakdown: [],
    chapter_breakdown: [],
    topic_breakdown: [],
    calculated_at: new Date().toISOString(),
  });

  console.log('Insert test_results result error:', insErr);

  // Check mistakes table insert
  const { error: mErr } = await supabase.from("mistakes").insert({
    student_id: attempt.student_id,
    attempt_id: attemptId,
    question_id: testQuestions[0]?.question_id,
    subject_id: '11111111-0000-0000-0000-000000000001',
    chapter_id: '22222222-0000-0000-0000-000000000001',
    category: 'CONCEPTUAL_ERROR',
    source: 'HEURISTIC_RULE',
    confidence: 'MEDIUM',
    notes: 'Test note',
    is_resolved: false
  });
  console.log('Insert mistakes result error:', mErr);
}

testScore().catch(console.error);
