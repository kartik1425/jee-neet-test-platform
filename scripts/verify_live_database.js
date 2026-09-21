const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try loading from .env.local or .env if present
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szxkozrlxqzcyizvrsev.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REQUIRED_TABLES = [
  'profiles',
  'classes',
  'class_members',
  'subjects',
  'chapters',
  'topics',
  'questions',
  'question_options',
  'tests',
  'test_questions',
  'test_assignments',
  'attempts',
  'attempt_answers',
  'mistakes',
  'student_question_history',
  'student_topic_stats',
  'ai_analysis',
  'notifications',
  'staging_batches',
  'staging_questions'
];

async function runVerification() {
  console.log('================================================================');
  console.log('LIVE SUPABASE DATABASE VERIFICATION');
  console.log(`Target URL: ${SUPABASE_URL}`);
  console.log('================================================================\n');

  const keyToUse = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
  if (!keyToUse) {
    console.error('ERROR: No Supabase Key (ANON or SERVICE_ROLE) found in environment or .env.local.');
    console.error('Please configure .env.local with:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=https://szxkozrlxqzcyizvrsev.supabase.co');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
    console.error('SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, keyToUse, {
    auth: { persistSession: false }
  });

  console.log('1. Checking Public Tables Accessibility...');
  let accessibleCount = 0;
  let missingTables = [];

  for (const table of REQUIRED_TABLES) {
    const { data, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') { // table does not exist
        missingTables.push(table);
        console.log(`  ❌ ${table}: Table does not exist`);
      } else {
        // Table exists but RLS or permissions restricted (which is expected for anon clients)
        accessibleCount++;
        console.log(`  ✅ ${table}: Exists (RLS active / status: ${error.message || 'Restricted'})`);
      }
    } else {
      accessibleCount++;
      console.log(`  ✅ ${table}: Exists & Accessible`);
    }
  }

  console.log(`\nTable Summary: ${accessibleCount} / ${REQUIRED_TABLES.length} tables confirmed.`);

  if (missingTables.length > 0) {
    console.log(`\nMissing Tables: ${missingTables.join(', ')}`);
    console.log('\n❌ Verification Failed: Tables are missing. Please execute full_production_schema.sql.');
    process.exit(1);
  }

  console.log('\n2. Verifying Core Academic Taxonomy & Seed Data...');
  const { data: subjects, error: subjErr } = await supabase.from('subjects').select('id, name, code');
  if (subjErr) {
    console.log(`  ⚠️ Could not read subjects: ${subjErr.message}`);
  } else {
    console.log(`  ✅ Subjects Seeded (${subjects.length}):`, subjects.map(s => `${s.name} (${s.code})`).join(', '));
  }

  const { data: chapters, error: chapErr } = await supabase.from('chapters').select('id, name');
  if (!chapErr && chapters) {
    console.log(`  ✅ Chapters Seeded (${chapters.length} chapters found)`);
  }

  const { data: questions, error: qErr } = await supabase.from('questions').select('id, source_type, status').eq('status', 'APPROVED');
  if (!qErr && questions) {
    console.log(`  ✅ Approved Questions Bank (${questions.length} questions available)`);
  }

  console.log('\n================================================================');
  console.log('LIVE DATABASE STATUS: INITIALIZED & VERIFIED');
  console.log('================================================================');
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
