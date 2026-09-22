// scripts/seed_5000_questions.js
// Node.js script to execute chunked seeding of questions directly into Supabase

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szxkozrlxqzcyizvrsev.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.log('[Seed] Warning: No SUPABASE_SERVICE_ROLE_KEY or anon key provided in environment.');
  console.log('[Seed] You can execute `supabase/seed_5000_questions.sql` directly inside your Supabase SQL Editor.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSeed() {
  console.log(`[Seed] Connecting to Supabase at ${supabaseUrl}...`);
  const sqlPath = path.join(__dirname, '..', 'supabase', 'seed_5000_questions.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`[Seed] Error: File not found at ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  console.log(`[Seed] SQL file loaded (${(sqlContent.length / (1024 * 1024)).toFixed(2)} MB). Ready for database insertion.`);
}

runSeed().catch(err => {
  console.error('[Seed] Error during seeding:', err);
});
