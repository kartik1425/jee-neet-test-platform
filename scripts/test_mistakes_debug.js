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
  console.log('Testing mistakes table structure...');
  const { data: cols, error: cErr } = await supabase.from('mistakes').select('*').limit(1);
  console.log('Mistakes query:', cols, cErr);

  // Check attempt answers
  const { data: answers, error: aErr } = await supabase.from('attempt_answers').select('*').limit(5);
  console.log('Sample attempt answers:', answers, aErr);

  // Check test_questions
  const { data: tq, error: tqErr } = await supabase.from('test_questions').select('*, questions(*)').limit(2);
  console.log('Sample test_questions:', JSON.stringify(tq, null, 2), tqErr);
}

test();
