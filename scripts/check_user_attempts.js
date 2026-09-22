// scripts/check_user_attempts.js
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

async function check() {
  console.log('--- ATTEMPTS ---');
  const { data: attempts, error: aErr } = await supabase.from('attempts').select('*');
  console.log('Attempts count:', attempts?.length, attempts, aErr);

  console.log('\n--- TEST RESULTS ---');
  const { data: results, error: rErr } = await supabase.from('test_results').select('*');
  console.log('Test results count:', results?.length, results, rErr);

  console.log('\n--- MISTAKES ---');
  const { data: mistakes, error: mErr } = await supabase.from('mistakes').select('*');
  console.log('Mistakes count:', mistakes?.length, mistakes, mErr);

  console.log('\n--- TOPIC STATS ---');
  const { data: stats, error: sErr } = await supabase.from('student_topic_stats').select('*');
  console.log('Topic stats count:', stats?.length, stats, sErr);
}

check();
