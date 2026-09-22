// scripts/test_diagnostic_query.js
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

async function test() {
  console.log('Testing attempts query...');
  const { data: attempts, error: aErr } = await supabase.from('attempts').select('id, student_id, test_id').limit(1);
  console.log('Attempts:', attempts, aErr);

  if (attempts && attempts.length > 0) {
    const attemptId = attempts[0].id;
    console.log('Testing attempt_answers query for attemptId:', attemptId);
    
    // Test 1: with nested query
    const { data: ans1, error: e1 } = await supabase
      .from("attempt_answers")
      .select(`
        *,
        question:questions (
          *,
          options:question_options (*)
        )
      `)
      .eq("attempt_id", attemptId);
    console.log('Nested query result:', ans1?.length, 'Error:', e1);

    // Test 2: checking ai_analysis table
    const { data: aiData, error: aiErr } = await supabase
      .from('ai_analysis')
      .select('*')
      .eq('attempt_id', attemptId);
    console.log('ai_analysis result:', aiData, 'Error:', aiErr);
  }
}

test();
