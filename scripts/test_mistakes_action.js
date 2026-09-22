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

async function testQuery() {
  const studentId = 'd0fcdaed-b358-4cc8-b6d5-a8d9f1a6d402';
  const { data: rawMistakes, error: fetchErr } = await supabase
    .from("mistakes")
    .select(`
      *,
      subject:subjects (id, name),
      chapter:chapters (id, name),
      topic:topics (id, name),
      question:questions (id, content_latex, difficulty, options:question_options(*)),
      attempt:attempts (id, started_at, submitted_at, total_score, accuracy_percentage),
      test:tests (id, title, exam_type)
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  console.log('Query result count:', rawMistakes?.length);
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
  } else {
    console.log('Sample joined mistake item:');
    console.log(JSON.stringify(rawMistakes[0], null, 2));
  }
}

testQuery();
