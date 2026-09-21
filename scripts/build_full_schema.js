const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

console.log('Found migrations to bundle:');
files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

let combinedSql = `-- ============================================================================
-- JEE/NEET TEST PLATFORM - FULL PRODUCTION SCHEMA INITIALIZATION
-- Target Project: szxkozrlxqzcyizvrsev (jee-neet-test-series)
-- Region: ap-south-1
-- ============================================================================

`;

for (const file of files) {
  combinedSql += `-- ============================================================================\n`;
  combinedSql += `-- >>>>> MIGRATION: ${file} <<<<<\n`;
  combinedSql += `-- ============================================================================\n\n`;
  combinedSql += fs.readFileSync(path.join(migrationsDir, file), 'utf-8') + '\n\n';
}

const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
if (fs.existsSync(seedPath)) {
  combinedSql += `-- ============================================================================\n`;
  combinedSql += `-- >>>>> SEED DATA: seed.sql <<<<<\n`;
  combinedSql += `-- ============================================================================\n\n`;
  combinedSql += fs.readFileSync(seedPath, 'utf-8') + '\n\n';
}

const outputPath = path.join(__dirname, '..', 'supabase', 'full_production_schema.sql');
fs.writeFileSync(outputPath, combinedSql);

console.log(`\nSuccessfully created: ${outputPath}`);
console.log(`Total character count: ${combinedSql.length}`);
