// scripts/seed_direct_batches.js
// Direct streaming seeder that inserts questions & options in batches via Supabase API or PostgreSQL

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if present
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szxkozrlxqzcyizvrsev.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.log('-------------------------------------------------------------');
  console.log('No SUPABASE_SERVICE_ROLE_KEY or ANON_KEY found in .env.local.');
  console.log('To seed via SQL Editor directly in your browser:');
  console.log('1. First run `supabase/seed_taxonomy.sql` in Supabase SQL Editor (~8KB).');
  console.log('2. Then run `supabase/seed_part1.sql`, `seed_part2.sql`, etc.');
  console.log('-------------------------------------------------------------');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log(`Connecting to ${SUPABASE_URL}...`);
  console.log('Seeding ready.');
}

main();
